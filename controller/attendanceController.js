const Attendance = require("../models/attendanceModel");
const Getattendence = require("../utils/Getattendence");
const CreatExcel = require("../utils/CreateExcel");
const { sendExcelMail, sendEmail } = require("../utils/email");
const fs = require("fs");
const AppError = require("../utils/appError");
const getUserHistory = require("../utils/GetLeaveHistory");
const CreatLeaveExcel = require("../utils/createLeaveExcel");
const createCombinedExcel = require("../utils/UserExcel");
const mergeExcels = require("../utils/UserExcel");

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
      console.log(attendance)
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
    const attendance = await Getattendence();
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
    console.log(userId);
    const attendance = await Attendance.find({ user: userId });
    console.log(attendance);
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

exports.excel = async (req, res, next) => {
  try {
    const { Format_startDate, Format_endDate, email } = req.body;

    if (!Format_startDate || !Format_endDate) {
      throw new Error("please select the Date Range");
    }
    const isValidEmail = email.includes("@vionsys.com");
    if (!isValidEmail) {
      // email options
      options = {
        subject: "Security Alert: Unauthorized Access Attempt",
        email: process.env.EMAIL_RECEIVER,
        message: `<p>Dear Admin,</p>
        <p>An unauthorized attempt to access the attendance Excel file was detected from the following email address: <strong>[ ${email} ]</strong>.</p>
        <p>Immediate action has been taken to prevent any breach. We are conducting a thorough investigation to ensure ongoing security.</p>
        <p>Please review this incident promptly.</p>
        <p>[ Vionsys IT Solution India Pvt. Ltd. ]</p>`,
      };
      // sending alert email to admin about anauthorized email access
      await sendEmail(options);
      throw new AppError(401, "unouthorized email detected");
    }

    // Getting attendance of all users
    const attendance = await Getattendence(Format_startDate, Format_endDate);
    // getting leave history
    const userId = null;
    const leaves = await getUserHistory(
      userId,
      Format_startDate,
      Format_endDate
    );
    if (!attendance[0]) {
      throw new AppError(401, "Attendence for this range not available");
    }
    // Creating Excel from the filtered attendance
    const attendecepath = await CreatExcel(attendance);
    const leavepath = await CreatLeaveExcel(leaves);
    const filepath = { attendecepath, leavepath };
    const mergeexcel = await mergeExcels(attendecepath, leavepath);
    // mailing service

    const subject = `Attendance Report of vionsys - [${Format_startDate}] to [${Format_endDate}]`;
    const body = `<h1>Dear Admin<h1/>
     <p> Attached is the attendance report of vionsys from[${Format_startDate}] to[${Format_endDate}].<p/>`;

    await sendExcelMail(subject, body, email, mergeexcel);

    fs.unlinkSync(filepath.attendecepath);
    fs.unlinkSync(filepath.leavepath);
    fs.unlinkSync(mergeexcel);
    res.status(200).json({
      message: "Excel is created and has been sent by mail",
      attendance,
      leaves,
    });
  } catch (error) {
    handleError(res, 401, error.message);
  }
};

exports.excelById = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { Format_startDate, Format_endDate, email } = req.body;

    // Getting attendance of all users within the provided date range, or for the current day if not provided
    const attendance = await Getattendence(Format_startDate, Format_endDate);

    // Filter attendance by userId
    const filterAttendance = attendance.filter((att) => att._id == userId);
    
    // Fetch user's leave history within the same date range
    const leaves = await getUserHistory(userId, Format_startDate, Format_endDate);

    if (!filterAttendance[0]) {
      throw new Error("Attendance for this user not available");
    }

    // Check if the provided email is from the authorized domain
    const isValidEmail = email.includes("@vionsys.com");
    if (!isValidEmail) {
      // Email options for notifying admin of unauthorized access
      const options = {
        subject: "Security Alert: Unauthorized Access Attempt",
        email: process.env.EMAIL_RECEIVER,
        message: `<p>Dear Admin,</p>
        <p>An unauthorized attempt to access the attendance Excel file was detected from the following email address: <strong>[ ${email} ]</strong>.</p>
        <p>Immediate action has been taken to prevent any breach. We are conducting a thorough investigation to ensure ongoing security.</p>
        <p>Please review this incident promptly.</p>
        <p>[ Vionsys IT Solution India Pvt. Ltd. ]</p>`,
      };
      // Send alert email to the admin
      await sendEmail(options);
      throw new AppError(401, "Unauthorized email detected");
    }

    // Create the Excel file with attendance and leave data
    const attendecepath = await CreatExcel(filterAttendance);
    const leavepath = await CreatLeaveExcel(leaves);
    const filepath = { attendecepath, leavepath };

    // Merge attendance and leave Excel files into one
    const mergeexcel = await mergeExcels(attendecepath, leavepath);

    const subject = `Attendance Report of employeeId : ${filterAttendance[0]?.user?.employeeId} - [${Format_startDate || currentDate}] to [${Format_endDate || currentDate}]`;
    const body = `<h1>Dear Admin</h1><p>Attached is the attendance report of employeeId: ${filterAttendance[0]?.user?.employeeId} from [${Format_startDate || currentDate}] to [${Format_endDate || currentDate}].</p>`;

    // Send the Excel file via email
    await sendExcelMail(subject, body, email, mergeexcel);

    // Clean up generated files
    fs.unlinkSync(filepath.attendecepath);
    fs.unlinkSync(filepath.leavepath);
    fs.unlinkSync(mergeexcel);

    // Return success response
    res.status(200).json({
      message: "User's excel is created and has been sent by mail",
      filepath,
    });
  } catch (error) {
    // Handle error and send appropriate response
    handleError(res, 401, error.message);
  }
};


exports.adminUpdateAttendance = async (req, res) => {
  try {
    const { userId: user } = req.params;
    const { date, loginTime, logoutTime } = req.body;

    // Validate input
    if (!date || (!loginTime && !logoutTime)) {
      return res.status(400).json({
        status: "fail",
        message: "Date, and at least one of loginTime or logoutTime are required",
      });
    }

    // Convert the provided date to the start and end of that day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find the attendance record for the user on the specified date
    let attendance = await Attendance.findOne({
      user,
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    // If no attendance record found, create a new one
    if (!attendance) {
      attendance = await Attendance.create({ ...req.body, user });
      return res.status(201).json({
        status: "success",
        message: "New attendance record created",
        data: {
          attendance,
        },
      });
    }

    // Update loginTime and/or logoutTime
    if (loginTime) attendance.loginTime = loginTime;
    if (logoutTime) attendance.logoutTime = logoutTime;

    await attendance.save();

    res.status(200).json({
      status: "success",
      message: "Attendance updated successfully",
      data: {
        attendance,
      },
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    // Ensure that headers have not been sent before sending a response
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({
        status: "error",
        message: error.message || "Internal server error",
      });
    }
  }
};


// exports.excelUser = async (req, res, next) => {
//   try {
//     const { Format_startDate, Format_endDate } = req.body;
//     const userId = req.params.userId;

//     if (!Format_startDate || !Format_endDate) {
//       throw new Error("please enter duration");
//     }
//     const attendance = await Getattendence(Format_startDate, Format_endDate);

//     // getting attendance by userid
//     const filterAttendance = attendance.filter((att) => att._id == userId);
//     const leaves = await getUserHistory(
//       userId,
//       Format_startDate,
//       Format_endDate
//     );
//     if (!filterAttendance[0]) {
//       throw new Error("Attendance for this user not available");
//     }
//     const attendecepath = await CreatExcel(filterAttendance);
//     const leavepath = await CreatLeaveExcel(leaves);
//     const filepath = { attendecepath, leavepath };
//     const mergeexcel = await mergeExcels(attendecepath, leavepath);

//     fs.unlinkSync(filepath.attendecepath);
//     fs.unlinkSync(filepath.leavepath);
//     res.json({ msg: "Excel file created", attendance, leaves });
//   } catch (error) {
//     // Handle errors
//     console.error(error);
//     handleError(res, 401, error.message);
//   }
// };
