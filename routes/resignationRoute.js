const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const resignationController = require("../controller/resignationController");

//resignation routs
router.get('/findAllResignation/:id',resignationController.getResignationFromUserId);
router.get('/getAllResignation',resignationController.getAllResignation);
router.post('/createResignation',resignationController.createResignation);
router.post("/approved",authController.restrictTo(["admin"]),resignationController.resignationApprovedByAdmin);
router.post("/rejected",authController.restrictTo(["admin"]),resignationController.resignationRejectedByAdmin);

module.exports= router;