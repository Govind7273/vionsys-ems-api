const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  loginTime: {
    type: Date,
  },
  loginDevice: {
    type: String,
  },
  logoutDevice: {
    type: String,
  },
  logoutTime: {
    type: Date,
  },
  note: {
    type: String,
  },
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
