const express = require("express");
const router = express.Router();
const leaveController = require("../controller/leaveController");
const authController = require("../controller/authController");

router.post(
  "/create",
  authController.protect,
  leaveController.createLeaveRequest
);

router.get("/leaveHistory/:userId", leaveController.getleavesHistoryById);
router.get(
  "/leaveHistory",
  authController.protect,
  authController.restrictTo(["admin"]),
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

module.exports = router;
