const Resignation = require("../models/resignationModel");
const Resignations = require("../models/resignationModel");
const AppError = require("../utils/appError");
function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}

exports.createResignation = async (req, res) => {
  try {
    const resignation = await Resignation.create(req.body);
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
    const resignation = await Resignation.find({ user: userId });
    res.status(200).json({
      status: "success",
      data: resignation,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 404, error.message);
  }
};

// Function to get all resignations
exports.getAllResignation = async (req, res) => {
  try {
    const resignations = await Resignation.find();
    res.status(200).json({
      status: "success",
      data: resignations,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 404, error.message);
  }
};

// Function to Approve Resignation
exports.resignationApprovedByAdmin = async (req, res) => {
  try {
    const { resignationId, userId, note } = req.body;

    if (!resignationId || !userId || !note) {
      throw new AppError(400, "All fields are required");
    }

    const resignationdata = await Resignations.findOne({ _id: resignationId });
    if (!resignationdata) {
      throw new AppError(404, "Resignation not found");
    }

    if (resignationdata.resignationStatus === "Approved") {
      throw new AppError(400, "Resignation already approved");
    }
    if (resignationdata.resignationStatus === "Rejected") {
      throw new AppError(400, "Resignation is rejected, can't approve");
    }

    // Calculate exitDate manually
    let exitDate = null;
    if (resignationdata.resignationType === "Resign with Notice period" && resignationdata.noticePeriodDays) {
      const approvedDate = new Date();
      exitDate = new Date(approvedDate);
      exitDate.setDate(approvedDate.getDate() + resignationdata.noticePeriodDays);
    }

    const approvedResignation = await Resignations.findOneAndUpdate(
      { _id: resignationId, user: userId },
      {
        $set: {
          resignationStatus: "Approved",
          adminApprovedDate: Date.now(),
          noteByAdmin: note,
          exitDate: exitDate // Set the calculated exitDate
        },
      },
      { new: true }
    );

    res.status(200).json({
      message: "Resignation approved",
      approvedResignation,
    });
  } catch (error) {
    handleError(res, error.statusCode, error.message);
  }
};


exports.resignationRejectedByAdmin = async (req, res) => {
  try {
    const { resignationId, userId, note } = req.body;

    if (!resignationId || !userId || !note) {
      throw new AppError(400, "All fields are required");
    }

    const resignationdata = await Resignations.findOne({ _id: resignationId });
    if (!resignationdata) {
      throw new AppError(404, "Resignation not found");
    }
    if (resignationdata.resignationStatus === "Rejected") {
      throw new AppError(400, "Resignation already Rejected");
    }
    if (resignationdata.resignationStatus === "Approved") {
      throw new AppError(400, "Resignation is Approved , can't rejected");
    }
    

    const approvedResignation = await Resignations.findOneAndUpdate(
      { _id: resignationId, user: userId },
      {
        $set: {
          resignationStatus: "Rejected",
          adminRejectedDate:Date.now(),
          noteByAdmin: note,
        },
      },
      { new: true }
    );

    res.status(200).json({
      message: "Resignation Rejected",
      approvedResignation,
    });
  } catch (error) {
    handleError(res, error.statusCode, error.message);
  }
};