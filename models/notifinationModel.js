const mongoose  = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String
    },
    body: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now,
    }
})

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;