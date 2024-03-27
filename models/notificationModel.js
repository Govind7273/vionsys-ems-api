const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,  // Define _id as ObjectId
        auto: true  // Automatically generate ObjectId
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now,
    },
    userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
