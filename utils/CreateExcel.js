const ExcelJS = require("exceljs");
const moment = require("moment");

const CreatExcel = async (attendance) => {
  try {
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    // Add headers to the worksheet
    worksheet.addRow([
      "Employee Name",
      "Employee ID",
      "Dates",
      "",
      "",
      "Duration",
      "",
    ]);
    worksheet.addRow(["", "", "", "Login", "Logout", "", ""]);

    // Iterate over each user's attendance data
    attendance.forEach((userAttendance) => {
      const user = userAttendance.user;
      const attendances = userAttendance.attendances;

      // Extract employee name and ID
      const employeeName = `${user.firstName} ${user.lastName}`;
      const employeeId = user.employeeId;

      // Extract dates, login times, and logout times
      const dates = [];
      const loginTimes = [];
      const logoutTimes = [];
      const durations = [];

      // Iterate over each attendance record for the user
      attendances.forEach((attendance) => {
        // Extract date, login time, and logout time from the attendance record
        const { date, loginTime, logoutTime } = attendance;

        // Format date as "DD-MM-YY"
        const formattedDate = moment(date).format("DD-MM-YY");

        // Push attendance information to corresponding arrays
        dates.push(formattedDate);
        loginTimes.push(formatTime(loginTime));
        logoutTimes.push(formatTime(logoutTime));
        durations.push(calculateDuration(loginTime, logoutTime));
      });

      // Add rows to the worksheet
      const maxRecords = Math.max(
        dates.length,
        loginTimes.length,
        logoutTimes.length,
        durations.length
      );
      for (let i = 0; i < maxRecords; i++) {
        worksheet.addRow([
          i === 0 ? employeeName : "", // Employee name only in the first row
          i === 0 ? employeeId : "", // Employee ID only in the first row
          dates[i] || "", // Date
          loginTimes[i] || "NA", // Login time
          logoutTimes[i] || "NA", // Logout time
          durations[i] || "NA", // Duration
        ]);
      }

      // Add an empty row between users
      worksheet.addRow(["", "", "", "", "", "", ""]);
    });

    // Save the workbook
    const filePath = "Attendance.xlsx";

    await workbook.xlsx.writeFile(filePath);
    console.log(`Attendance Excel sheet generated successfully: ${filePath}`);
  } catch (error) {
    console.error("Error generating attendance Excel sheet:", error);
    throw error;
  }
};

const formatTime = (time) => {
  return time ? moment(time).format("h:mm A") : ""; // Format time as "10:00 AM"
};

const calculateDuration = (loginTime, logoutTime) => {
  if (loginTime && logoutTime) {
    const duration = moment.duration(
      moment(logoutTime).diff(moment(loginTime))
    );
    const hours = duration.hours();
    const minutes = duration.minutes();
    return `${hours} hours ${minutes} minutes`;
  } else {
    return "";
  }
};

module.exports = CreatExcel;
