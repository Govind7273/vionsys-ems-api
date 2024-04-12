const mongoose = require("mongoose");

const welcomeKitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  accessorieName: {
    type: String,
    required: true,
  },
  accessorieCompany: {
    type: String,
  },
  accessoriesId: {
    type: String,
  },
  givenDate: {
    type: Date,
    required: [true, "the date of giving of accessorie is requried"],
  },
  givenBy: {
    type: String,
    required: [true, "the name of given person is requried"],
  },
});

const WelcomeKit = mongoose.model("WelcomeKit", welcomeKitSchema);

module.exports = WelcomeKit;
