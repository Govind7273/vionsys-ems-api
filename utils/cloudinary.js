const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({ 
    cloud_name: 'dugtxvaxh', 
    api_key: '988148827526966', 
    api_secret: 'HnnQjR2ATv0A8QyOim5patEwdHg' 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        console.log("File is uploaded on cloud"+response);
        fs.unlinkSync(localFilePath);
        return response.url;
    } catch (error) {
        fs.unlinkSync(localFilePath); // Remove the locally saved temporary file as the upload operation failed
        return null;
    }
}

module.exports = { uploadOnCloudinary };
