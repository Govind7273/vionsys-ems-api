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
  noticePeriodDays: {
    type: Number,
  },
  defaultNoticePeriod: {
    type: Number,
    default: 60,
  
  },
  resignationReason: {
    type: String,
    required: [true, "Please provide the resignation reason"],
  },
  resignationCancle: {
    type: Boolean,
    default: false,
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
    enum: ["Approved", "Rejected", "Pending", "Canceled"],
    default: "Pending",
  },
  cancleResignationReason: {
    type: String,
    default: "none",
  },
  cancleResignationDate: {
    type: Date,
  },
  exitDate: {
    type: Date,
  },
});

const Resignation = mongoose.model("Resignation", resignationSchema);

module.exports = Resignation;
