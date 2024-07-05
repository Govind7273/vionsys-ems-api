const Notification = require("../models/notificationModel");
const User = require("../models/userModels");
const getAllNote = require("../utils/getAllNote");
const getNotificationTokens = require("../utils/getUserNotification");
const sendNotificationToAll = require("../utils/sendNotificationToAll");

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}

exports.createNotification = async (req, res) => {
  try {
    const { userid, ...values } = req.body;

    if (!req.body) {
      throw new Error("Please provide title and description of notification");
    }
    const newNotification = await Notification.create({ userid, ...values });

    if (!newNotification) {
      res.status(401).json({
        error: "failed to sent Notification!!",
      });
    }
    const ArrayOfTokens = await getNotificationTokens();
    await sendNotificationToAll(ArrayOfTokens, values);

    res.status(201).json({
      message: "Notification Sent!!",
    });
  } catch (error) {
    handleError(res, 401, error.message);
  }
};

exports.getNotification = async (req, res) => {
  try {
    const notifications = await getAllNote();
    if (!notifications) throw new Error("Notification not found");
    res.status(200).json({
      notifications,
    });
  } catch (error) {
    // Handle error appropriately, such as logging or returning an error response
    console.log(error);
    handleError(res, 401, error.message);
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    const notificationId = req.params.id.replace("id=", ""); // Remove the "id=" prefix
    const notification = await Notification.findOne({ _id: notificationId });
    if (!notification)
      throw new Error("User not found with id:" + req.params.id);
    res.status(200).json({
      notification,
    });
  } catch (error) {
    handleError(res, 404, error.message);
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id.replace("id=", "");
    const response = await Notification.deleteOne({ _id: notificationId });
    if (!response) throw new Error("User not found with id:" + req.params.id);
    res.status(202).json({
      response,
    });
  } catch (error) {
    handleError(res, 404, error.message);
  }
};

exports.getNotificationToken = async (req, res) => {
  try {
    const notificationToken = req.params.notificationToken;
    const { userId } = req.body;
    if (!userId || !notificationToken)
      throw new Error("Please provide both userId and notificationToken");

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { notificationToken: notificationToken },
      { new: true }
    );
    if (!updatedUser) throw new Error("User not found or not exist");
    return res.json({ updatedUser });
  } catch (error) {
    handleError(res, 404, error.message);
  }
};
