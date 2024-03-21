const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const config = {
    from: "worksagar20@gmail.com",
    to:options.email,
    subject: options.subject,
    text:options.message,
  };
  const mailResult = await transport.sendMail(config);
  return mailResult
};

module.exports = sendEmail;







  "attendance"[
    {
      "_id": "65f93303ccd1138b25a94985",
      "attendances": [
        {
          "_id": "65fa61a7662d41222c00b03e",
          "user": "65f93303ccd1138b25a94985",
          "loginTime": "2024-03-20T04:10:15.556Z",
          "date": "2024-03-20T04:10:15.594Z",
          "__v": 0
        },
        {
          "_id": "65f93338ccd1138b25a9498e",
          "user": "65f93303ccd1138b25a94985",
          "loginTime": "2024-03-19T06:39:52.407Z",
          "date": "2024-03-19T06:39:52.452Z",
          "__v": 0,
          "logoutTime": "2024-03-19T06:41:17.576Z"
        }
      ],
      "user": {
        "_id": "65f93303ccd1138b25a94985",
        "firstName": "sagar",
        "lastName": "yenkure",
        "employeeId": "5",
        "email": "sagaryenkure@mail.com",
        "role": "admin",
        "designation": "intern",
        "password": "$2a$12$ngtL98wbPk6cQpdhBME4Yu822hPVnmZ3Hv3T8YlWSL1Pi6ozv6VaO",
        "teamLead": "Pankaj Khandare",
        "__v": 0
      }
    },
    {
      "_id": "65fab74d0d7fb6c47dd2485d",
      "attendances": [
        {
          "_id": "65fab8530d7fb6c47dd2487b",
          "user": "65fab74d0d7fb6c47dd2485d",
          "loginTime": "2024-03-20T10:20:03.099Z",
          "date": "2024-03-20T10:20:03.120Z",
          "__v": 0,
          "logoutTime": "2024-03-20T10:49:21.564Z"
        }
      ],
      "user": {
        "_id": "65fab74d0d7fb6c47dd2485d",
        "firstName": "Shubham",
        "lastName": "Garud",
        "employeeId": "24",
        "email": "shubhamgarud@mail.com",
        "role": "user",
        "designation": "AWS developer",
        "profile": "http://res.cloudinary.com/dugtxvaxh/image/upload/v1710929741/xpwanhh2gtiyl4tlfgun.jpg",
        "password": "$2a$12$irIGCDyWmgLgzdTyRW2RvOGld7GMX6Ibqsw6y7gRxgWeYMXy7/BgK",
        "__v": 0
      }
    }
  ]