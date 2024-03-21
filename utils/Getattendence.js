const Attendance = require("../models/attendanceModel");

const Getattendence = async () => {
  try {
    const attendance = await Attendance.aggregate([
      {
        $group: {
          _id: "$user",
          attendances: {
            $addToSet: "$$ROOT",
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
    ]);

    return attendance;

  } catch (error) {
    
    throw error;
  }
};

module.exports = Getattendence;
