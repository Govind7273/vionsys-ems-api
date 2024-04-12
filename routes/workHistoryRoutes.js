const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const addWorkHistory = require("../controller/workHistoryController");

router.post(
  "/",
  authController.protect,
  authController.restrictTo(["admin"]),
  addWorkHistory.addWorkHistory
);

router.get("/:userId", authController.protect, addWorkHistory.getWorkHistory);

router.delete(
  "/:_id",
  authController.protect,
  authController.restrictTo(["admin"]),
  addWorkHistory.deleteWorkHistory
);
module.exports = router;
