const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const notificationController = require("../controller/notificationController");

//notification routes
router.post(
  "/create",
  authController.protect,
  authController.restrictTo(["admin"]),
  notificationController.createNotification
);
router.get(
  "/get",
  authController.protect,
  notificationController.getNotification
);
router.get(
  "/find/:id",
  authController.protect,
  notificationController.getNotificationById
);
router.delete(
  "/delete/:id",
  authController.protect,
  authController.restrictTo(["admin"]),
  notificationController.deleteNotification
);

router.post(
  "/getNotificationToken/:notificationToken",
  //   authController.protect,
  notificationController.getNotificationToken
);
module.exports = router;
