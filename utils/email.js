const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    console.log(options);
  // 1 create transporter
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2 define the email options
  const mailOptions = {
    from: "Dnyanesh ghodse <hello@danny.io>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  }
  //3 send mail
  console.log(mailOptions);
  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;