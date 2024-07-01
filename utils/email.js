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
    from: process.env.EMAIL_USER,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };
  const mailResult = await transport.sendMail(config);
  return mailResult;
};

const sendExcelMail = async (subject, body, email, mergeexcel) => {
  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const config = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: body,
      attachments: [
        {
          path: mergeexcel,
        },
        // {
        //   path: filepath?.leavepath,
        // },
      ],
    };
    const mailResult = await transport.sendMail(config);
    return mailResult;
  } catch (error) {
    console.log(error);
    throw new Error("Error while sending mail");
  }
};

module.exports = { sendExcelMail, sendEmail };
