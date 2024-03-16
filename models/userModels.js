const mongoose = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    // required: [true, "Enter your name"],
  },
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
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  designation: {
    type: String,
  },
  photo: String,
  password: {
    type: String,
    required: [true, "Please provide your password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // this only works on create & save !! not findOne & update
      validator: function (el) {
        return el === this.password;
      },
      message: "Password are not the same !",
    },
  },
  reportingManager: {
    type: String,
  },
  teamLead: {
    type: String,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre("save", async function (next) {
  // only run this function if password was modified
  if (!this.isModified("password")) return;

  // hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // delete password confirm field before saving it to db
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function(next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// instance methods to checkPassword
// available in the all user document
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// userSchema.methods.changedPasswordAfter = function(JWTTimestamp){

//     return false;
// }

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log(resetToken, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
