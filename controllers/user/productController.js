const Product = require("../../models/Product");
const Category = require("../../models/Category");
const { sanitizeInput } = require("../../utils/validation");

// List products with search, filter, sort, and pagination
const listProducts = async (req, res, next) => {
  try {
    const {
      createPagination,
      buildQueryParams,
    } = require("../../utils/pagination");

    const searchQuery = req.query.search || "";
    const categoryFilter = req.query.category || "";
    const brandFilter = req.query.brand || "";
    const sortBy = req.query.sort || "newest";
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_VALUE;

    let filter = {
      isActive: true,
      isListed: true,
      isDeleted: false,
      salePrice: { $gte: minPrice, $lte: maxPrice },
    };

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

    if (categoryFilter) {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(categoryFilter)) {
        filter.categoryId = categoryFilter;
      } else {
        try {
          const category = await Category.findOne({
            name: new RegExp(`^${sanitizeInput(categoryFilter)}$`, "i"),
            isListed: true,
            isDeleted: false,
          });
          if (category) {
            filter.categoryId = category._id;
          }
        } catch (error) {
          console.error("Error finding category:", error);
        }
      }
    }

    if (brandFilter) {
      filter.brand = new RegExp(sanitizeInput(brandFilter), "i");
    }

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

    const totalProducts = await Product.countDocuments(filter);

    const pagination = createPagination(
      req.query,
      totalProducts,
      "USER_PRODUCTS"
    );

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

        if (end - start + 1 < maxVisible) {
          start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }

      return pages;
    };

    const pageNumbers = generatePageNumbers(
      pagination.currentPage,
      pagination.totalPages
    );

    let query = Product.find(filter)
      .populate("categoryId", "name")
      .skip(pagination.skip)
      .limit(pagination.limit);

    if (sortBy === "name-az" || sortBy === "name-za") {
      query = query.sort(sortObject).collation({ locale: "en", strength: 2 });
    } else {
      query = query.sort(sortObject);
    }

    const products = await query;

    const categories = await Category.find({
      isListed: true,
      isDeleted: false,
    }).sort({ name: 1 });

    for (let category of categories) {
      const productCount = await Product.countDocuments({
        categoryId: category._id,
        isActive: true,
        isListed: true,
        isDeleted: false,
      });
      category.productCount = productCount;
    }

    const brands = await Product.distinct("brand", {
      isActive: true,
      isListed: true,
      isDeleted: false,
    });

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

    const queryParams = buildQueryParams(req.query, [
      "search",
      "category",
      "brand",
      "sort",
      "minPrice",
      "maxPrice",
    ]);

    const isAjax = req.headers["x-requested-with"] === "XMLHttpRequest";

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
      baseUrl: "/products",
      queryParams,
      additionalCSS: ["/css/user/products.css", "/css/pagination.css"],
    };

    if (isAjax) {
      res.render("user/products", renderData);
    } else {
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
    
    const product = await Product.findById(productId)
      .populate("categoryId")
      .populate({
        path: "reviews",
        match: { status: 'approved', isDeleted: false },
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "user",
          select: "fullname"
        }
      });

    if (!product) {
      return res.redirect("/products");
    }

    if (!product.isActive) {
      return res.redirect("/products");
    }

    if (!product.isListed) {
      return res.redirect("/products");
    }

    if (product.isDeleted) {
      return res.redirect("/products");
    }

    if (!product.categoryId) {
      return res.redirect("/products");
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      categoryId: product.categoryId._id,
      isActive: true,
      isListed: true,
      isDeleted: false,
    })
      .limit(4)
      .sort({ "ratings.average": -1 });

    res.render("user/product-detail", {
      product,
      relatedProducts,
      isLoggedIn: !!req.session.user,
      additionalCSS: ["/css/user/product-detail.css"],
    });
  } catch (error) {
    console.error("❌ Error viewing product:", error);
    console.error("Stack trace:", error.stack);
    next(error);
  }
};

// Export functions
module.exports = {
  listProducts,
  viewProduct,
};
