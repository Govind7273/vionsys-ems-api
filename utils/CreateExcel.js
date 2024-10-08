const ExcelJS = require("exceljs");
const moment = require("moment-timezone");
const fs = require("fs");

// Set the timezone to India (Asia/Kolkata)
const TIMEZONE = "Asia/Kolkata";

const formatTime = (time) => {
  return time ? moment(time).tz(TIMEZONE).format("h:mm A") : ""; // Format time as "10:00 AM"
};

const calculateDuration = (loginTime, logoutTime) => {
  if (loginTime && logoutTime) {
    const duration = moment.duration(
      moment(logoutTime).tz(TIMEZONE).diff(moment(loginTime).tz(TIMEZONE))
    );
    const hours = duration.hours();
    const minutes = duration.minutes();
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes < 360) {
      // Less than 6 hours
      return "Half Day";
    } else {
      return "Full Day";
    }
  } else {
    return "";
  }
};

const CreatExcel = async (attendance) => {
  const currentDate = moment().tz(TIMEZONE).format("DD-MM-YYYY");
  const filePath = `Attendances_${currentDate}.xlsx`;
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
      "Work Mode",
    ]);
    worksheet.addRow(["", "", "", "Login", "Logout", ""]);

    // Sort the attendance data by date in ascending order
    attendance.forEach((userAttendance) => {
      userAttendance.attendances.sort(
        (a, b) =>
          moment(a.date).tz(TIMEZONE).valueOf() -
          moment(b.date).tz(TIMEZONE).valueOf()
      );
    });

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
      const workModes = [];

      // Iterate over each attendance record for the user
      attendances.forEach((attendance) => {
        // Extract date, login time, and logout time from the attendance record
        const { date, loginTime, logoutTime } = attendance;

        // Format date as "DD-MM-YY"
        const formattedDate = moment(date).tz(TIMEZONE).format("DD-MM-YY");

        // Push attendance information to corresponding arrays
        dates.push(formattedDate);
        loginTimes.push(formatTime(loginTime));
        logoutTimes.push(formatTime(logoutTime));
        workModes.push(calculateDuration(loginTime, logoutTime));
      });

      // Add rows to the worksheet
      const maxRecords = Math.max(
        dates.length,
        loginTimes.length,
        logoutTimes.length,
        workModes.length
      );
      for (let i = 0; i < maxRecords; i++) {
        worksheet.addRow([
          i === 0 ? employeeName : "", // Employee name only in the first row
          i === 0 ? employeeId : "", // Employee ID only in the first row
          dates[i] || "", // Date
          loginTimes[i] || "NA", // Login time
          logoutTimes[i] || "NA", // Logout time
          workModes[i] || "NA", // Work Mode (Duration)
        ]);
      }

      // Add an empty row between users
      worksheet.addRow(["", "", "", "", "", ""]);
    });

    await workbook.xlsx.writeFile(filePath);

    return filePath;
  } catch (error) {
    fs.unlinkSync(filePath);
    throw new Error("Error in creating Excel sheet");
  }
};

module.exports = CreatExcel;
