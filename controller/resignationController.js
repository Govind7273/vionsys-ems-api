const Resignations = require("../models/resignationModel");
const AppError = require("../utils/appError");
const getAllResignationforAdmin = require("../utils/getAllResignationforAdmin");
const User = require("../models/userModels");
const { sendNotificationToOne } = require("../utils/sendNotificationToUser");

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}

exports.createResignation = async (req, res) => {
  try {
    const resignation = await Resignations.create(req.body);
    console.log(req.body);

    // Fetch User Deatils who submitted the Resignation
    const user = await User.findById(resignation.user);
    if (!user) {
      throw new Error("User not Found");
    }

    // Fetch all admins or a specific admin
    const admins = await User.find({ role: "admin" }); // Assuming 'role' is a field that specifies user roles
    if (admins.length === 0) throw new Error("No admin found!");

    // Send notification to all admins
    admins.forEach(async (admin) => {
      const adminNotificationToken = admin?.notificationToken || "";

      const notificationPayload = {
        title: "Resignation Request",
        description: `${user.firstName} ${user.lastName} has applied for Resignation.`,
      };
      console.log(notificationPayload);

      await sendNotificationToOne(adminNotificationToken, notificationPayload);
    });

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
    const { resignationId, userId, status, note, adminId } = req.body; // Include adminId in the request body
    if (!resignationId || !userId || !status || !note || !adminId) {
      throw new AppError(400, "All fields are required, including adminId");
    }

    const resignation = await Resignations.findOne({
      _id: resignationId,
      user: userId,
    });
    if (!resignation) {
      throw new AppError(404, "Resignation not found");
    }

    // Prevent updating status if it is already canceled
    if (resignation.resignationStatus === "Canceled") {
      throw new AppError(400, "Resignation is canceled, status can't be updated");
    }

    // Check resignation status to ensure it can be updated
    if (status === "Approved") {
      if (resignation.resignationStatus === "Approved") {
        throw new AppError(400, "Resignation already approved");
      }
      if (resignation.resignationStatus === "Rejected") {
        throw new AppError(400, "Resignation is rejected, can't approve");
      }

      // Calculate exitDate if applicable
      let exitDate = null;
      if (
        resignation.resignationType === "Resign with Notice period" &&
        resignation.noticePeriodDays
      ) {
        const approvedDate = new Date();
        exitDate = new Date(approvedDate);
        exitDate.setDate(approvedDate.getDate() + resignation.noticePeriodDays);
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

    // Fetch the user to get their notification token
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    // Fetch the admin to get their name for the notification
    const admin = await User.findById(adminId);
    if (!admin) {
      throw new AppError(404, "Admin not found");
    }

    const userNotificationToken = user.notificationToken || "";

    // Create a notification payload
    const notificationPayload = {
      title: `Resignation ${status}`,
      description: `Your resignation request has been ${status.toLowerCase()} by ${
        admin.firstName
      } ${admin.lastName}.`,
    };

    // Send notification to the user
    await sendNotificationToOne(userNotificationToken, notificationPayload);

    res.status(200).json({
      message: `Resignation ${status.toLowerCase()} successfully`,
      data: resignation,
    });
  } catch (error) {
    handleError(res, error.statusCode || 500, error.message);
  }
};

//----------------------------

// Function to cancel resignation by user
exports.cancelResignationByUser = async (req, res) => {
  try {
    const { resignationId, userId, reason } = req.body;
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

    // Fetch User Details who cancelled the resignation
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    // Fetch all admins or a specific admin
    const admins = await User.find({ role: "admin" }); // Assuming 'role' is a field that specifies user roles
    if (admins.length === 0) throw new AppError(404, "No admin found!");

    // Send notification to all admins
    admins.forEach(async (admin) => {
      const adminNotificationToken = admin?.notificationToken || "";

      const notificationPayload = {
        title: "Resignation Canceled",
        description: `${user.firstName} ${user.lastName} has canceled their resignation.`,
      };

      await sendNotificationToOne(adminNotificationToken, notificationPayload);
    });

    res.status(200).json({
      message: "Resignation canceled successfully",
      canceledResignation,
    });
  } catch (error) {
    console.error(error); // Add logging for better debugging
    handleError(res, error.statusCode || 500, error.message);
  }
};
