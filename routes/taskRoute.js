const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const taskController = require("../controller/taskController");

//tasks routes
router.get('/findAll/:id', authController.protect, taskController.getTasksFromUserId);
router.get('/getAll', authController.protect, taskController.getAllTasks);
router.post('/create', authController.protect, authController.restrictTo(["admin"]), taskController.createTask);
router.patch('/started/:id', authController.protect, taskController.updateTaskStart);
router.patch('/completed/:id', authController.protect, taskController.updateTaskCompleted);


module.exports = router;

