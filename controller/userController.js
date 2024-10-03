const User = require("../models/userModels");
const {
  removeFromCloudinary,
  uploadOnCloudinary,
} = require("../utils/cloudinary");

// exports.checkID = (req, res, next, val) => {
//   console.log(`User id is ${val}`);
//   next();
// };

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}

exports.checkBody = (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      message: "Failed",
    });
  }
  next();
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json({
      status: "success",
      requestedAt: req.reqTime,
      data: {
        users,
      },
    });
  } catch (error) {
    res.status(401).json({
      status: "error",
      error: error.message,
    });
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);

    if (!user) {
      throw new Error("User not found !");
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    handleError(res, 404, error.message);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw new Error("Cannot delete. User not found");
    }

    // Remove profile image if available
    if (user.profile) {
      const response = await removeFromCloudinary(user.profile);
      if (!response) {
        throw new Error("User deleted, but image could not be removed");
      }
    }

    res.status(200).json({
      status: "success",
      message: "User successfully deleted",
      data: { user },
    });
  } catch (error) {
    handleError(res, 404, error.message);
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.body._id);

    if (!user) {
      throw new Error("User not found");
    }

    let profileUrl = user.profile;

    // Update profile image if a new file is provided
    if (req.file) {
      await removeFromCloudinary(user.profile);
      profileUrl = await uploadOnCloudinary(req.file.path);
    }

    // Update only provided fields
    Object.assign(user, {
      ...req.body,
      profile: profileUrl,
      passwordConfirm: user.password,
    });

    await user.save();

    res.status(200).json({
      status: "success",
      message: "User successfully updated",
      data: { user },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    handleError(res, 400, error.message);
  }
};


exports.employeeBirthday = async (req, res) => {
  try {
    console.log("hello");
    const monthNumber = new Date().getMonth();
    console.log(monthNumber);
    const today = new Date();

    if (!monthNumber) {
      return res.status(400).json({ message: "Invalid month provided" });
    }

    // Calculate the month after today
    const nextMonth = (today.getMonth() + 2) % 12 || 12; // Handle December case

    const usersInMonth = await User.find({
      $expr: {
        $and: [
          { $eq: [{ $month: "$dob" }, monthNumber + 1] },
          { $gt: [{ $dayOfMonth: "$dob" }, today.getDate()] },
        ],
      },
    });

    // Get users whose birthday is today
    const usersToday = await User.find({
      $expr: {
        $and: [
          { $eq: [{ $month: "$dob" }, today.getMonth() + 1] },
          { $eq: [{ $dayOfMonth: "$dob" }, today.getDate()] },
        ],
      },
    });

    res.json({ usersInMonth, usersToday });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
