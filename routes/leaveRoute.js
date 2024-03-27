const express = require("express");
const router = express.Router();
const leaveController = require("../controller/leaveController");

router.post("/create", leaveController.createLeaveRequest);

router.get("/leaveHistory/:userId",leaveController.getleavesHistory);

module.exports = router;
