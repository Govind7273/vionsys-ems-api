const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "/.env" });

const app = require("./app");

const port = process.env.PORT || 3000;

mongoose
  .connect(`${process.env.DB_URL}`)
  .then(() => console.log("DB connected successfully"))
  .catch((err) => console.log("error while connecting to Mongo - ", err));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
