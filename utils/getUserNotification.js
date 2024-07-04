const User = require("../models/userModels");

async function getNotificationTokens() {
  try {
    const tokens = await User.aggregate([
      {
        $group: {
          _id: null,
          notificationToken: { $push: "$notificationToken" },
        },
      },
      {
        $project: {
          _id: 0,
          notificationToken: 1,
        },
      },
    ]);

    return tokens[0].notificationToken;
  } catch (err) {
    console.error("Error in aggregation", err);
  }
}

module.exports = getNotificationTokens;
