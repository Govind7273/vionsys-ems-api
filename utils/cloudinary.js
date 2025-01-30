const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_CLOUD_KEY, 
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET
});

const uploadOnCloudinary = async (localFilePath, folderName) => {
  try {
      if (!localFilePath) return null;

      // Upload the file on Cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
          resource_type: "auto",
          folder: folderName ? folderName : "",
      });

      if (!response || !response.secure_url) {
          console.error("Cloudinary upload failed with response:", response);
          return null;
      }

      // Force HTTPS
      const secureUrl = response.secure_url.replace(/^http:\/\//, "https://");

      fs.unlinkSync(localFilePath); // Delete local file after upload
      return secureUrl;
  } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      fs.unlinkSync(localFilePath); // Delete local file after failed upload
      return null;
  }
};


const removeFromCloudinary = async (url, folderName) => {
    try {
      if (!url) {
        throw new Error("Empty url to delete the image from cloudinary");
      }  
      // Extract the publicId from the URL
      const publicId = url.split('/').pop().split('.').slice(0, -1).join('');
      console.log(publicId);
  
      // Properly concatenate the folderName and publicId
      const publicIdUrl = (folderName ? folderName + "/" : "") + publicId;
      console.log("remvCloudinary file : ", publicIdUrl);
  
      // Call Cloudinary to destroy the file
      const response = await cloudinary.uploader.destroy(publicIdUrl);
      if (!response) throw new Error('Not able to delete');
      return response;
    } catch (error) {
      console.log(error);
      return null;
    }
  };
  
module.exports = { uploadOnCloudinary ,removeFromCloudinary };