const multer = require('multer');
const {storage} = require('../config/cloudinary');
//const { CloudinaryStorage } = require("multer-storage-cloudinary");


// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//       folder: "images", // Optional folder name
//       allowed_formats: ["jpg", "png", "jpeg",]
//     },
//   });
  
  const upload = multer({ storage });
  
  module.exports = upload;