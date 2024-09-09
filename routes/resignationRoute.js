const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const resignationController = require("../controller/resignationController");

// Resignation routes
router.get('/findAllResignation/:id', resignationController.getResignationFromUserId);
router.get('/getAllResignation', resignationController.getAllResignation);
router.post('/createResignation', resignationController.createResignation);
router.post("/updateStatus",resignationController.updateResignationStatus);
router.post("/cancle", resignationController.cancelResignationByUser);

module.exports = router;
