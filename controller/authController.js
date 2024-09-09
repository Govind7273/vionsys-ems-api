const { promisify } = require("util");
const crypto = require("crypto");
const { sendEmail } = require("../utils/email");
const jwt = require("jsonwebtoken");
const User = require("../models/userModels");
const HOST = process.env.HOST;
const fs = require("fs");
const { uploadOnCloudinary } = require("../utils/cloudinary");

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "development") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);
  // remove password from the output
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = async (req, res, next) => {
  const imagepath = req?.file.path;
  try {
    const url = await uploadOnCloudinary(imagepath);
    const newUser = await User.create({
      ...req.body,
      profile: url,
    });

    console.log(newUser);
    createSendToken(newUser, 201, res);
  } catch (error) {
    console.log(error);
    handleError(res, 401, error.message);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // check if email exist
    if (!email || !password) {
      throw new Error("Please provide email & password");
    }
    // check if user exist && password is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new Error("Please provide valid email & password!");
    }
    //if everything ok send token to client
    const token = signToken(user._id, user.role);

    res.status(200).json({
      status: "success",
      token,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 401, error.message);
  }
};

exports.protect = async (req, res, next) => {
  try {
    //get token & check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new Error("You are not logged in! Please log in to get access.");
    }
    //verification
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //check if user still exists
    const freshUser = await User.findById(decoded.id);

    if (!freshUser) {
      throw new Error("User belong to this token is no longer exist");
    }
    //check if user changed password after token issued

    req.user = freshUser;
    next();
  } catch (error) {
    handleError(res, 401, error.message);
  }
};

exports.restrictTo = (roles) => {
  return async (req, res, next) => {
    //roles ["admin","lead-guide"]
    const token = req.headers.authorization.split(" ")[1];
    const user = await jwt.decode(token);
    if (!roles.includes(user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action.",
      });
    }
    // If the user has the required role, proceed to the next middleware
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  try {
    if (!req.body.email) {
      throw new Error("please enter your Email");
    }
    // 1) get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      throw new Error("User not found !");
    }

    //2) generate the random token
    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //3) send it to users email
    const resetUrl = `${HOST}/ResetPassword/${resetToken}`;

    const message = `Dear ${user.firstName},<br><br>
We received a request to reset your password. If this was you, please click the link below to create a new password:<br><br>
<a href="${resetUrl}">Reset Your Password</a><br><br>
If you did not request a password reset, you can safely ignore this email.<br><br>
Thank you,<br>
Vionsys IT Solutions India Pvt. Ltd Support Team`;

    // `Forgot your password? create new with ${resetUrl}. If you didn't forgot your password, please ignore this email`;

    try {
      await sendEmail({
        email: user.email,
        message,
        subject: "Password Reset: Your reset token is valid for 10 minutes.",
      });

      res.status(200).json({
        status: "success",
        message: "Token sent to email.",
      });
    } catch (error) {
      user.passwordResetExpires = undefined;
      user.passwordResetToken = undefined;
      await user.save({ validateBeforeSave: false });

      throw new Error("Error while sending email.");
    }
  } catch (error) {
    handleError(res, 404, error.message);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1) get user based on the token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) if token has not expired and there is user - set the new password
    if (!user) {
      throw new Error("token is invalid or has expired");
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();

    await user.save();

    // 4) log the user in send jwt
    const token = signToken(user._id, user.role);

    res.status(200).json({
      status: "success",
      message: "password reset succesfully",
      token,
    });
  } catch (error) {
    handleError(res, 401, error.message);
  }
};

exports.sendMailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("unauthorized access request");
    }
    const resetToken = crypto.randomBytes(32).toString("hex");

    upatetoken = crypto.createHash("sha256").update(resetToken).digest("hex");

    const resetUrl = `${HOST}/Verifymail/${resetToken}`;
    const message = `Dear ${user.firstName},<br><br>
We have received a request to verify your email address. If you initiated this request, please click the link below to verify your email:<br><br>
<a href="${resetUrl}">Verify Your Email</a><br><br>
If you did not request for this verifacation, you can safely ignore this email.<br><br>
Thank you for your attention,<br>
Vionsys IT Solutions India Pvt. Ltd Support Team`;

    user.verificationToken = upatetoken;
    user.verificationExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    await sendEmail({
      email: user.email,
      message,
      subject: "Verify Mail : your Mail verification token valid for 10 min",
    });
    res.status(200).json({
      status: "success",
      message: "Email verification sent to your Email",
    });
  } catch (error) {
    handleError(res, 401, error.message);
  }
};

exports.mailVerifacation = async (req, res) => {
  try {
    const token = req.params.token;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: Date.now() },
    });
    console.log("user", user);
    if (!user) {
      throw new Error("token is invalid or has expired");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Email verified succesfully", token });
  } catch (error) {
    handleError(res, 401, error.message);
  }
};
