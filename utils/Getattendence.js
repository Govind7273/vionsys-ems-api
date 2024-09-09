const Attendance = require("../models/attendanceModel");

const GetAttendance = async () => {
  try {
    // Get the current date
    const currentDate = new Date();
    
    // Create start and end of the day in UTC
    const startDateObject = new Date(`${currentDate.toISOString().split('T')[0]}T00:00:00.000Z`);
    // console.log(startDateObject)
    const endDateObject = new Date(`${currentDate.toISOString().split('T')[0]}T23:59:59.999Z`);

    // Using aggregate to group attendance by user and filter by current date
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

module.exports = GetAttendance; // Exporting the GetAttendance function
