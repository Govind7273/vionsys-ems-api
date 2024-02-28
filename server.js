const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const app = require("./app");

const port = process.env.PORT || 3000;

mongoose
  .connect(
    `mongodb+srv://ghodsednyaneshwar:${process.env.DB_PASS}@cluster0.4qcnpzb.mongodb.net/`
  )
  .then(() => {
    console.log("DB connected successfully");
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
