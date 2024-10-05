const Attendance = require("../models/attendanceModel");

const Getattendance = async (startDate, endDate) => {
  try {
    // Get the current date
    const currentDate = new Date();
    
    // Create start and end of the day in UTC for the current date if no dates are provided
    const startDateObject = startDate
      ? new Date(`${startDate}T00:00:00.000Z`)
      : new Date(`${currentDate.toISOString().split('T')[0]}T00:00:00.000Z`);

    const endDateObject = endDate
      ? new Date(`${endDate}T23:59:59.999Z`)
      : new Date(`${currentDate.toISOString().split('T')[0]}T23:59:59.999Z`);

    // Using aggregate to group attendance by user and filter by date range
    const attendance = await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: startDateObject, // Filter for dates greater than or equal to startDate
            $lte: endDateObject, // Filter for dates less than or equal to endDate
          },
        },
      },
      {
        $group: {
          _id: "$user", // Grouping by user
          attendances: {
            $addToSet: "$$ROOT", // Adding attendance data to an array
          },
        },
      },
      {
        $lookup: {
          from: "users", // Looking up users collection
          localField: "_id",
          foreignField: "_id",
          as: "user", // Storing user data in 'user' field
        },
      },
      { $unwind: "$user" }, // Unwinding user array
    ]);

    return attendance; // Returning aggregated attendance data
  } catch (error) {
    // Throwing error if any
    throw new Error("Error in fetching attendance");
  }
};

module.exports = Getattendance;
