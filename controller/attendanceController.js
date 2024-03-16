const Attendance = require("../models/attendanceModel");

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}

function returnDateRange() {
  let currentDate = new Date();

  // Set the start and end of the current day
  let startOfDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    0,
    0,
    0,
    0
  );
  let endOfDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() + 1,
    0,
    0,
    0,
    0
  );
  return {
    startOfDay,
    endOfDay,
  };
}

exports.createAttendance = async (req, res) => {
  try {
    const { startOfDay, endOfDay } = returnDateRange();
    // Check if the user has already logged in for the day
    const existingAttendance = await Attendance.findOne({
      user: req.body.user,
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    // Create new attendance record
    if (!existingAttendance) {
      const attendance = await Attendance.create(req.body);
      res.status(200).json({
        status: "success",
        data: {
          attendance,
        },
      });
    } else {
      throw new Error("You are already logged in for the day!");
    }
  } catch (error) {
    handleError(res, 400, error.message);
  }
};

exports.getAttendance = async (req, res) => {
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

    res.status(200).json({
      status: "success",
      data: {
        attendance,
        // attendanceForDay,
      },
    });
  } catch (error) {
    handleError(res, 400, error.message);
  }
};

exports.getAttendanceById = async (req, res) => {
  try {
    const userId = req.params.userId;
    const attendance = await Attendance.find({ user: userId });
    res.status(200).json({
      status: "success",
      data: {
        attendance,
      },
    });
  } catch (error) {
    handleError(res, 400, error.message);
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const { startOfDay, endOfDay } = returnDateRange();

    const todayAttendance = await Attendance.findOne({
      user: req.params.userId,
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });
    if (todayAttendance?.logoutTime) {
      throw new Error("You are already checked out for today.");
    }
    const attendance = await Attendance.findOneAndUpdate(
      {
        user: req.params.userId,
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      },
      req.body
    );
    res.status(200).json({
      status: "success",
      data: {
        attendance,
      },
    });
  } catch (error) {
    handleError(res, 400, error.message);
  }
};
