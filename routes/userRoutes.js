const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const authController = require("../controller/authController");
const attendanceController = require("../controller/attendanceController");
const notificationController=require("../controller/notificationController");
const {upload} =require('../middleware/multer.middleware');


//get params val
// router.param("id", userController.checkID);


router.post("/signup",upload.single('file'),authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);



// attendance routes
router.post("/attendance",attendanceController.createAttendance);
router.get("/attendance", attendanceController.getAttendance);
router.get("/attendance/:userId", attendanceController.getAttendanceById);
router.put("/attendance/:userId", attendanceController.updateAttendance);



// excel sheet route
router.post("/attendance/Excel/getExcel", attendanceController.excel);
router.post("/attendance/Excel/getExcel/:userId", attendanceController.excelById);
// the startDate and endDate in req.body for both above should be in format of YYYY-MM-DD


// admin routes
router
  .route("/")
  .get(authController.protect,authController.restrictTo(["admin"]), userController.getAllUsers)

router
  .route("/:id")
  .get(userController.getUser)
  .patch(authController.protect,authController.restrictTo(["admin"]),userController.updateUser)
  .delete(authController.protect,authController.restrictTo(["admin"]),userController.deleteUser);

//notification routes
router.post("/notification/create",notificationController.createNotification);
router.get("/notification/get",notificationController.getNotification);
router.get("/find/notification/:id",notificationController.getNotificationById);
router.delete("/delete/notification/:id",notificationController.deleteNotification);

module.exports = router;
