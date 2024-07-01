const Holiday = require("../models/holidayModel");

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}
exports.createHoliday = async (req, res) => {
  try {
    const { year, holidayName, date, holidayType } = req?.body;
    const dateObject = new Date(date);
    if (!year || !holidayName || !date || !holidayType) {
      throw new Error("All fields are required");
    }
    const alreadyisHoliday = await Holiday.findOne({ date });
    if (alreadyisHoliday) {
      throw new Error(`hoilday for ${date} already exists`);
    }

    const dayOfWeek = dateObject.getDay();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const createdHoliday = await Holiday.create({
      year,
      holidayName,
      date,
      day: days[dayOfWeek],
      holidayType,
    });

    res
      .status(200)
      .json({ message: "Holiday is added to calender", createdHoliday });
  } catch (error) {
    handleError(res, 401, error.message);
  }
};

exports.getHolidaysByYear = async (req, res) => {
  try {
    const year = req?.params?.year;
    if (!year) {
      throw new Error("Year is required");
    }
    const holidays = await Holiday.find({ year });

    const fixedHolidays = holidays
      .filter((holiday) => holiday?.holidayType === "Fixed Holiday") //Sorting holidays by type
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sorting fixed holidays by date

    const floaterHolidays = holidays
      .filter((holiday) => holiday?.holidayType === "Floater Holiday") //Sorting holidays by type
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sorting floater holidays by date

    res.status(200).json({ year, fixedHolidays, floaterHolidays });
  } catch (error) {
    handleError(res, 401, error.message);
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const holidayId = req?.params?.id;

    const isHolidayExist = await Holiday.findOne({ _id: holidayId });
    if (!isHolidayExist) {
      throw new Error("Holiday does not exist or already deleted !");
    }

    await Holiday.deleteOne({ _id: holidayId });

    res.status(200).json({ message: "Holiday deleted from Calender" });
  } catch (error) {
    handleError(res, 401, error.message);
  }
};
