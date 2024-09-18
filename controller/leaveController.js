const User = require("../models/userModels");
const Leaves = require("../models/leavesmodel");
const LeavesCount = require("../models/leaveCountModel");
const getUserHistory = require("../utils/GetLeaveHistory");
const AppError = require("../utils/appError");
const { sendNotificationToOne } = require("../utils/sendNotificationToUser");

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}

const upadateFieldFunction = (leaveType, leaveDays) => {
  const decrement = leaveDays || 1;
  let updateFields = {};
  switch (leaveType) {
    case "Sick Leave":
    case "Casual Leave":
    case "Floater Leave":
    case "Privilage Leave":
      updateFields = {
        $inc: {
          [leaveType.toLowerCase().replace(/\s+/g, "")]: -decrement,
          pendingLeaves: 1,
          totalLeaves: 1,
        },
      };
      break;
    case "Unpaid Leave":
      updateFields = {
        $inc: { unpaidleave: decrement, pendingLeaves: 1, totalLeaves: 1 },
      };
      break;
    default:
      break;
  }
  return updateFields;
};

exports.createLeaveRequest = async (req, res) => {
  try {
    const { userId, ...leaveData } = req.body;
    // console.log(leaveData)

    if (!userId) {
      throw new Error("userId is required");
    }

    const userExist = await User.findOne({ _id: userId });
    if (!userExist) {
      throw new Error("User with this ID not found");
    }

    if (!leaveData?.leaveStart || !leaveData?.leaveEnd) {
      throw new Error("leaveStart and leaveEnd dates are required");
    }

    const currentTime = new Date();
    const currentHour = currentTime.getHours();

    // Subtract one day from the current date
    const oneDayBefore = new Date();
    oneDayBefore.setDate(currentTime.getDate() - 1);

    // Extract the day from the current date and leave start date
    const currentDay = (currentTime.getDate() - 1);

    // Create a Date object for the leave start date and subtract one day
    const leaveStartDate = new Date(leaveData.leaveStart);
    leaveStartDate.setDate(leaveStartDate.getDate() - 1);
    const leaveStartDay = leaveStartDate.getDate();

    const leaveEndDate = new Date(leaveData.leaveEnd);
    leaveEndDate.setDate(leaveEndDate.getDate() - 1);
    const leaveEndDay = leaveEndDate.getDate();

    if (
    leaveStartDay < currentDay ||
    leaveEndDay < currentDay
    ) {
      
      throw new Error("Leave dates must be in the future");
    }

    if (new Date(leaveData?.leaveStart) > new Date(leaveData?.leaveEnd)) {
      throw new Error("StartDate must be before EndDate");
    }

    const alreadyAppliedForLeave = await Leaves.findOne({
      user: userId,
      leaveStatus: { $in: ["Pending", "Approved", "Expired"] },
      $or: [
        {
          leaveStart: {
            $gte: leaveData?.leaveStart,
            $lte: leaveData?.leaveEnd,
          },
        },
        {
          leaveEnd: { $gte: leaveData?.leaveStart, $lte: leaveData?.leaveEnd },
        },
        {
          $and: [
            { leaveStart: { $lte: leaveData?.leaveStart } },
            { leaveEnd: { $gte: leaveData?.leaveEnd } },
          ],
        },
      ],
    });

    if (alreadyAppliedForLeave) {
      throw new Error("Already applied for leave in this duration");
    }

    const updateFields = upadateFieldFunction(
      leaveData?.leaveType,
      leaveData?.leaveDays
    );

    if (Object.keys(updateFields).length > 0) {
      const leavesCount = await LeavesCount.findOneAndUpdate(
        { user: userId },
        { user: userId },
        { upsert: true, new: true }
      );

      const leaveTypeField = leaveData?.leaveType
        .toLowerCase()
        .split(" ")
        .join("");

      if (leaveTypeField !== "unpaidleave") {
        if (
          leavesCount[leaveTypeField] === 0 ||
          leaveData?.leaveDays > leavesCount[leaveTypeField]
        ) {
          throw new Error(
            `Cannot apply for ${leaveData?.leaveType}. Insufficient leave balance.`
          );
        }
      }

      const leave = await Leaves.create({ user: userId, ...leaveData });
      if (!leave) {
        throw new Error("Error while sending leave request");
      }

      await LeavesCount.findOneAndUpdate({ user: userId }, updateFields, {
        upsert: true,
      });

      // Fetch all admins or a specific admin
      const admins = await User.find({ role: "admin" }); // Assuming 'role' is a field that specifies user roles
      if (admins.length === 0) throw new Error("No admin found!");

      // Send notification to all admins
      admins.forEach(async (admin) => {
        const adminNotificationToken = admin?.notificationToken || "";

        const notificationPayload = {
          title: "Leave Request Received",
          description: `${userExist.firstName} ${userExist.lastName} has applied for ${leave.leaveType}.`,
        };

        await sendNotificationToOne(
          adminNotificationToken,
          notificationPayload
        );
      });
    }

    res.status(201).json({ message: "Leave request is submitted" });
  } catch (error) {
    console.error("Error:", error);
    handleError(res, 400, error.message);
  }
};

exports.cancelLeaveRequest = async (req, res) => {
  try {
    const { user, cancelReason } = req.body;
    const leaveId = req.params.leaveId;

    const theUserLeave = await Leaves.findOne({ _id: leaveId });
    if (!theUserLeave) {
      throw new Error("Leave request not found.");
    }

    const currentDate = new Date();
    const leaveStartDate = new Date(theUserLeave.leaveStart);
    const leaveEndDate = new Date(theUserLeave.leaveEnd);

    // Reset hours, minutes, seconds, and milliseconds for date comparison
    currentDate.setHours(0, 0, 0, 0);
    leaveStartDate.setHours(0, 0, 0, 0);

    // Check if leave can be cancelled based on the date and time
    const currentHour = new Date().getHours();

    if (currentDate > leaveStartDate) {
      throw new Error("Leave has already started and cannot be cancelled.");
    }

    if (currentDate.toDateString() === leaveStartDate.toDateString() && currentHour >= 14) {
      throw new Error("Leave on the current date can only be cancelled before 2 PM.");
    }

    // Only pending or approved leaves can be cancelled
    if (theUserLeave.leaveStatus !== "Pending" && theUserLeave.leaveStatus !== "Approved") {
      throw new Error("Only pending or approved leave requests can be cancelled.");
    }

    const leaveTypeField = theUserLeave.leaveType.toLowerCase().split(" ").join("");

    let updateremove = {};

    if (theUserLeave.leaveStatus === "Pending") {
      updateremove = {
        $inc: { pendingLeaves: -1, cancelledLeaves: 1 }
      };
    } else if (theUserLeave.leaveStatus === "Approved") {
      updateremove = {
        $inc: { approvedLeaves: -1, cancelledLeaves: 1 }
      };
    }

    // Adjust leave type count if necessary
    if (leaveTypeField !== "unpaidleave") {
      updateremove.$inc[leaveTypeField] = theUserLeave.leaveDays;
    } else {
      updateremove.$inc[leaveTypeField] = -theUserLeave.leaveDays;
    }

    // Update the leave count
    const updatecount = await LeavesCount.updateOne({ user }, updateremove);

    // Mark the leave as cancelled
    const Leavesupdate = await Leaves.updateOne(
      { _id: leaveId },
      {
        leaveCancel: true,
        cancelReason,
        leaveStatus: "Cancelled",
        cancelDate: new Date(),
      }
    );

    res.status(200).json({
      message: "Cancellation successful",
      updatecount,
      Leavesupdate,
    });
  } catch (error) {
    handleError(res, 400, error.message);
  }
};


exports.getleavesHistoryById = async (req, res) => { 
  try {
    const userId = req.params.userId;

    if (!userId) {
      throw new AppError(400, "User ID not found");
    }

    // Ensure LeavesCount document exists for the user
    await LeavesCount.findOneAndUpdate(
      { user: userId },
      { user: userId },
      { upsert: true, new: true }
    );

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to the start of the day

    // Check for any pending leaves that have expired (leaveStart date < current date)
    const expiredLeaves = await Leaves.find({
      user: userId,
      leaveStatus: "Pending",
      leaveStart: { $lt: currentDate },  // Leaves with a start date before today
    });

    // Loop through expired leaves and update their status to "Expired"
    for (const leave of expiredLeaves) {
      leave.leaveStatus = "Expired";
      const leaveTypeField = leave.leaveType.toLowerCase().split(" ").join("");
      const expiredDays = leave.leaveDays;

      // Update LeavesCount based on the leave type
      if (leaveTypeField === "unpaidleave") {
        await LeavesCount.findOneAndUpdate(
          { user: userId },
          { $inc: { [leaveTypeField]: -expiredDays, expiredLeaves: 1, pendingLeaves: -1 } }
        );
      } else {
        await LeavesCount.findOneAndUpdate(
          { user: userId },
          { $inc: { [leaveTypeField]: expiredDays, expiredLeaves: 1, pendingLeaves: -1 } }
        );
      }

      await leave.save();
    }

    // Get the leave history of the user
    const userAllLeaves = await getUserHistory(userId);

    // Send the leave history in the response along with a success message
    res.status(200).json({
      message: "Leave history retrieved successfully",
      userAllLeaves,
    });
  } catch (error) {
    handleError(res, 400, error.message);
  }
};

exports.getleaveHistory = async (req, res) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to the start of the day

    // Check for any pending leaves that have expired (leaveStart date < current date)
    await Leaves.updateMany(
      {
        leaveStatus: "Pending",
        leaveStart: { $lt: currentDate },  // Expired if leave start date is before today
      },
      { $set: { leaveStatus: "Expired" } }
    );

    // Get the leave history of all users
    const AllLeaves = await getUserHistory();
    res.status(200).json({ message: "ok", AllLeaves });
  } catch (error) {
    handleError(res, 400, error.message);
  }
};


exports.leaveApprovedByAdmin = async (req, res) => {
  try {
    const { leaveId, userId, note, adminId } = req.body; // Include adminId in the request body

    if (!leaveId || !userId || !note || !adminId) {
      // Check for adminId as well
      throw new AppError(400, "All fields are required");
    }

    const leavedata = await Leaves.findOne({ _id: leaveId });
    if (!leavedata) {
      throw new AppError(404, "Leave not found");
    }

    if (leavedata.leaveStatus === "Approved") {
      throw new AppError(400, "Leave already approved");
    }

    if (leavedata.leaveStatus === "Cancelled") {
      throw new AppError(400, "Leave is cancelled by employee! Can't update");
    }

    if (leavedata.leaveStatus === "Rejected") {
      throw new AppError(400, "Leave is rejected, can't be approved");
    }

    if (leavedata.leaveStatus === "Expired") {
      throw new AppError(400, "Leave is expired, can't be approved");
    }

    // Approve the leave
    const approvedLeave = await Leaves.findOneAndUpdate(
      { _id: leaveId, user: userId },
      { $set: { leaveStatus: "Approved", noteByAdmin: note } },
      { new: true }
    );

    // Update the leave counts
    const leavesCountUpdate = await LeavesCount.findOneAndUpdate(
      { user: userId },
      { $inc: { pendingLeaves: -1, approvedLeaves: 1 } }
    );

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
      title: "Leave Approved",
      description: `Your leave request has been approved by ${admin.firstName} ${admin.lastName}.`,
    };
    // Send notification to the user
    await sendNotificationToOne(userNotificationToken, notificationPayload);

    res.status(200).json({
      message: "Leave approved",
      approvedLeave,
      leavesCountUpdate,
    });
  } catch (error) {
    console.error("Error:", error);
    handleError(res, error.statusCode || 400, error.message);
  }
};

exports.leaveRejectedByAdmin = async (req, res) => {
  try {
    const { leaveId, userId, note, adminId } = req.body;

    if (!leaveId || !userId || !note || !adminId) {
      // Check for adminId as well
      throw new AppError(
        400,
        "leaveId, userId, note, and adminId are required"
      );
    }

    const leavedata = await Leaves.findOne({ _id: leaveId });
    if (!leavedata) {
      throw new AppError(404, "Leave not found");
    }

    if (
      ["Cancelled", "Rejected", "Approved", "Expired"].includes(
        leavedata.leaveStatus
      )
    ) {
      throw new AppError(
        400,
        `Leave is already ${leavedata.leaveStatus}, cannot be rejected.`
      );
    }

    const leaveTypeField = leavedata.leaveType
      .toLowerCase()
      .split(" ")
      .join("");
    const leaveDays = leavedata.leaveDays;

    // Update the leave status to 'Rejected' and save the admin note
    const approvedleave = await Leaves.findOneAndUpdate(
      { _id: leaveId, user: userId },
      { $set: { leaveStatus: "Rejected", noteByAdmin: note } },
      { new: true }
    );

    // Prepare the update for leave counts, restoring the leave days
    let leaveCountUpdate = {
      $inc: { pendingLeaves: -1, rejectedLeaves: 1 },
    };

    if (leaveTypeField !== "unpaidleave") {
      leaveCountUpdate.$inc[leaveTypeField] = leaveDays;
    } else {
      leaveCountUpdate.$inc[leaveTypeField] = -leaveDays;
    }

    // Apply the update to the user's leave counts
    const leavesCountUpdate = await LeavesCount.findOneAndUpdate(
      { user: userId },
      leaveCountUpdate,
      { new: true }
    );

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
      title: "Leave Rejected",
      description: `Your leave request has been rejected by ${admin.firstName} ${admin.lastName}.`,
    };

    // Send notification to the user
    await sendNotificationToOne(userNotificationToken, notificationPayload);

    res.status(200).json({
      message: "Leave rejected successfully",
      approvedleave,
      leavesCountUpdate,
    });
  } catch (error) {
    handleError(res, error.statusCode || 400, error.message);
  }
};
