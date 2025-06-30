// Image cropping utility functions
const initCropper = (image, aspectRatio = 1) => {
    return new Cropper(image, {
        aspectRatio: aspectRatio,
        viewMode: 2,
        dragMode: 'move',
        background: true,
        autoCropArea: 0.8,
        responsive: true,
        restore: false,
        guides: true,
        center: true,
        highlight: true,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
    });
};

const getCroppedCanvas = (cropper) => {
    return cropper.getCroppedCanvas({
        width: 800,
        height: 800,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });
};

const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

const createFileFromBlob = (blob, fileName) => {
    return new File([blob], fileName, { type: blob.type });
};

module.exports = {
    initCropper,
    getCroppedCanvas,
    dataURLtoBlob,
    createFileFromBlob
}; 