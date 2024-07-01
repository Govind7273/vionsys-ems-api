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
        <p>[ Vionsys IT Solution Private Limited ]</p>`,
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

    // Getting attendance of all users
    const attendance = await Getattendence(Format_startDate, Format_endDate);

    // getting attendance by userid
    const filterAttendance = attendance.filter((att) => att._id == userId);
    const leaves = await getUserHistory(
      userId,
      Format_startDate,
      Format_endDate
    );
    if (!filterAttendance[0]) {
      throw new Error("Attendance for this user not available");
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
        <p>[ Vionsys IT Solution Private Limited ]</p>`,
      };
      // sending alert email to admin about anauthorized email access
      await sendEmail(options);
      throw new AppError(401, "unouthorized email detected");
    }
    // creating excel by userid

    const attendecepath = await CreatExcel(filterAttendance);
    const leavepath = await CreatLeaveExcel(leaves);
    const filepath = { attendecepath, leavepath };
    const mergeexcel = await mergeExcels(attendecepath, leavepath);

    const subject = `Attendance Report of employeeId : ${filterAttendance[0]?.user?.employeeId} - [${Format_startDate}] to [${Format_endDate}]`;
    const body = `<h1>Dear Admin<h1/>
     <p> Attached is the attendance report of employeeId : ${filterAttendance[0]?.user?.employeeId} from[${Format_startDate}] to[${Format_endDate}].<p/>`;

    // mailing service
    await sendExcelMail(subject, body, email, mergeexcel);

    fs.unlinkSync(filepath.attendecepath);
    fs.unlinkSync(filepath.leavepath);
    fs.unlinkSync(mergeexcel);
    res.status(200).json({
      message: "User's excel is created and has been sent by mail",
      filepath,
    });
  } catch (error) {
    handleError(res, 401, error.message);
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
