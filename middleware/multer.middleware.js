const multer = require('multer');
// Define storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp'); // Destination directory where files will be stored
    },
    filename: function (req, file, cb) {
        // Generate unique filename for each uploaded file
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null,uniqueSuffix+file.originalname);
    }
});

// Initialize multer with the defined storage
module.exports.upload = multer({ storage });

