const Documents = require("../models/documentsModel");
const User = require("../models/userModels");
const mongoose = require("mongoose");

const {
  removeFromCloudinary,
  uploadOnCloudinary,
} = require("../utils/cloudinary");

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}

//Get all Documents
exports.getAllDocumentsUser = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employeeObjectId = new mongoose.Types.ObjectId(employeeId);
    const documents = await Documents.find({ user: employeeObjectId });
    if (!documents || documents.length === 0) {
      return res
        .status(404)
        .json({ message: "Employee not found or no documents available" });
    }
    res.status(200).json({
      status: "success",
      data: documents,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 404, error.message);
  }
};

// Add a new document for an employee
exports.addDocument = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { title } = req.body;

    // Check if the employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if the file exists in the request
    if (!req.file) {
      return res.status(400).json({ message: "Document image is required" });
    }
    const folderName = "DocumentEMS";
    // Upload file to Cloudinary and get secure_url and public_id
    const uploadResult = await uploadOnCloudinary(req.file.path, folderName);
    console.log("File path for upload:", req.file.path);
    console.log("Cloudinary upload result:", uploadResult);

    // Ensure the upload result contains both secure_url and public_id
    //|| !uploadResult.public_id
    if (!uploadResult) {
      return res.status(500).json({ message: "Cloudinary upload failed" });
    }

    // Create a new document entry in the database with Cloudinary info
    const document = new Documents({
      user: employeeId,
      title: title, // Ensure the title is provided
      imageURL: uploadResult, // Store the Cloudinary URL
      //cloudinaryId: uploadResult.public_id // Store the Cloudinary public ID
    });

    console.log("DataDocument: ", document); // Log the document before saving
    await document.save();

    // Add the document to the employee’s document list
    employee.documents.push(document._id);
    await employee.save();

    res.status(201).json({ message: "Document added successfully", document });
  } catch (error) {
    console.error("Error during document upload:", error.message);
    res.status(500).json({ message: "Failed to add document" });
  }
};

// Update an existing document for an employee
exports.updateDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title } = req.body;
    console.log("Dcument : ", documentId);
    // Find the document to be updated
    const document = await Documents.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    const folderName = "DocumentEMS";
    // Update Cloudinary image if a new file is uploaded
    if (req.file) {
      // Remove old image from Cloudinary
      console.log(document.imageURL);
      await removeFromCloudinary(document.imageURL, folderName);

      // Upload new image to Cloudinary
      const result = await uploadOnCloudinary(req.file.path, folderName);

      // Update document with the new image URL and Cloudinary public_id
      document.imageURL = result;
    }

    // Update other fields like title
    if (title) {
      document.title = title;
    }
    await document.save();
    res
      .status(200)
      .json({ message: "Document updated successfully", document });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update document" });
  }
};

// Delete a document for an employee
exports.deleteDocument = async (req, res) => {
  try {
    const { employeeId, documentId } = req.params;

    // Find the document to be deleted
    const document = await Documents.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    const folderName = "DocumentEMS";

    console.log("Cloudinary Delete File : ", document.imageURL);
    // Delete the document image from Cloudinary
    await removeFromCloudinary(document.imageURL, folderName);
    // Remove the document from the database
    await Documents.findByIdAndDelete(documentId);

    // Optionally, remove the document reference from the employee's document list (assuming this field exists in User model)
    await User.findByIdAndUpdate(employeeId, {
      $pull: { documents: documentId },
    });

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete document" });
  }
};
