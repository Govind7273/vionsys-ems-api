const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const authController = require("../controller/authController");
const attendanceController = require("../controller/attendanceController");


//get params val
// router.param("id", userController.checkID);

router.post("/signup",authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);


router.post("/attendance",attendanceController.createAttendance);
router.get("/attendance", attendanceController.getAttendance);

router.get("/attendance/:userId", attendanceController.getAttendanceById);
router.put("/attendance/:userId", attendanceController.updateAttendance);

router
  .route("/")
  .get(authController.protect,authController.restrictTo(["admin"]), userController.getAllUsers)

router
  .route("/:id")
  .get(userController.getUser)
  .patch(authController.protect,authController.restrictTo(["admin"]),userController.updateUser)
  .delete(authController.protect,authController.restrictTo(["admin"]),userController.deleteUser);

module.exports = router;
