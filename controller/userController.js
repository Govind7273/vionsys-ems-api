const User = require("../models/userModels");

// exports.checkID = (req, res, next, val) => {
//   console.log(`User id is ${val}`);
//   next();
// };

function handleError (res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
};


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
    console.log(users)
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
      throw new Error("Cannot delete. User not found !");
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

exports.updateUser = async (req, res) => {
  try {
    const user = await User.updateOne({ name: req.body.name });

    res.status(200).json({
      status: "success",
      data: {
        message: "User successfully updated !",
        user
      },
    });
  } catch (error) {
    handleError(res, 400, error.message);
  }
};

