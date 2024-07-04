const admin = require("firebase-admin");
const serviceAccount = require("../assets/vionsys-ems-notify-firebase-adminsdk-e38f9-559ff75b99.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotificationtoAll = async (registrationTokens, values) => {
  const { title, description } = values;
  try {
    const message = {
      tokens: registrationTokens, // Notice the change here
      notification: {
        title: title,
        body: description,
      },
      webpush: {
        headers: {
          image: "/assets/logo.png",
        },
      },
      android: {
        priority: "high",
      },
      apns: {
        payload: {
          aps: {
            content_available: true,
            mutable_content: true,
          },
        },
        headers: {
          "apns-priority": "10",
        },
      },
    };

    await admin.messaging().sendEachForMulticast(message);
  } catch (error) {
    console.log("recipients error - ", error);
    throw new Error("error while sending message to recipients ");
  }
};

module.exports = sendNotificationtoAll;
