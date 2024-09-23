const express = require("express");
const router = express.Router();
const leaveController = require("../controller/leaveController");
const authController = require("../controller/authController");
 
router.post(
  "/create",
  authController.protect,
  leaveController.createLeaveRequest
);
 
router.post(
  "/cancel/:leaveId",
  authController.protect,
  leaveController.cancelLeaveRequest
);
 
router.get("/leaveHistory/:userId", leaveController.getleavesHistoryById);
router.get(
  "/leaveHistory",
  authController.protect,
  leaveController.getleaveHistory
);
 
router.post(
  "/Approved",
  authController.protect,
  authController.restrictTo(["admin"]),
  leaveController.leaveApprovedByAdmin
);
router.post(
  "/Rejected",
  authController.protect,
  authController.restrictTo(["admin"]),
  leaveController.leaveRejectedByAdmin
);
 
// Update leave counts for a user (protected)
router.patch(
  "/update/:userId",
  authController.protect,
  authController.restrictTo(["admin"]),
  leaveController.updateLeaveCountAdmin
);
 
module.exports = router;