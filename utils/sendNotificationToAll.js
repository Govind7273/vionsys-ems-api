const Admin = require("./firebaseConfig");


const sendNotificationToAll = async (registrationTokens, values) => {
  const { title, description } = values; // Accept image from server
  try {
    const message = {
      tokens: registrationTokens,
      notification: {
        title: title,
        body: description,
        image: "https://vionsys-ems.org/assests/logo.png", // Use the image from the server
      },
    };

    await Admin.messaging().sendEachForMulticast(message);
    console.log("Notification sent successfully");
  } catch (error) {
    console.error("Error sending notification:", error);
    throw new Error("Error while sending message to recipients");
  }
};

module.exports = sendNotificationToAll;
