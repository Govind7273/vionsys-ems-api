const express = require("express");
const morgan = require("morgan");
const { rateLimit } = require("express-rate-limit");
const helmet = require("helmet");
const userRouter = require("./routes/userRoutes");
const leaveRouter = require("./routes/leaveRoute");
const attendanceRouter = require("./routes/attendanceRoute");
const notificationsRouter = require("./routes/notificationsRoute");
const holidayRouter = require("./routes/holidaysRoute");
const WelcomeKitRoute = require("./routes/welcomeKitRoute");
const workHistoryRoute = require("./routes/workHistoryRoutes");
const tasksRouter = require("./routes/taskRoute");
const ticketRouter = require("./routes/ticketRoute");
const mongoSanitize = require("express-mongo-sanitize");
const resignationRouter = require("./routes/resignationRoute");
const { xss } = require("express-xss-sanitizer");
const cors = require("cors");

const app = express();
// Global Middleware - it should comes before the request
// implement cors
// Access control origin allow
app.use(cors());

// app.use(cors({
//   origin: "https://api.com"
// }))

app.options("*", cors());

// set security http headers
app.use(helmet());

// development only morgan
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// limit request from same api
const limiter = rateLimit({
  limit: 400,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP please try again in an hour!",
});

app.use(limiter);

// body parser
app.use(express.json({ limit: "10kb" }));

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

// data sanitization against XSS
app.use(xss());

// Route Handlers

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/users/leaves", leaveRouter);
app.use("/api/v1/users/attendance", attendanceRouter);
app.use("/api/v1/users/notification", notificationsRouter);
app.use("/api/v1/users/task", tasksRouter);
app.use("/api/v1/users/holidays", holidayRouter);
app.use("/api/v1/users/welcomeKit", WelcomeKitRoute);
app.use("/api/v1/users/workHistory", workHistoryRoute);
app.use("/api/v1/users/ticket", ticketRouter);
app.use("/api/v1/users/resignation", resignationRouter);
app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Cant find ${req.originalUrl} on this server!`,
  });
});

module.exports = app;
