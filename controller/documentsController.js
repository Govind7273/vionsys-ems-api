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

// ✅ Get all Documents for a User
exports.getAllDocumentsUser = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return handleError(res, 400, "Invalid employee ID format");
    }

    const employeeObjectId = new mongoose.Types.ObjectId(employeeId);
    const documents = await Documents.find({ user: employeeObjectId });

    res.status(200).json({
      status: "success",
      data: documents,
    });
  } catch (error) {
    handleError(res, 500, error.message);
  }
};

// Add a new document for an employee
exports.addDocument = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { title } = req.body;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return handleError(res, 400, "Invalid employee ID format");
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return handleError(res, 404, "Employee not found");
    }

    if (!req.file) {
      return handleError(res, 400, "Document file is required");
    }

    const folderName = "DocumentEMS";
    const uploadResult = await uploadOnCloudinary(req.file.path, folderName).catch((err) => {
      console.error("Cloudinary upload error:", err);
      return null;
    });
    if (!uploadResult) {
      return handleError(res, 500, "Cloudinary upload failed");
    }

    // Ensure HTTPS URL
    const secureImageURL = uploadResult.replace(/^http:\/\//, "https://");

    const document = new Documents({
      user: employeeId,
      title: title,
      imageURL: secureImageURL,
    });

    await document.save().catch((err) => {
      console.error("Error saving document:", err);
      return handleError(res, 500, "Failed to save document");
    });

    // Add document to the employee’s list
    employee.documents.push(document._id);
    await employee.save();

    res.status(201).json({ message: "Document added successfully", document });
  } catch (error) {
    handleError(res, 500, error.message);
  }
};

// Update an existing document
exports.updateDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title } = req.body;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return handleError(res, 400, "Invalid document ID format");
    }

    const document = await Documents.findById(documentId);
    if (!document) {
      return handleError(res, 404, "Document not found");
    }

    const folderName = "DocumentEMS";

    if (req.file) {
      await removeFromCloudinary(document.imageURL, folderName).catch((err) =>
        console.error("Cloudinary delete error:", err)
      );

      const uploadResult = await uploadOnCloudinary(req.file.path, folderName).catch((err) => {
        console.error("Cloudinary upload error:", err);
        return null;
      });

      if (!uploadResult) {
        return handleError(res, 500, "Cloudinary upload failed");
      }

      document.imageURL = uploadResult.replace(/^http:\/\//, "https://");
    }

    if (title) {
      document.title = title;
    }

    await document.save();
    res.status(200).json({ message: "Document updated successfully", document });
  } catch (error) {
    handleError(res, 500, error.message);
  }
};

// Delete a document
exports.deleteDocument = async (req, res) => {
  try {
    const { employeeId, documentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(documentId)) {
      return handleError(res, 400, "Invalid ID format");
    }

    const document = await Documents.findById(documentId);
    if (!document) {
      return handleError(res, 404, "Document not found");
    }

    const folderName = "DocumentEMS";

    await removeFromCloudinary(document.imageURL, folderName).catch((err) =>
      console.error("Cloudinary delete error:", err)
    );

    await Documents.findByIdAndDelete(documentId);

    await User.findByIdAndUpdate(employeeId, {
      $pull: { documents: documentId },
    });

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    handleError(res, 500, error.message);
  }
};
