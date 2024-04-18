const WorkHistory = require("../models/workhistoryModel");
const getdiff = require("../utils/dateDiff");

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}
exports.addWorkHistory = async (req, res) => {
  try {
    const diff = getdiff(req?.body?.startDate, req?.body?.endDate);
    const userhistory = await WorkHistory.create({
      ...req?.body,
      duration: diff,
    });
    res.status(200).send({ message: "work history added", userhistory });
  } catch (error) {
    handleError(res, 404, error.message);
  }
};

exports.getWorkHistory = async (req, res) => {
  try {
    const userId = req?.params?.userId;
    const workhistory = await WorkHistory.find({ user: userId });
    if (!workhistory) {
      throw new Error("work history not found");
    }
    res.status(200).json({
      message: "work history fetched successfully",
      workhistory,
    });
  } catch (error) {
    handleError(res, 404, error.message);
  }
};

exports.deleteWorkHistory = async (req, res) => {
  try {
    const _id = req?.params?._id;
    const workhistory = await WorkHistory.findByIdAndDelete({ _id });
    if (!workhistory) {
      throw new Error("work history not found already deleted ");
    }
    res.status(200).json({
      message: "work history deleted successfully",
      workhistory,
    });
  } catch (error) {
    handleError(res, 404, error.message);
  }
};
