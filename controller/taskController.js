const Task = require("../models/taskModels");
const User = require("../models/userModels");
const { getAllTasks } = require("../utils/getAllTasks");
const getTasksFromUserId = require("../utils/getTasksFromUserId");
const { sendNotificationToOne } = require("../utils/sendNotificationToUser");

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}

exports.createTask = async (req, res) => {
  try {
    const {
      deadline,
      user: userId,
      assignedBy: adminId,
      ...taskData
    } = req.body;

    // Validating the deadline to ensure it is in the future
    const isDeadLineValid = new Date(deadline) > new Date();
    if (!isDeadLineValid)
      throw new Error("Deadline must be in the future only!!");

    // Create a new task
    const task = await Task.create({
      deadline,
      user: userId,
      assignedBy: adminId,
      ...taskData,
    });
    if (!task) throw new Error("Task is not created; it may already exist!");

    // Searching for the user's notification token by user ID
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found!");

    const userNotificationToken = user?.notificationToken || "";

    // Searching for the admin by ID to get the name
    const admin = await User.findById(adminId); // Fetch the admin
    if (!admin) throw new Error("Admin not found!");

    // Constructed notification payload
    const notificationPayload = {
      title: "New task assigned",
      description: `A new task is assigned by ${
        admin?.firstName + admin?.lastName
      }`,
    };
    // Send notification to the user
    await sendNotificationToOne(userNotificationToken, notificationPayload);

    // Respond with success
    res.status(201).json({
      status: "success",
      data: task,
    });
  } catch (error) {
    handleError(res, 400, error.message);
  }
};

// task started or the task accepted by the employee then update the start date in task db
exports.updateTaskStart = async (req, res) => {
  try {
    const start_date = new Date();
    const { id } = req.params;

    // Find the task by its ID
    const task = await Task.findById(id);
    if (!task) throw new Error("Task not found");
    // Ensure the task hasn't been completed already
    if (task.completedDate) throw new Error("Before start, can't complete task.");

    // Update task details
    task.startedDate = start_date;
    task.status = "INPROGRESS";
    const updatedTask = await task.save();

    // Fetch the admin details using the assignedBy field from the task
    const admin = await User.findById(task.assignedBy);
    if (!admin) throw new Error("Admin not found!");

    const adminNotificationToken = admin?.notificationToken || "";

    // Fetch the user details to get the user's name
    const user = await User.findById(task.user);
    if (!user) throw new Error("User not found!");

    // Construct the notification payload for the admin
    const notificationPayload = {
      title: "Task Started",
      description: `${user.firstName} ${user.lastName} started working on assigned task.`,
    };

    // Send notification to the admin
    await sendNotificationToOne(adminNotificationToken, notificationPayload);

    // Respond with success
    res.status(200).json({
      status: "success",
      data: updatedTask,
    });
  } catch (err) {
    console.log(err);
    handleError(res, 404, err.message);
  }
};

// once employee completes the task then update the completion date
exports.updateTaskCompleted = async (req, res) => {
  try {
    const completion_Date = new Date();
    const { id } = req.params;

    // Find the task by its ID
    const task = await Task.findById(id);
    if (!task) throw new Error("Task not found");
    // Ensure that the task has been started.
    if (!task.startedDate)
      throw new Error("Before start, can't complete task!!!");
    
    // Update the task status
    task.completedDate = completion_Date;
    task.status = "COMPLETED";
    const updatedTask = await task.save();

    // Fetch the admin details by using assignedBy field from the task
    const admin= await User.findById(task.assignedBy);
    if(!admin) throw new Error("Admin not Found");
    
    const adminNotificationToken = admin?.notificationToken || "";

    // Fetch User Details to get the user name
    const user = await User.findById(task.user)
    if(!user) throw new Error("No User Found");

    // Construct the notification payload for the admin
    const notificationPayload = {
      title: "Task Completed",
      description: `${user.firstName} ${user.lastName} Completed the assigned task`
    };

    // Send notification to admin
    await sendNotificationToOne(adminNotificationToken, notificationPayload)

    // Respond with Success
    res.status(200).json({
      status: "success",
      data: updatedTask,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 404, error.message);
  }
};

exports.getTasksFromUserId = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const tasks = await getTasksFromUserId(userId);
    res.status(200).json({
      status: "success",
      data: tasks,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 404, error.message);
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await getAllTasks();
    res.status(200).json({
      status: "success",
      data: tasks,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 404, error.message);
  }
};
