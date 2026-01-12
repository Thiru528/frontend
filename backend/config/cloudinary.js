const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'resumes',
        allowedFormats: ['pdf', 'doc', 'docx', 'txt'], // CamelCase is correct for v4
        resource_type: 'raw' // Important for PDFs
    },
});

const upload = multer({ storage: storage });

module.exports = {
    cloudinary,
    upload
};
