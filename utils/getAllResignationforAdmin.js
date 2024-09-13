const mongoose = require('mongoose');
const Resignation = require("../models/resignationModel");

async function getAllResignationforAdmin() {
    try {
        const results = await Resignation.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $project: {
                    resignationType: 1,
                    noticePeriodDays: 1,
                    resignationReason: 1,
                    resignationCancle: 1,
                    defaultNoticePeriod:1,
                    noteByAdmin: 1,
                    resignationStatus: 1,
                    cancleResignationReason: 1,
                    date: 1,
                    adminApprovedDate:1,
                    exitDate: 1,
                    cancleResignationDate: 1,
                    "userDetails.firstName": 1,
                    "userDetails.lastName": 1,
                    "userDetails.email": 1,
                    "userDetails.designation": 1,
                    user: 1 
                }
            }
        ]);

        return results;
    } catch (error) {
        console.error("Error fetching resignations:", error);
        throw error;
    }
}

module.exports = getAllResignationforAdmin;
