const express = require("express");
const router = express.Router();
const attendanceController = require("../controller/attendanceController");
const authController = require("../controller/authController");


// attendance routes
router.post("/create", authController.protect, attendanceController.createAttendance);
router.get("/get", authController.protect, attendanceController.getAttendance);
router.get("/find/:userId", authController.protect, attendanceController.getAttendanceById);
router.put("/update/:userId", authController.protect, attendanceController.updateAttendance);
// excel sheet route
router.post(
    "/Excel/getExcel",
    authController.protect,
    authController.restrictTo(["admin"]),
    attendanceController.excel
);
router.post(
    "/Excel/getExcel/:userId",
    authController.protect,
    authController.restrictTo(["admin"]),
    attendanceController.excelById
);

router.put(    
    "/admin/update/:userId",
    //  authController.protect,
    //  authController.restrictTo(["admin"]),
     attendanceController.adminUpdateAttendance 
);

module.exports = router;