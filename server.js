const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const app = require("./app");

const port = process.env.PORT || 3000;

mongoose
  .connect(
    `mongodb+srv://vionsys-ems:${process.env.DB_PASS}@cluster0.nql4xos.mongodb.net/ems`)
  .then(() => {
    console.log("DB connected successfully");
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
