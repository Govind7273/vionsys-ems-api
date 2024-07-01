const { default: mongoose } = require("mongoose");
const User = require("../models/userModels");

const getUserHistory = async (userId) => {
  try {
    let aggregationPipeline = [];

    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
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
        {
          $lookup: {
            from: "leavescounts",
            localField: "_id",
            foreignField: "user",
            as: "leavescounts",
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
        {
          $match: {
            leaves: { $ne: [] }, // Filter out users with empty leaves array
          },
        },
        {
          $project: {
            password: 0, // Exclude the password field
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
