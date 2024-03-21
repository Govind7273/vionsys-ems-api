const ExcelJS = require("exceljs");
const moment = require("moment");

const CreatExcel = async (attendance) => {
  console.log("the excel ", attendance);
  try {
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    // Add headers to the worksheet
    worksheet.addRow([
      "First Name",
      "Last Name",
      "Employee ID",
      "Date",
      "Login Time",
      "Logout Time",
    ]);

    // Iterate over each user's attendance data
    attendance.forEach((userAttendance) => {
      const user = userAttendance.user;
      const attendances = userAttendance.attendances;

      // Iterate over each attendance record for the user
      attendances.forEach((attendance) => {
        // Extract date, login time, and logout time from the attendance record
        const { date, loginTime, logoutTime } = attendance;

        // Add a row to the worksheet with user details and attendance data
        worksheet.addRow([
          user.firstName,
          user.lastName,
          user.employeeId,
          date.toDateString(), // Format date as string
          loginTime || "NA", // Use 'NA' if loginTime is not available
          logoutTime || "NA", // Use 'NA' if logoutTime is not available
        ]);
      });
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

module.exports = CreatExcel;

// mock data

// [
//   {
//     _id: new ObjectId("65f93303ccd1138b25a94985"),
//     attendances: [[Object], [Object]],
//     user: {
//       _id: new ObjectId("65f93303ccd1138b25a94985"),
//       firstName: "sagar",
//       lastName: "yenkure",
//       employeeId: "5",
//       email: "sagaryenkure@mail.com",
//       role: "admin",
//       designation: "intern",
//       password: "$2a$12$ngtL98wbPk6cQpdhBME4Yu822hPVnmZ3Hv3T8YlWSL1Pi6ozv6VaO",
//       teamLead: "Pankaj Khandare",
//       __v: 0,
//     },
//   },
//   {
//     _id: new ObjectId("65fab74d0d7fb6c47dd2485d"),
//     attendances: [[Object]],
//     user: {
//       _id: new ObjectId("65fab74d0d7fb6c47dd2485d"),
//       firstName: "Shubham",
//       lastName: "Garud",
//       employeeId: "24",
//       email: "shubhamgarud@mail.com",
//       role: "user",
//       designation: "AWS developer",
//       profile:
//         "http://res.cloudinary.com/dugtxvaxh/image/upload/v1710929741/xpwanhh2gtiyl4tlfgun.jpg",
//       password: "$2a$12$irIGCDyWmgLgzdTyRW2RvOGld7GMX6Ibqsw6y7gRxgWeYMXy7/BgK",
//       __v: 0,
//     },
//   },
// ];
