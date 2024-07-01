const mongoose = require("mongoose");

const workHistoryScheama = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  componeyName: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  skills: {
    type: [],
    required: true,
  },
});

const WorkHistory = mongoose.model("WorkHistory", workHistoryScheama);

module.exports = WorkHistory;
