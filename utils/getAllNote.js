const { default: mongoose } = require("mongoose");
const Notification = require("../models/notificationModel");

const getAllNote = () => {
    try {
        const value = Notification.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userid",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user" // Assuming each notification has a corresponding user
            },
            {
                $project: {
                    _id: "$_id",
                    description: "$description",
                    title: "$title",
                    // Assuming 'firstname' is the field you want to retrieve from the User schema
                    username: "$user.firstName",
                    avtar:"$user.profile",
                    date:"$date"
                }
            }
        ]);
        return value;
    } catch (error) {
        console.log(error);
    }
}

module.exports = getAllNote;
