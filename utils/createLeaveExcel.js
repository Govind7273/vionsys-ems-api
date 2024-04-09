const ExcelJS = require("exceljs");
const moment = require("moment");
const fs = require("fs");

const CreatLeaveExcel = async (leaveData) => {
  const currentDate = moment().format("DD-MM-YYYY");
  const filePath = `Leaves_${currentDate}.xlsx`;
  try {
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("LeaveData");

    // Add headers to the worksheet
    worksheet.addRow([
      "Employee Name",
      "Employee ID",
      "Leave Mode",
      "Leave Type",
      "leave Days",
      "Applied On",
      "Leave Start",
      "Leave End",
      "Leave Status",
    ]);

    const processedEmployees = new Set(); // Keep track of processed employee IDs

    // Iterate over each user's leave data
    leaveData.forEach((userData) => {
      const employeeName = `${userData.firstName} ${userData.lastName}`;
      const employeeId = userData.employeeId;

      // Only process if employee ID hasn't been processed before
      if (!processedEmployees.has(employeeId)) {
        // Sort leave records by leave start date in ascending order
        userData.leaves.sort(
          (a, b) =>
            moment(a.leaveStart).valueOf() - moment(b.leaveStart).valueOf()
        );

        // Iterate over each leave record for the user
        userData.leaves.forEach((leaveRecord) => {
          worksheet.addRow([
            employeeName,
            employeeId,
            leaveRecord?.halfDay ? "Half day" : "Full day",
            leaveRecord?.leaveType,
            leaveRecord?.leaveDays,
            moment(leaveRecord?.date).format("DD-MM-YYYY"),
            moment(leaveRecord?.leaveStart).format("DD-MM-YYYY"),
            moment(leaveRecord?.leaveEnd).format("DD-MM-YYYY"),
            leaveRecord?.leaveStatus,
          ]);
        });
        worksheet.addRow(["", "", "", "", "", "", ""]);

        // Set employee ID as processed
        processedEmployees.add(employeeId);
      }
    });

    // Write to file
    await workbook.xlsx.writeFile(filePath);

    return filePath;
  } catch (error) {
    fs.unlink(filePath);
    throw new Error("Error in creating Excel sheet");
  }
};

module.exports = CreatLeaveExcel;
