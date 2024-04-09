const ExcelJS = require("exceljs");
const moment = require("moment");
const fs = require("fs");

const calculateDuration = (loginTime, logoutTime) => {
  const timeFormat = "h:mm "; // Specify the expected time format

  // Parse loginTime and logoutTime using the specified format
  const loginMoment = moment(loginTime, timeFormat, true);
  const logoutMoment = moment(logoutTime, timeFormat, true);

  // Check if both loginTime and logoutTime are in the expected format
  if (loginMoment.isValid() && logoutMoment.isValid()) {
    // Calculate the duration
    const duration = moment.duration(logoutMoment.diff(loginMoment));
    const hours = Math.floor(duration.asHours());
    const minutes = Math.floor(duration.asMinutes()) % 60;
    return `${hours} hours ${minutes} minutes`;
  } else {
    return "NA"; // Return "NA" if either time value is not in the expected format
  }
};

const mergeExcels = async (attendanceFilePath, leaveFilePath) => {
  const mergedFilePath = `Merged_${moment().format("DD-MM-YYYY")}.xlsx`;
  try {
    // Load both Excel files
    const attendanceWorkbook = await new ExcelJS.Workbook().xlsx.readFile(
      attendanceFilePath
    );
    const leaveWorkbook = await new ExcelJS.Workbook().xlsx.readFile(
      leaveFilePath
    );

    // Get the worksheets
    const attendanceWorksheet = attendanceWorkbook.getWorksheet(1);
    const leaveWorksheet = leaveWorkbook.getWorksheet(1);

    // Create a new Excel workbook for merged data
    const mergedWorkbook = new ExcelJS.Workbook();
    const mergedWorksheet = mergedWorkbook.addWorksheet("MergedData");

    // Copy headers from the attendance worksheet
    const attendanceHeaders = attendanceWorksheet.getRow(1).values;
    // Add "Duration" header
    mergedWorksheet.addRow(attendanceHeaders);

    // Copy attendance data
    for (let i = 2; i <= attendanceWorksheet.rowCount; i++) {
      const rowValues = attendanceWorksheet.getRow(i).values;
      const loginTime = rowValues[3]; // Assuming login time is in the 4th column
      const logoutTime = rowValues[4]; // Assuming logout time is in the 5th column
      const duration = calculateDuration(loginTime, logoutTime);
      // rowValues.push(duration); // Add duration to the row values
      mergedWorksheet.addRow(rowValues);
    }

    // Find the next empty row for leave data
    let nextRow = mergedWorksheet.rowCount + 2;

    // Copy headers from the leave worksheet
    const leaveHeaders = leaveWorksheet.getRow(1).values;
    mergedWorksheet.getRow(nextRow).values = leaveHeaders;

    // Copy approved leaves only
    for (let i = 2; i <= leaveWorksheet.rowCount; i++) {
      const rowValues = leaveWorksheet.getRow(i).values;
      const leaveStatus = rowValues[9]; // Assuming leaveStatus is in the 12th column
      if (leaveStatus === "Approved") {
        mergedWorksheet.addRow(rowValues);
      }
    }

    // Write to the merged file
    await mergedWorkbook.xlsx.writeFile(mergedFilePath);

    // Return the path to the merged file
    return mergedFilePath;
  } catch (error) {
    fs.unlink(mergedFilePath);
    throw new Error("Error in merging Excel files: " + error.message);
  }
};

module.exports = mergeExcels;
