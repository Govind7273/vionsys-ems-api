const WelcomeKit = require("../models/welcomeKitModal");
const User = require("../models/userModels");

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}
exports.addTheKit = async (req, res) => {
  console.log("user added")
  try {
    const kitUser = await User.findOne({ _id: req?.body?.user });
    if (!kitUser) {
      throw new Error("User not found or be deleted!");
    }
    const newKit = await WelcomeKit.create({ ...req?.body });

    res
      .status(200)
      .json({ message: "Accessorie succesfully given to employee ", newKit });
  } catch (error) {
    console.log(error)
    handleError(res, 404, error.message);
  }
};

exports.getKitDetails = async (req, res) => {
  try {
    const userId = req?.params?.userId;
    const user = await User.findById({ _id: userId });
    if (!user) {
      throw new Error("User not found or be deleted!");
    }
    const kits = await WelcomeKit.find({ user: userId });
    if (!kits) {
      throw new Error("User kits not found or be deleted!");
    }
    res
      .status(200)
      .json({ message: "user kit details fetched succedfully", kits });
  } catch (error) {
    handleError(res, 404, error?.message);
  }
};

exports.deleteKit = async (req, res) => {
  try {
    const kitId = req?.params?.id;
    const kit = await WelcomeKit.findByIdAndUpdate({ _id: kitId }, { isReturned: true, returnedDate: Date.now() });
    if (!kit) {
      throw new Error("User accessorie not found or be deleted!");
    }
    res.status(200).json({ message: "Accessory Successfully returned to the management.!!!" });
  } catch (error) {
    handleError(res, 404, error?.message);
  }
};
