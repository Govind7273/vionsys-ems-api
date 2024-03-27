const { Types } = require("mongoose");
const User = require("../models/userModels");
const Leaves = require("../models/leavesmodel");

const getUserHistory = async (userId) => {
  try {
    let aggregationPipeline = [];

    if (userId) {
      const userObjectId = Types.ObjectId(userId);
      aggregationPipeline = [
        {
          $match: { _id: userObjectId },
        },
        {
          $lookup: {
            from: "leaves",
            localField: "_id",
            foreignField: "user",
            as: "leaves",
          },
        },
      ];
    } else {
      aggregationPipeline = [
        {
          $lookup: {
            from: "leaves",
            localField: "_id",
            foreignField: "user",
            as: "leaves",
          },
        },
      ];
    }

    const userLeaves = await User.aggregate(aggregationPipeline);

    return userLeaves;
  } catch (error) {
    throw error;
  }
};

module.exports = getUserHistory;
