const mongoose = require("mongoose");

const resignationSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  resignationType: {
    type: String,
    required: [true, "Please Select the Resignation Type"],
    enum: ["Resign with Notice period", "Resign without Notice period"],
    default: "Resign with Notice period",
    validate: {
      validator: function (value) {
        return [
          "Resign with Notice period",
          "Resign without Notice period",
        ].includes(value);
      },
      message: (props) => `${props.value} is not a valid resignation type!`,
    },
  },
  noticePeriodDays: {
    type: Number,
    default: 1,
  },
  resignationReason: {
    type: String,
    required: [true, "Please provide the Resignation Reason"],
  },
  resignationCancle: {
    type: Boolean,
    default: false,
  },
  noteByAdmin: {
    type: String,
    defaultL: "Wait Please",
  },
  noteByAdmin: {
    type: String,
    default: "nothing by Admin",
  },
  adminApprovedDate: {
    type: Date,
  },
  adminRejectedDate: {
    type: Date,
  },
  resignationStatus: {
    type: String,
    enum: ["Approved", "Rejected", "Pending"],
    default: "Pending",
    validate: {
      validator: function (value) {
        return ["Approved", "Rejected", "Pending"].includes(value);
      },
      message: (props) => `${props.value} is not a valid status!`,
    },
  },
  cancleResignationReason: {
    type: String,
    default: "none",
  },
  exitDate: {
    type: Date,
  },
});

const Resignation = mongoose.model("Resignation", resignationSchema);

module.exports = Resignation;
