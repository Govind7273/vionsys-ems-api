const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const authController = require("../controller/authController");

const { upload } = require("../middleware/multer.middleware");

//get params val
// router.param("id", userController.checkID);
router.get("/birthdays", userController.employeeBirthday);
router.post(
  "/signup",
  authController.protect,
  authController.restrictTo(["admin"]),
  upload.single("file"),

  authController.signup
);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.post(
  "/sendverifyMail",
  authController.protect,
  authController.sendMailVerification
);
router.post("/verifyMail/:token", authController.mailVerifacation);

// admin routes
router
  .route("/")
  .get(
    // authController.protect,
    // authController.restrictTo(["admin"]),
    userController.getAllUsers
  );

router
  .route("/:id")
  .get(userController.getUser)
  .patch(
    upload.single("file"),
    authController.protect,
    authController.restrictTo(["admin"]),
    userController.updateUser
  )
  .delete(
    authController.protect,
    authController.restrictTo(["admin"]),
    userController.deleteUser
  );

module.exports = router;
