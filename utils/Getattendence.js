const Attendance = require("../models/attendanceModel");

const GetAttendance = async (startDate, endDate) => {
  try {
    // Convert start and end dates to UTC Date objects
    const startDateObject = startDate
      ? new Date(`${startDate}T00:00:00.000Z`)
      : new Date(0); // If startDate is not provided, default to the beginning of time
    const endDateObject = endDate
      ? new Date(`${endDate}T23:59:59.999Z`)
      : new Date(); // If endDate is not provided, default to current date

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
    throw new Error("Error in fetching attendence");
  }
};

module.exports = GetAttendance; // Exporting the GetAttendance function
