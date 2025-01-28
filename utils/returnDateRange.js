function returnDateRange(shift = "dayShift") {
  let currentDate = new Date();
  let startOfDay, endOfDay;

  if (shift === "nightShift") {
    startOfDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - 1,
      6,
      0,
      0,
      0
    );
    endOfDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      6, // 6 AM
      0,
      0,
      0
    );
  } else if (shift === "dayShift") {
    startOfDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      0, // 12 AM
      0,
      0,
      0
    );
    endOfDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 1,
      0, // 12 AM (midnight)
      0,
      0,
      0
    );
  }

  return {
    startOfDay,
    endOfDay,
  };
}

module.exports = returnDateRange;
