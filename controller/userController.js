const User = require("../models/userModels");
const { removeFromCloudinary, uploadOnCloudinary } = require("../utils/cloudinary");

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
    const response=await removeFromCloudinary(user.profile);
    if(!response){
      throw new Error("user deleted but image is not able to delete");
    }

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
    let url;
    const user=await User.findById(req.body._id);
    if(!req?.file){
       url=user.profile;
    }else{
      const response=await removeFromCloudinary(user.profile);
      console.log("File removed From Cloudinary::",response)
      const imagepath=req?.file.path;
      url= await uploadOnCloudinary(imagepath);
    }
    user.passwordConfirm=user.password;
    user.profile=url;
    user.firstName=req.body.firstName;
    user.lastName=req.body.lastName;
    user.email=req.body.email;
    user.address=req.body.address;
    user.bloodGroup=req.body.bloodGroup;
    user.gender=req.body.gender;
    user.phone=req.body.phone;
    user.dob=req.body.dob;
    user.employeeId=req.body.employeeId;
    user.designation=req.body.designation;
    user.reportingManager=req.body.reportingManager;
    user.teamLead=req.body.teamLead;
    await user.save();
    res.status(200).json({
      status: "success",
      data: {
        message: "User successfully updated !",
        user
      },
    });
  } catch (error) {
    console.log(error)
    handleError(res, 400, error.message);
  }
};


exports.employeeBirthday = async (req, res) => {
  try {
      const { month } = req.body;
      const today = new Date();
      const monthMap = {
          "January": 1,
          "February": 2,
          "March": 3,
          "April": 4,
          "May": 5,
          "June": 6,
          "July": 7,
          "August": 8,
          "September": 9,
          "October": 10,
          "November": 11,
          "December": 12
      };

      const monthNumber = monthMap[month];

      if (!monthNumber) {
          return res.status(400).json({ message: 'Invalid month provided' });
      }

      // Calculate the month after today
      const nextMonth = (today.getMonth() + 2) % 12 || 12; // Handle December case

      const usersInMonth = await User.find({
          $expr: {
              $and: [
                  { $eq: [{ $month: '$dob' }, monthNumber] },
                  { $gt: [{ $dayOfMonth: '$dob' }, today.getDate()] }
              ]
          }
      });

      // Get users whose birthday is today
      const usersToday = await User.find({
          $expr: {
              $and: [
                  { $eq: [{ $month: '$dob' }, today.getMonth() + 1] },
                  { $eq: [{ $dayOfMonth: '$dob' }, today.getDate()] }
              ]
          }
      });

      res.json({ usersInMonth, usersToday });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
  }
};








