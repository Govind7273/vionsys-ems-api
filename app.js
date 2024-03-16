const express = require("express");
const morgan = require("morgan");
const {rateLimit} = require("express-rate-limit");
const helmet = require("helmet");
const userRouter = require("./routes/userRoutes");
const mongoSanitize = require("express-mongo-sanitize");
const {xss} = require("express-xss-sanitizer");
const cors = require("cors");


const app = express();
// Global Middleware - it should comes before the request
// implement cors
// Access control origin allow
app.use(cors())

// app.use(cors({
//   origin: "https://api.com"
// }))

app.options("*", cors());

// set security http headers
app.use(helmet())

// development only morgan
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// limit request from same api
const limiter = rateLimit({
  limit: 400,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP please try again in an hour!"
})

app.use(limiter)

// body parser
app.use(express.json({limit:'10kb'}));

// data sanitization against NoSQL query injection
app.use(mongoSanitize())

// data sanitization against XSS
app.use(xss())

// Route Handlers

// Routes
app.use("/api/v1/users", userRouter);

app.all("*", (req,res,next) => {
  res.status(404).json({
    status: "fail",
    message: `Cant find ${req.originalUrl} on this server!`
  })
})

module.exports = app;
