const mongoose = require("mongoose");

const leavesScheama = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  leaveType: {
    type: String,
    required: [true, "Please select the leave Type"],
    enum: ["Medical Leave", "Casual Leave"],
    default: "Casual Leave",
    validate: {
      validator: function (value) {
        return ["Medical Leave", "Casual Leave"].includes(value);
      },
      message: (props) => `${props.value} is not a valid leave reason !`,
    },
  },
  leaveReason: {
    type: String,
    required: [true, "Please provide the Leave Reason"],
  },
  leaveDays: {
    type: Number,
    default: 0,
  },
  leaveStart: {
    type: Date,
    default: Date.now,
  },
  leaveEnd: {
    type: Date,
    default: Date.now,
  },
  leaveCancle: {
    type: Boolean,
    default: false,
  },
  leaveStatus: {
    type: String,
    enum: ["Approved", "Rejected", "Pending"],
    default: "Pending",
    validate: {
      validator: function (value) {
        return ["Medical Leave", "Casual Leave", "Pending"].includes(value);
      },
      message: (props) => `${props.value} is not a valid status !`,
    },
  },
});

const Leaves = mongoose.model("Leaves", leavesScheama);

module.exports = Leaves;
