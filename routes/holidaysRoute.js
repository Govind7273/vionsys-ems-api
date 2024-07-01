const express = require("express");
const router = express.Router();
const holidaysController = require("../controller/holidaysController");
const authController = require("../controller/authController");

router.post(
  "/",
  authController.protect,
  authController.restrictTo(["admin"]),
  holidaysController.createHoliday
);

router.get("/:year", holidaysController.getHolidaysByYear);

router.delete(
  "/:id",
  authController.protect,
  authController.restrictTo(["admin"]),
  holidaysController.deleteHoliday
);

module.exports = router;
