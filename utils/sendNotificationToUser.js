const Admin = require("./firebaseConfig");

// Function to send notification to one user
const sendNotificationToOne = async (registrationToken, values) => {
  const { title, description } = values; // Accept image from server
  try {
    const message = {
      token: registrationToken,
      notification: {
        title: title,
        body: description,
        image: "https://vionsys-ems.org/assests/logo.png", // Use the image from the server
      },
    };

    await Admin.messaging().send(message);
    console.log("Notification Sent");
  } catch (error) {
    console.error("Error sending notification to one user:", error);
    throw new Error("Error while sending message to the recipient");
  }
};

// Export the functions to be used in other parts of the application
module.exports = { sendNotificationToOne };
