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
 
//---update leave  count--
 
exports.updateLeaveCountAdmin = async (req, res) => {
  const { userId } = req.params; // Use 'userId' here
  const {
      floaterleave,
      privilageleave,
      sickleave,
      casualleave,
      unpaidleave,
      approvedLeaves,
  } = req.body;
 
  try {
      console.log("Looking for leave record with user ID:", userId); // Check userId
      const leaveRecord = await LeavesCount.findOne({ user: userId }); // Use userId here
     
      if (!leaveRecord) {
          return res.status(404).json({ message: 'Leave record not found' });
      }
 
      // Update leave counts, or set to original value or 0 if undefined
      leaveRecord.floaterleave = floaterleave !== undefined ? floaterleave : (leaveRecord.floaterleave || 0);
      leaveRecord.privilageleave = privilageleave !== undefined ? privilageleave : (leaveRecord.privilageleave || 0);
      leaveRecord.sickleave = sickleave !== undefined ? sickleave : (leaveRecord.sickleave || 0);
      leaveRecord.casualleave = casualleave !== undefined ? casualleave : (leaveRecord.casualleave || 0);
      leaveRecord.unpaidleave = unpaidleave !== undefined ? unpaidleave : (leaveRecord.unpaidleave || 0);
      leaveRecord.approvedLeaves = approvedLeaves !== undefined ? approvedLeaves : (leaveRecord.approvedLeaves || 0);
 
      // Save the updated record
      await leaveRecord.save();
      console.log(leaveRecord);
      return res.status(200).json({ message: 'Leave count updated successfully', leaveRecord });
 
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
 
 
//-------------
 
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
    const currentDay = currentTime.getDate();
 
    // Create a Date object for the leave start date and subtract one day
    const leaveStartDate = new Date(leaveData.leaveStart);
    leaveStartDate.setDate(leaveStartDate.getDate() - 1);
    
 
    //  console.log("Current Day:", currentDay);
    //  console.log("Leave Start Day (after subtracting one day):", leaveStartDay);
    //  console.log("One Day Before:", oneDayBefore.getDate());
 
    // Check if the leave start day is equal to the previous day
    // if (leaveStartDay === oneDayBefore.getDate()) {
    //   if (!leaveData?.isHalfDay) {
    //     // Full-day leave condition
    //     if (currentHour >= 10) {
    //       throw new Error("Full day leave must be applied before 10 AM");
    //     }
    //   } else {
    //     // Half-day leave condition
    //     if (currentHour > 14) {
    //       throw new Error("Half day leave must be applied before 1 PM");
    //     }
    //   }
    // }
 
    if (
      new Date(leaveData?.leaveStart) < new Date().setHours(0, 0, 0, 0) ||
      new Date(leaveData?.leaveEnd) < new Date().setHours(0, 0, 0, 0)
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
    
 
    // Reset hours, minutes, seconds, and milliseconds for date comparison
    currentDate.setHours(0, 0, 0, 0);
    leaveStartDate.setHours(0, 0, 0, 0);
 
    
 
    if (currentDate > leaveStartDate) {
      throw new Error("Leave has already started and cannot be cancelled.");
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
    currentDate.setHours(0, 0, 0, 0); 
 
    // Check if the current date and time is after 2 PM today
    const expirationTime = new Date();
    expirationTime.setHours(0, 0, 0, 0); 
 
    // Handle current date leaves
    const useCurrentDateLeaves = await Leaves.find({
      user: userId,
      leaveStatus: "Pending",
      leaveStart: { $gte: currentDate, $lt: expirationTime },
    });
 
    // Loop through current date leaves and update their status if needed
    for (const leave of useCurrentDateLeaves) {
      if (new Date() >= expirationTime) {
        leave.leaveStatus = "Expired";
 
        // Update the LeavesCount document
        const leaveTypeField = leave.leaveType.toLowerCase().split(" ").join("");
        const expiredDays = leave.leaveDays;
 
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
      } else {
        leave.leaveStatus = "Pending"; // Keep as pending if before 2 PM
      }
      await leave.save();
    }
 
    // Handle expired leaves that are not on the current date
    const useExpired = await Leaves.find({
      user: userId,
      leaveStatus: "Pending",
      $or: [
        { leaveStart: { $lt: currentDate } },
        { leaveEnd: { $lt: currentDate } },
      ],
    });
 
    // Loop through expired leaves and update LeavesCount document
    for (const leave of useExpired) {
      const leaveTypeField = leave.leaveType.toLowerCase().split(" ").join("");
      const expiredDays = leave.leaveDays;
 
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
    }
 
    // Mark expired leaves as "Expired" in the database if the current time is past 2 PM
    if (currentDate >= expirationTime) {
      await Leaves.updateMany(
        {
          user: userId,
          leaveStatus: "Pending",
          $or: [
            { leaveStart: { $lt: currentDate } },
            { leaveEnd: { $lt: currentDate } },
          ],
        },
        { $set: { leaveStatus: "Expired" } }
      );
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
 
    // Check if the current date and time is after 2 PM today
    const expirationTime = new Date();
    expirationTime.setHours(0, 0, 0, 0); // Set to 2 PM today
 
    // Mark leaves as "Expired" if the current time is past 2 PM
    if (currentDate >= expirationTime) {
      await Leaves.updateMany(
        {
          leaveStatus: "Pending",
          $or: [
            { leaveStart: { $lt: currentDate } },
            { leaveEnd: { $lt: currentDate } },
          ],
        },
        { $set: { leaveStatus: "Expired" } }
      );
    }
 
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