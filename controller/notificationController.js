const Notification = require("../models/notificationModel");
const getAllNote = require("../utils/getAllNote");
function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}

exports.createNotification = async (req, res) => {
  try {
    if (!req.body) {
      throw new Error("Please provide title and description of notification");
    }
    const { userid, ...values } = req.body;
    const newNotification = await Notification.create({ userid,...values });
    if (newNotification) {
      res.status(201).json({
        message: "Notification Sent!!"
      })
    }
  } catch (error) {
    handleError(res, 401, error.message);
  }
}

exports.getNotification = async (req, res) => {
  try {
    const notifications = await getAllNote();
    if (!notifications) throw new Error("Notification not found");
    res.status(200).json({
      notifications
    })
  } catch (error) {
    // Handle error appropriately, such as logging or returning an error response
    console.log(error)
    handleError(res, 401, error.message);
  }
}

exports.getNotificationById = async (req, res) => {
  try {
    const notificationId = req.params.id.replace('id=', ''); // Remove the "id=" prefix
    const notification = await Notification.findOne({ _id: notificationId });
    if (!notification) throw new Error("User not found with id:" + req.params.id);
    res.status(200).json({
      notification
    })
  } catch (error) {
    handleError(res, 404, error.message);
  }
}

exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id.replace('id=', '');
    const response = await Notification.deleteOne({ _id: notificationId })
    if (!response) throw new Error("User not found with id:" + req.params.id);
    res.status(202).json({
      response
    })
  } catch (error) {
    handleError(res, 404, error.message);
  }
}