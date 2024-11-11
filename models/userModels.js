const mongoose = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  employeeId: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email !"],
  },
  personalEmail: {
    type: String,
    required: [true, "Please provide your personal email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid personal email !"],
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    required: [true, "Please provide your role"],
  },
  designation: {
    type: String,
  },
  profile: {
    type: String,
    required: [true, "Please provide your profile"],
  },
  TempAddress: {
    type: String,
    required: [true, "Please provide Temporary address"],
  },
  PerAddress: {
    type: String,
    required: [true, "Please provide Permanent address"],
  },
  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    required: [true, "Please provide blood group"],
  },
  dob: {
    type: Date,
    required: [true, "Please provide date of birth."],
    validate: {
      validator: function (value) {
        return value <= new Date();
      },
      message: "Date of birth cannot be in the future.",
    },
  },
  doj: {
    type: Date,
    required: [true, "Please provide date of joining."],
    validate: {
      validator: function (value) {
        return value <= new Date();
      },
      message: "Date of joining cannot be in the future.",
    },
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: [true, "Please provide gender"],
  },
  phone: {
    type: String,
    required: [true, "Please provide contact details"],
    length: [10, "Must be a 10 digit number"],
  },
  emergencyPhone: {
    type: String,
    required: [true, "Please provide emergency contact details"],
    length: [10, "Must be a 10 digit number"],
  },
  password: {
    type: String,
    required: [true, "Please provide your password"],
    minlength: [8, "Please enter password of 8 characters"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    // required: [true, "Please confirm your password"],
    // validate: {
    //   validator: function (el) {
    //     return el === this.password;
    //   },
    //   message: "Password confirmation does not match password",
    // },
  },
  reportingManager: {
    type: String,
  },
  teamLead: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationExpires: Date,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  notificationToken: String,

  // Adding document reference array
  documents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document", // Reference to Document model
    },
  ],
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
