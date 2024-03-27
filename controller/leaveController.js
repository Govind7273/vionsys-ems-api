const LeavesCount = require("../models/leaveCountModel");
const Leaves = require("../models/leavesmodel");
const User = require("../models/userModels");
const getUserHistory = require("../utils/GetLeaveHistory");
const AppError = require("../utils/appError");

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}

// employee can apply for leave
exports.createLeaveRequest = async (req, res) => {
  try {
    const { userId, ...leaveData } = req.body;
    const userexist = User.find({ _id: userId });
    if (!userexist) {
      throw new AppError(404, "employee with this mail not found !");
    }
    // cheak the date if from past
    if (
      new Date(leaveData?.leaveStart) <= new Date() ||
      new Date(leaveData?.leaveEnd) <= new Date()
    ) {
      throw new AppError(400, "Leave dates must be in the future");
    }
    // cheak already applied for leave
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
      throw new AppError(403, "Already applied for leave in this duration");
    }

    const leave = await Leaves.create({ user: userId, ...leaveData });
    if (!leave) {
      throw new AppError(400, "Error while sending leave request");
    }

    // Find and update LeavesCount document
    await LeavesCount.findOneAndUpdate(
      { user: userId },
      { $inc: { pendingLeaves: 1, totalLeaves: 1 } },
      { upsert: true }
    );

    res.status(201).json({ message: "leave request is submitted", leave });
  } catch (error) {
    handleError(res, 400, error.message);
  }
};

exports.getleavesHistory = async (req, res) => {
  try {
    // const userId = req.params.userId;
    const userAllLeaves = await getUserHistory();
    res.status(200).json({ message: "ok", userAllLeaves });
  } catch (error) {
    console.log(error);
    handleError(res, 400, error.message);
  }
};
