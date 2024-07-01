const moment = require("moment");

const getdiff = (startDateString, endDateString) => {
  const startDate = moment(startDateString);
  const endDate = moment(endDateString);

  const duration = moment.duration(endDate.diff(startDate));

  const years = duration.years();
  const months = duration.months();
  const days = duration.days();

  const differenceString = `${years} years-${months} months-${days} days`;
  return differenceString;
};
module.exports = getdiff;
