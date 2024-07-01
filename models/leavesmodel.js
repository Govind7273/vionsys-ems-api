const mongoose = require("mongoose");

const leavesScheama = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  halfDay: {
    type: Boolean,
    default: false,
  },
  noteByAdmin: {
    type: String,
    default: "nothing by Admin",
  },
  leaveType: {
    type: String,
    required: [true, "Please select the leave Type"],
    enum: [
      "Sick Leave",
      "Casual Leave",
      "Floater Leave",
      "Privilage Leave",
      "Unpaid Leave",
    ],
    default: "Casual Leave",
    validate: {
      validator: function (value) {
        return [
          "Sick Leave",
          "Casual Leave",
          "Floater Leave",
          "Privilage Leave",
          "Unpaid Leave",
        ].includes(value);
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
    default: 1,
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
  cancleDate: {
    type: Date,
    default: Date.now,
  },
  cancleReason: {
    type: String,
    default: "none",
  },
  floaterDay: {
    type: String,
    defoult: "none",
  },
  leaveStatus: {
    type: String,
    enum: ["Approved", "Rejected", "Pending", "Cancelled", "Expired"],
    default: "Pending",
    validate: {
      validator: function (value) {
        return [
          "Approved",
          "Rejected",
          "Pending",
          "Cancelled",
          "Expired",
        ].includes(value);
      },
      message: (props) => `${props.value} is not a valid status !`,
    },
  },
});

const Leaves = mongoose.model("Leaves", leavesScheama);

module.exports = Leaves;
