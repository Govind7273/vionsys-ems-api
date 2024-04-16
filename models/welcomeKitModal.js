const mongoose = require("mongoose");

const welcomeKitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  accessoryName: {
    type: String,
    required: true,
  },
  accessoryCompany: {
    type: String,
  },
  accessoryId: {
    type: String,
  },
  assignDate: {
    type: Date,
    required: [true, "the date of giving of accessorie is requried"],
  },
  assignBy: {
    type: String,
    required: [true, "the name of given person is requried"],
  },
  isReturned: {
    type: Boolean,
    default: false,
  },
  returnedDate: {
    type: Date,
  }
});

const WelcomeKit = mongoose.model("WelcomeKit", welcomeKitSchema);

module.exports = WelcomeKit;
