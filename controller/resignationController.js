const Resignations = require("../models/resignationModel");
const AppError = require("../utils/appError");
const getAllResignationforAdmin = require("../utils/getAllResignationforAdmin");

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}

exports.createResignation = async (req, res) => {
  try {
    const resignation = await Resignations.create(req.body);
    res.status(201).json({
      status: "success",
      data: resignation,
    });
  } catch (error) {
    console.error("Error:", error);
    handleError(res, 400, error.message);
  }
};

// Function to get resignation by user ID

exports.getResignationFromUserId = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const resignation = await Resignations.find({ user: userId });
    res.status(200).json({
      status: "success",
      data: resignation,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 404, error.message);
  }
};

// Function to get all resignations --admin
exports.getAllResignation = async (req, res) => {
  try {
    const resignations = await getAllResignationforAdmin();
    res.status(200).json({
      status: "success",
      data: resignations,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 404, error.message);
  }
};

// Function to update resignation status and note by admin
exports.updateResignationStatus = async (req, res) => {
  try {
    const { resignationId, userId, status, note } = req.body;

    if (!resignationId || !userId || !status || !note) {
      throw new AppError(400, "All fields are required");
    }

    const resignation = await Resignations.findOne({ _id: resignationId, user: userId });
    if (!resignation) {
      throw new AppError(404, "Resignation not found");
    }

    if (status === "Approved") {
      if (resignation.resignationStatus === "Approved") {
        throw new AppError(400, "Resignation already approved");
      }
      if (resignation.resignationStatus === "Rejected") {
        throw new AppError(400, "Resignation is rejected, can't approve");
      }

      // Calculate exitDate manually if applicable
      let exitDate = null;
      if (resignation.resignationType === "Resign with Notice period" && resignation.noticePeriodDays) {
        const approvedDate = new Date();
        exitDate = new Date(approvedDate);
        exitDate.setDate(approvedDate.getDate() + resignation.noticePeriodDays);
        console.log(exitDate)
      }

      resignation.resignationStatus = "Approved";
      resignation.adminApprovedDate = Date.now();
      resignation.noteByAdmin = note;
      resignation.exitDate = exitDate;

    } else if (status === "Rejected") {
      if (resignation.resignationStatus === "Rejected") {
        throw new AppError(400, "Resignation already rejected");
      }
      if (resignation.resignationStatus === "Approved") {
        throw new AppError(400, "Resignation is approved, can't reject");
      }

      resignation.resignationStatus = "Rejected";
      resignation.adminRejectedDate = Date.now();
      resignation.noteByAdmin = note;
    } else {
      throw new AppError(400, "Invalid status");
    }

    await resignation.save();

    res.status(200).json({
      message: `Resignation ${status.toLowerCase()} successfully`,
      data: resignation,
    });
  } catch (error) {
    console.error(error); // Add logging for better debugging
    handleError(res, error.statusCode || 500, error.message);
  }
};

//----------------------------

// Function to cancel resignation by user
exports.cancelResignationByUser = async (req, res) => {
  try {
    const { resignationId, userId, reason } = req.body;

    console.log(req.body);
    if (!resignationId || !userId || !reason) {
      throw new AppError(400, "All fields are required");
    }

    const resignation = await Resignations.findOne({
      _id: resignationId,
      user: userId,
    });

    if (!resignation) {
      throw new AppError(404, "Resignation not found");
    }

    if (resignation.resignationStatus !== "Pending") {
      throw new AppError(400, "Only pending resignations can be canceled");
    }

    const canceledResignation = await Resignations.findOneAndUpdate(
      { _id: resignationId, user: userId },
      {
        $set: {
          resignationStatus: "Canceled",
          resignationCancle: true,
          cancleResignationReason: reason,
          cancleResignationDate: Date.now(),
        },
      },
      { new: true }
    );

    res.status(200).json({
      message: "Resignation canceled successfully",
      canceledResignation,
    });
  } catch (error) {
    console.error(error); // Add logging for better debugging
    handleError(res, error.statusCode || 500, error.message);
  }
};
