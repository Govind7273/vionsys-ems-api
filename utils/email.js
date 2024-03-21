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
