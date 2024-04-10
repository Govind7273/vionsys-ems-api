const mongoose = require("mongoose");

const holidaySchema = mongoose.Schema({
  year: {
    type: Number,
    required: [true, "please provide the year"],
    default: 2024,
  },
  holidayName: {
    type: String,
    required: [true, "please provide the Holiday Name"],
  },
  day: {
    type: String,
    required: [true, "please provide the day"],
  },
  date: {
    type: Date,
    required: [true, "please provide the date"],
  },
  holidayType: {
    type: String,
    required: [true, "please provide the Holiday Type"],
    enum: ["Fixed Holiday", "Floater Holiday"],
    validate: {
      validator: function (value) {
        return ["Fixed Holiday", "Floater Holiday"].includes(value);
      },
      message: (props) => `${props.value} is not a valid holiday type !`,
    },
  },
});

const Holiday = mongoose.model("Holiday", holidaySchema);

module.exports = Holiday;
