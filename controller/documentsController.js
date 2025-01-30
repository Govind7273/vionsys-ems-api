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
    const employeeObjectId = new mongoose.Types.ObjectId(employeeId);
    const documents = await Documents.find({ user: employeeObjectId });

    // Ensure all URLs use HTTPS
    documents.forEach((doc) => {
      if (doc.imageURL.startsWith("http://")) {
        doc.imageURL = doc.imageURL.replace("http://", "https://");
      }
    });

    res.status(200).json({
      status: "success",
      data: documents,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 404, error.message);
  }
};

// ✅ Add a new document
exports.addDocument = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { title } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Document file is required" });
    }

    const folderName = "DocumentEMS";
    const uploadResult = await uploadOnCloudinary(req.file.path, folderName);

    if (!uploadResult || !uploadResult.secure_url || !uploadResult.public_id) {
      return res.status(500).json({ message: "Cloudinary upload failed" });
    }

    const document = new Documents({
      user: employeeId,
      title,
      imageURL: uploadResult.secure_url, // ✅ Store only the secure_url
      cloudinaryId: uploadResult.public_id, // ✅ Store the public_id for deletion
    });

    await document.save();
    employee.documents.push(document._id);
    await employee.save();

    res.status(201).json({ message: "Document added successfully", document });
  } catch (error) {
    console.error("Error during document upload:", error.message);
    res.status(500).json({ message: "Failed to add document" });
  }
};

// ✅ Update an existing document
exports.updateDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title } = req.body;

    const document = await Documents.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const folderName = "DocumentEMS";

    if (req.file) {
      if (document.cloudinaryId) {
        await removeFromCloudinary(document.cloudinaryId, folderName);
      }

      const result = await uploadOnCloudinary(req.file.path, folderName);
      if (!result || !result.secure_url || !result.public_id) {
        return res.status(500).json({ message: "Cloudinary upload failed" });
      }

      document.imageURL = result.secure_url;
      document.cloudinaryId = result.public_id;
    }

    if (title) {
      document.title = title;
    }

    await document.save();
    res.status(200).json({ message: "Document updated successfully", document });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update document" });
  }
};

// ✅ Delete a document
exports.deleteDocument = async (req, res) => {
  try {
    const { employeeId, documentId } = req.params;

    const document = await Documents.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const folderName = "DocumentEMS";
    if (document.cloudinaryId) {
      await removeFromCloudinary(document.cloudinaryId, folderName);
    }

    await Documents.findByIdAndDelete(documentId);
    await User.findByIdAndUpdate(employeeId, {
      $pull: { documents: documentId },
    });

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete document" });
  }
};
