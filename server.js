const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const app = require("./app");

const port = process.env.PORT || 3000;

mongoose
  .connect(
    `${process.env.DB_URI}`
  )
  .then(() => {
    console.log("DB connected successfully");
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
