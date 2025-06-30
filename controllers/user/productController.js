const Product = require("../../models/Product");
const Category = require("../../models/Category");
const { sanitizeInput } = require("../../utils/validation");

// List products with search, filter, sort, and pagination
const listProducts = async (req, res, next) => {
  try {
    const { createPagination, buildQueryParams } = require('../../utils/pagination');

    // Get query parameters
    const searchQuery = req.query.search || "";
    const categoryFilter = req.query.category || "";
    const brandFilter = req.query.brand || "";
    const sortBy = req.query.sort || "newest";
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_VALUE;

    // Build filter object
    let filter = {
      isActive: true,
      isListed: true,
      isDeleted: false,
      salePrice: { $gte: minPrice, $lte: maxPrice },
    };

    // Add search filter
    if (searchQuery.trim()) {
      const regex = new RegExp(sanitizeInput(searchQuery), "i");
      filter.$or = [
        { name: regex },
        { description: regex },
        { brand: regex },
        { modelNumber: regex },
        { category: regex },
        { tags: { $in: [regex] } },
      ];
    }

    // Add category filter
    if (categoryFilter) {
      // Check if categoryFilter is a valid ObjectId or a category name
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(categoryFilter)) {
        // It's a valid ObjectId, use it directly
        filter.categoryId = categoryFilter;
      } else {
        // It's a category name, find the corresponding ObjectId
        try {
          const category = await Category.findOne({
            name: new RegExp(`^${sanitizeInput(categoryFilter)}$`, "i"),
            isListed: true,
            isDeleted: false,
          });
          if (category) {
            filter.categoryId = category._id;
          }
          // If category not found, the filter will return no results (which is correct)
        } catch (error) {
          console.error("Error finding category:", error);
          // Continue without category filter if there's an error
        }
      }
    }

    // Add brand filter
    if (brandFilter) {
      filter.brand = new RegExp(sanitizeInput(brandFilter), "i");
    }

    // Build sort object
    let sortObject = {};
    switch (sortBy) {
      case "price-low":
        sortObject = { salePrice: 1 };
        break;
      case "price-high":
        sortObject = { salePrice: -1 };
        break;
      case "name-az":
        sortObject = { name: 1 };
        break;
      case "name-za":
        sortObject = { name: -1 };
        break;
      case "popularity":
        sortObject = { "ratings.count": -1 };
        break;
      case "rating":
        sortObject = { "ratings.average": -1 };
        break;
      case "newest":
      default:
        sortObject = { createdAt: -1 };
        break;
    }

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filter);

    // Create pagination object
    const pagination = createPagination(req.query, totalProducts, 'USER_PRODUCTS');

    // Generate page numbers array for the new pagination template
    const generatePageNumbers = (currentPage, totalPages, maxVisible = 5) => {
      const pages = [];

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        const halfVisible = Math.floor(maxVisible / 2);
        let start = Math.max(1, currentPage - halfVisible);
        let end = Math.min(totalPages, start + maxVisible - 1);

        // Adjust start if we're near the end
        if (end - start + 1 < maxVisible) {
          start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }

      return pages;
    };

    const pageNumbers = generatePageNumbers(pagination.currentPage, pagination.totalPages);

    // Get products with pagination
    let query = Product.find(filter)
      .populate("categoryId", "name")
      .skip(pagination.skip)
      .limit(pagination.limit);

    // Apply sorting with proper collation for alphabetical sorts
    if (sortBy === "name-az" || sortBy === "name-za") {
      query = query.sort(sortObject).collation({ locale: 'en', strength: 2 });
    } else {
      query = query.sort(sortObject);
    }

    const products = await query;

    // Get all categories for filter dropdown with product counts
    const categories = await Category.find({
      isListed: true,
      isDeleted: false,
    }).sort({ name: 1 });

    // Add product count for each category
    for (let category of categories) {
      const productCount = await Product.countDocuments({
        categoryId: category._id,
        isActive: true,
        isListed: true,
        isDeleted: false,
      });
      category.productCount = productCount;
    }

    // Get unique brands for filter dropdown
    const brands = await Product.distinct("brand", {
      isActive: true,
      isListed: true,
      isDeleted: false,
    });

    // Get price range for filters
    const priceRange = await Product.aggregate([
      { $match: { isActive: true, isListed: true, isDeleted: false } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$salePrice" },
          maxPrice: { $max: "$salePrice" },
        },
      },
    ]);

    const priceRangeData = priceRange[0] || { minPrice: 0, maxPrice: 10000 };

    // Build query parameters for pagination links
    const queryParams = buildQueryParams(req.query, ['search', 'category', 'brand', 'sort', 'minPrice', 'maxPrice']);

    // Check if this is an AJAX request
    const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';

    const renderData = {
      products,
      categories,
      brands: brands.sort(),
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      totalProducts: pagination.totalItems,
      pageNumbers,
      searchQuery,
      categoryFilter,
      brandFilter,
      sortBy,
      minPrice: req.query.minPrice || priceRangeData.minPrice,
      maxPrice: req.query.maxPrice || priceRangeData.maxPrice,
      priceRangeData,
      hasNextPage: pagination.hasNextPage,
      hasPrevPage: pagination.hasPrevPage,
      nextPage: pagination.nextPage,
      prevPage: pagination.prevPage,
      pagination,
      baseUrl: '/products',
      queryParams,
      additionalCSS: ['/css/user/products.css', '/css/pagination.css']
    };

    if (isAjax) {
      // For AJAX requests, return just the products section
      res.render("user/products", renderData);
    } else {
      // For regular requests, return the full page
      res.render("user/products", renderData);
    }
  } catch (error) {
    console.error("Error listing products:", error);
    next(error);
  }
};

// View single product
const viewProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    console.log("🔍 Viewing product:", productId);

    // Handle demo products
    if (productId.startsWith("demo")) {
      const demoProducts = {
        demo1: {
          _id: "demo1",
          name: "Phoenix Elite Pro",
          brand: "Phoenix",
          model: "PEP-2024",
          modelNumber: "PEP-2024",
          category: "Over-Ear",
          color: "Matte Black",
          driverSize: "40mm",
          connectivity: "Bluetooth 5.0 + 3.5mm",
          noiseCancellation: true,
          microphoneIncluded: true,
          warranty: "1 Year",
          images: [
            "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          ],
          salePrice: 299.99,
          regularPrice: 349.99,
          ratings: { average: 5, count: 124 },
          stock: 15,
          offer: 15,
          isNew: false,
          isListed: true,
          isDeleted: false,
          description:
            "Experience premium audio with the Phoenix Elite Pro. Featuring advanced noise cancellation, superior comfort, and exceptional sound quality that brings your music to life.",
          specifications: {
            driverSize: "40mm",
            impedance: "32 Ohms",
            frequencyResponse: "20Hz - 20kHz",
            connectivity: "Bluetooth 5.0 + 3.5mm",
            batteryLife: "30 hours",
            noiseCancellation: true,
            weight: "280g",
            color: "Matte Black",
          },
          categoryId: {
            _id: "demo-category",
            name: "Premium Headphones",
            description: "High-end audio equipment",
            isListed: true,
          },
        },
        demo2: {
          _id: "demo2",
          name: "Phoenix Studio White",
          brand: "Phoenix",
          model: "PSW-2024",
          modelNumber: "PSW-2024",
          category: "Over-Ear",
          color: "Pearl White",
          driverSize: "50mm",
          connectivity: "Bluetooth 5.2",
          noiseCancellation: true,
          microphoneIncluded: true,
          warranty: "2 Years",
          images: [
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          ],
          salePrice: 399.99,
          regularPrice: 449.99,
          ratings: { average: 4.8, count: 89 },
          stock: 8,
          offer: 11,
          isNew: true,
          isListed: true,
          isDeleted: false,
          description:
            "Premium studio-grade headphones in elegant pearl white finish. Perfect for professional audio work and audiophile listening.",
          specifications: {
            driverSize: "50mm",
            impedance: "32 Ohms",
            frequencyResponse: "15Hz - 25kHz",
            connectivity: "Bluetooth 5.2 + USB-C",
            batteryLife: "40 hours",
            noiseCancellation: true,
            weight: "320g",
            color: "Pearl White",
          },
          categoryId: {
            _id: "demo-category",
            name: "Premium Headphones",
            description: "High-end audio equipment",
            isListed: true,
          },
        },
        demo3: {
          _id: "demo3",
          name: "Phoenix Sport Red",
          brand: "Phoenix",
          model: "PSR-2024",
          modelNumber: "PSR-2024",
          category: "On-Ear",
          color: "Crimson Red",
          driverSize: "40mm",
          connectivity: "Bluetooth 5.0",
          noiseCancellation: false,
          microphoneIncluded: true,
          warranty: "1 Year",
          images: [
            "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          ],
          salePrice: 199.99,
          regularPrice: 249.99,
          ratings: { average: 4.5, count: 156 },
          stock: 25,
          offer: 20,
          isNew: false,
          isListed: true,
          isDeleted: false,
          description:
            "Dynamic sport headphones in bold crimson red. Designed for active lifestyles with sweat-resistant materials.",
          specifications: {
            driverSize: "40mm",
            impedance: "32 Ohms",
            frequencyResponse: "20Hz - 20kHz",
            connectivity: "Bluetooth 5.0",
            batteryLife: "25 hours",
            noiseCancellation: false,
            weight: "220g",
            color: "Crimson Red",
          },
          categoryId: {
            _id: "demo-category",
            name: "Sport Headphones",
            description: "Active lifestyle audio",
            isListed: true,
          },
        },
      };

      const demoProduct = demoProducts[productId];
      if (!demoProduct) {
        return res.redirect("/products");
      }

      // Mock related products
      const relatedProducts = [];

      // Generate breadcrumbs for demo product
      const breadcrumbs = [
        { name: "Home", url: "/" },
        { name: "Products", url: "/products" },
        { name: demoProduct.categoryId.name, url: "/products" },
        { name: demoProduct.name, url: null },
      ];

      return res.render("user/product-detail", {
        product: demoProduct,
        relatedProducts,
        breadcrumbs,
        additionalCSS: ['/css/user/product-detail.css', '/css/pagination.css']
      });
    }

    // Regular product handling
    // Find product and populate category
    console.log("📦 Fetching product from database...");
    const product = await Product.findById(productId).populate(
      "categoryId",
      "name description isListed isDeleted"
    );

    console.log("📊 Product found:", !!product);
    if (product) {
      console.log("📋 Product details:");
      console.log("   - Name:", product.name);
      console.log("   - Active:", product.isActive);
      console.log("   - Listed:", product.isListed);
      console.log("   - Deleted:", product.isDeleted);
      console.log(
        "   - Category:",
        product.categoryId ? product.categoryId.name : "No category"
      );
      console.log(
        "   - Category Listed:",
        product.categoryId ? product.categoryId.isListed : "N/A"
      );
    }

    // Check if product exists and is available
    if (!product) {
      console.log("❌ Product not found, redirecting to /products");
      return res.redirect("/products");
    }

    if (!product.isActive) {
      console.log("❌ Product is not active, redirecting to /products");
      return res.redirect("/products");
    }

    if (!product.isListed) {
      console.log("❌ Product is not listed, redirecting to /products");
      return res.redirect("/products");
    }

    if (product.isDeleted) {
      console.log("❌ Product is deleted, redirecting to /products");
      return res.redirect("/products");
    }

    // Check if category is available
    if (!product.categoryId) {
      console.log("❌ Product has no category, redirecting to /products");
      return res.redirect("/products");
    }

    if (!product.categoryId.isListed) {
      console.log(
        "❌ Product category is not listed, redirecting to /products"
      );
      return res.redirect("/products");
    }

    console.log("✅ Product passed all checks, rendering product detail page");

    // Get related products (same category, excluding current product)
    const relatedProducts = await Product.find({
      categoryId: product.categoryId._id,
      _id: { $ne: productId },
      isActive: true,
      isListed: true,
      isDeleted: false,
    })
      .populate("categoryId", "name")
      .limit(4)
      .sort({ "ratings.average": -1 });

    // Generate breadcrumbs
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Products", url: "/products" },
      {
        name: product.categoryId.name,
        url: `/products?category=${product.categoryId._id}`,
      },
      { name: product.name, url: null },
    ];

    console.log("🎨 Rendering product detail page...");
    res.render("user/product-detail", {
      product,
      relatedProducts,
      breadcrumbs,
      additionalCSS: ['/css/user/product-detail.css', '/css/pagination.css']
    });
    console.log("✅ Product detail page rendered successfully");
  } catch (error) {
    console.error("❌ Error viewing product:", error);
    console.error("Stack trace:", error.stack);
    next(error);
  }
};

module.exports = {
  listProducts,
  viewProduct,
};
