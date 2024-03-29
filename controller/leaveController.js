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
      (new Date(leaveData.leaveEnd).getTime() -
        new Date(leaveData.leaveStart).getTime()) /
        (1000 * 60 * 60 * 24) +
        1
    );
    console.log("date difference - ", actualLeaveDays);
    console.log("leave days -", leaveData.leaveDays);
    // Check if provided leaveDays matches the actual duration
    if (leaveData.leaveDays != actualLeaveDays) {
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

    if (new Date(leaveData.leaveStart) > new Date(leaveData.leaveEnd)) {
      throw new Error("StartDate must be before EndDate");
    }

    const alreadyAppliedForLeave = await Leaves.findOne({
      user: userId,
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
      leaveData.leaveType,
      leaveData.leaveDays
    );

    if (Object.keys(updateFields).length > 0) {
      // Check if available leaves are 0 or less for the specific leave type

      const leavesCount = await LeavesCount.findOne({ user: userId });
      if (!leavesCount) {
        await LeavesCount.create({ user: userId });
      }
      const leaveTypeField = leaveData.leaveType
        .toLowerCase()
        .split(" ")
        .join("");

      // Check if leave count is zero or less
      if (leaveTypeField !== "unpaidleave") {
        if (
          leavesCount[leaveTypeField] === 0 ||
          leaveData.leaveDays > leavesCount[leaveTypeField]
        ) {
          throw new Error(
            `Cannot apply for ${leaveData.leaveType}. Insufficient leave balance.`
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

exports.getleavesHistoryById = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      throw new AppError(400, "userId parameter is required");
    }

    const userAllLeaves = await getUserHistory(userId);
    console.log("date", userAllLeaves);
    res.status(200).json({ message: "ok", userAllLeaves });
  } catch (error) {
    console.log(error);
    handleError(res, 400, error.message);
  }
};

exports.getleaveHistory = async (req, res) => {
  try {
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
      throw new AppError(400, "leaveId, userId, and note are required");
    }

    const leavedata = await Leaves.findOne({ _id: leaveId });
    if (!leavedata) {
      throw new AppError(404, "Leave not found");
    }

    if (leavedata.leaveStatus === "approved") {
      throw new AppError(400, "Leave already approved");
    }

    const approvedleave = await Leaves.findOneAndUpdate(
      { _id: leaveId, user: userId },
      { $set: { leaveStatus: "approved", noteByAdmin: note } },
      { new: true }
    );

    const leavesCountUpdate = await LeavesCount.findOneAndUpdate(
      { user: userId, pendingLeaves: { $gt: 0 } },
      { $inc: { pendingLeaves: -1, approvedLeaves: 1 } },
      { upsert: true }
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

    if (leavedata.leaveStatus === "Rejected") {
      throw new AppError(400, "Leave already Rejected");
    }

    const approvedleave = await Leaves.findOneAndUpdate(
      { _id: leaveId, user: userId },
      { $set: { leaveStatus: "Rejected", noteByAdmin: note } },
      { new: true }
    );

    const leavesCountUpdate = await LeavesCount.findOneAndUpdate(
      { user: userId, pendingLeaves: { $gt: 0 } },
      { $inc: { pendingLeaves: -1, rejectedLeaves: 1 } },
      { upsert: true }
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
