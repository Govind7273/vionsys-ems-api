const User = require("../models/userModels");
const Leaves = require("../models/leavesmodel");
const LeavesCount = require("../models/leaveCountModel");
const getUserHistory = require("../utils/GetLeaveHistory");
const AppError = require("../utils/appError");

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
    const actualLeaveDays = Math.ceil(
      (new Date(leaveData?.leaveEnd).getTime() -
        new Date(leaveData?.leaveStart).getTime()) /
        (1000 * 60 * 60 * 24) +
        1
    );
    console.log("date difference - ", actualLeaveDays);
    console.log("leave days -", leaveData?.leaveDays);
    const applieforactual = leaveData?.leaveDays || 1;
    // Check if provided leaveDays matches the actual duration
    if (applieforactual != actualLeaveDays) {
      throw new AppError(
        400,
        "Leave days provided do not match the actual duration"
      );
    }

    if (
      new Date(leaveData?.leaveStart) <= new Date() ||
      new Date(leaveData?.leaveEnd) <= new Date()
    ) {
      throw new Error("Leave dates must be in the future");
    }

    if (new Date(leaveData?.leaveStart) > new Date(leaveData?.leaveEnd)) {
      throw new Error("StartDate must be before EndDate");
    }

    const alreadyAppliedForLeave = await Leaves.findOne({
      user: userId,
      leaveStatus: "Pending" || "Approved",
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
      // Check if available leaves are 0 or less for the specific leave type

      const leavesCount = await LeavesCount.findOneAndUpdate(
        { user: userId },
        { user: userId },
        { upsert: true, new: true }
      );

      const leaveTypeField = leaveData?.leaveType
        .toLowerCase()
        .split(" ")
        .join("");

      // Check if leave count is zero or less
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
      // Only update LeavesCount if updateFields is not empty and leave count is positive
      await LeavesCount.findOneAndUpdate({ user: userId }, updateFields, {
        upsert: true,
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
    const { user, cancleReason } = req.body;
    const leaveId = req.params.leaveId;

    const theUserLeave = await Leaves.findOne({ _id: leaveId });
    console.log(theUserLeave.leaveStart, theUserLeave.leaveEnd);

    const currentDate = new Date();
    const leaveStartDate = new Date(theUserLeave.leaveStart);
    const leaveEndDate = new Date(theUserLeave.leaveEnd);

    if (currentDate > leaveStartDate && currentDate < leaveEndDate) {
      throw new Error("Leave has already started.");
    }
    if (currentDate >= leaveEndDate) {
      throw new Error("Leave has already ended.");
    }

    const leaveTypeField = theUserLeave?.leaveType
      .toLowerCase()
      .split(" ")
      .join("");

    let updateremove = {};

    switch (theUserLeave?.leaveStatus) {
      case "Pending":
        updateremove = {
          $inc: { pendingLeaves: -1, cancelledLeaves: 1 },
        };
        {
          leaveTypeField !== "unpaidleave"
            ? (updateremove.$inc[leaveTypeField] = theUserLeave?.leaveDays)
            : (updateremove.$inc[leaveTypeField] = -theUserLeave?.leaveDays);
        }
        break;
      case "Approved":
        updateremove = {
          $inc: { approvedLeaves: -1, cancelledLeaves: 1 },
        };
        {
          leaveTypeField !== "unpaidleave"
            ? (updateremove.$inc[leaveTypeField] = theUserLeave?.leaveDays)
            : (updateremove.$inc[leaveTypeField] = -theUserLeave?.leaveDays);
        }
        break;
      default:
        break;
    }

    if (theUserLeave?.leaveStatus === "Rejected") {
      throw new Error("can't cancle request , is already rejected");
    }
    if (theUserLeave?.leaveStatus === "Cancelled") {
      throw new Error("can't Cancel request , is already Cancelled");
    }
    if (theUserLeave?.leaveStatus === "Expired") {
      throw new Error("can't Cancel request , is already Expired");
    }

    const updatecount = await LeavesCount.updateOne({ user }, updateremove);
    const Leavesupdate = await Leaves.updateOne(
      { _id: leaveId },
      {
        leaveCancle: true,
        cancleReason,
        leaveStatus: "Cancelled",
        cancleDate: new Date(),
      }
    );

    res
      .status(200)
      .json({ message: "deletion successful", updatecount, Leavesupdate });
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

    // Find pending leaves that have expired
    const useExpired = await Leaves.find({
      user: userId,
      leaveStatus: "Pending",
      $or: [
        { leaveStart: { $lt: new Date() } },
        { leaveEnd: { $lt: new Date() } },
      ],
    });

    // Loop through expired leaves and update LeavesCount document
    for (const leave of useExpired) {
      const leaveTypeField = leave.leaveType.toLowerCase().split(" ").join("");
      const expiredDays = leave.leaveDays;

      // Increment the leave count in LeavesCount document based on leave type and days
      if (leaveTypeField === "unpaidleave") {
        await LeavesCount.findOneAndUpdate(
          { user: userId },
          { $inc: { [leaveTypeField]: -expiredDays } }
        );
      } else {
        await LeavesCount.findOneAndUpdate(
          { user: userId },
          { $inc: { [leaveTypeField]: expiredDays } }
        );
      }
    }

    // Mark expired leaves as "Expired" in the database
    const expiredleaves = await Leaves.updateMany(
      {
        user: userId,
        leaveStatus: "Pending",
        $or: [
          { leaveStart: { $lt: new Date() } },
          { leaveEnd: { $lt: new Date() } },
        ],
      },
      { $set: { leaveStatus: "Expired" } }
    );

    // Increment the expiredLeaves count in LeavesCount document
    const expiredCount = expiredleaves?.modifiedCount;
    if (expiredCount) {
      await LeavesCount.findOneAndUpdate(
        { user: userId },
        { $inc: { pendingLeaves: -1, expiredLeaves: expiredCount } }
      );
    }

    // Get the leave history of the user
    const userAllLeaves = await getUserHistory(userId);

    // Send the leave history in the response along with a success message
    res
      .status(200)
      .json({ message: "Leave history retrieved successfully", userAllLeaves });
  } catch (error) {
    console.log(error);
    handleError(res, 400, error.message);
  }
};

exports.getleaveHistory = async (req, res) => {
  try {
    await Leaves.updateMany(
      {
        leaveStatus: "Pending",
        $or: [
          { leaveStart: { $lt: new Date() } },
          { leaveEnd: { $lt: new Date() } },
        ],
      },
      { $set: { leaveStatus: "Expired" } }
    );

    const AllLeaves = await getUserHistory();
    res.status(200).json({ message: "ok", AllLeaves });
  } catch (error) {
    handleError(res, 400, error.message);
  }
};

exports.leaveApprovedByAdmin = async (req, res) => {
  try {
    const { leaveId, userId, note } = req.body;

    if (!leaveId || !userId || !note) {
      throw new AppError(400, "all fields are required");
    }

    const leavedata = await Leaves.findOne({ _id: leaveId });
    if (!leavedata) {
      throw new AppError(404, "Leave not found");
    }

    if (leavedata.leaveStatus === "Approved") {
      throw new AppError(400, "Leave already approved");
    }

    if (leavedata.leaveStatus === "Cancelled") {
      throw new AppError(400, "leave is cancelled by employee! can't update");
    }
    if (leavedata.leaveStatus === "Rejected") {
      throw new AppError(400, "Leave is rejected, can't Approved");
    }
    if (leavedata.leaveStatus === "Expired") {
      throw new AppError(400, "Leave is Expired	, can't Approved");
    }
    const approvedleave = await Leaves.findOneAndUpdate(
      { _id: leaveId, user: userId },
      { $set: { leaveStatus: "Approved", noteByAdmin: note } },
      { new: true }
    );

    const leavesCountUpdate = await LeavesCount.findOneAndUpdate(
      { user: userId },
      { $inc: { pendingLeaves: -1, approvedLeaves: 1 } }
    );

    res.status(200).json({
      message: "Leave approved",
      approvedleave,
      leavesCountUpdate,
    });
  } catch (error) {
    handleError(res, error.statusCode, error.message);
  }
};

exports.leaveRejectedByAdmin = async (req, res) => {
  try {
    const { leaveId, userId, note } = req.body;

    if (!leaveId || !userId || !note) {
      throw new AppError(400, "leaveId, userId, and note are required");
    }

    const leavedata = await Leaves.findOne({ _id: leaveId });
    if (!leavedata) {
      throw new AppError(404, "Leave not found");
    }
    if (leavedata.leaveStatus === "Cancelled") {
      throw new AppError(400, "leave is cancelled by employee! can't update");
    }
    if (leavedata.leaveStatus === "Rejected") {
      throw new AppError(400, "Leave already Rejected");
    }
    if (leavedata.leaveStatus === "Approved") {
      throw new AppError(400, "Leave is Approved , can't rejected");
    }
    if (leavedata.leaveStatus === "Expired") {
      throw new AppError(400, "Leave is Expired	 , can't rejected");
    }

    const approvedleave = await Leaves.findOneAndUpdate(
      { _id: leaveId, user: userId },
      { $set: { leaveStatus: "Rejected", noteByAdmin: note } },
      { new: true }
    );

    const leavesCountUpdate = await LeavesCount.findOneAndUpdate(
      { user: userId, pendingLeaves: { $gt: 0 } },
      { $inc: { pendingLeaves: -1, rejectedLeaves: 1 } }
    );

    res.status(200).json({
      message: "Leave Rejected",
      approvedleave,
      leavesCountUpdate,
    });
  } catch (error) {
    handleError(res, error.statusCode, error.message);
  }
};
