const mongoose = require("mongoose");

const leaveCountScheama = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  totalLeaves: {
    type: Number,
    default: 0,
  },
  pendingLeaves: {
    type: Number,
    default: 0,
  },
  approvedLeaves: {
    type: Number,
    default: 0,
  },
  rejectedLeaves: {
    type: Number,
    default: 0,
  },
  floaterleave: {
    type: Number,
    default: 1,
  },
  floaterDay: {
    type: String,
    defoult: "none",
  },
  privilageleave: {
    type: Number,
    default: 10,
  },
  sickleave: {
    type: Number,
    default: 5,
  },
  casualleave: {
    type: Number,
    default: 5,
  },
  unpaidleave: {
    type: Number,
    default: 0,
  },
  cancelledLeaves: {
    type: Number,
    default: 0,
  },
  expiredLeaves: {
    type: Number,
    default: 0,
  },
});

const LeavesCount = mongoose.model("LeavesCount", leaveCountScheama);

module.exports = LeavesCount;
