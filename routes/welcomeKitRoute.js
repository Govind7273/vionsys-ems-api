const express = require("express");
const router = express.Router();
const welcomeKitController = require("../controller/welcomeKitController");
const authController = require("../controller/authController");

router.post(
  "/create",
  authController.protect,
  authController.restrictTo(["admin"]),
  welcomeKitController.addTheKit
);
router.get("/:userId", welcomeKitController.getKitDetails);

router.patch(
  "/:id",
  authController.protect,
  authController.restrictTo(["admin"]),
  welcomeKitController.deleteKit
);

module.exports = router;
