const mongoose = require('mongoose');
const Task = mongoose.model('Tasks');

async function getAllTasks() {
    try {
        const tasks = await Task.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'assignedBy',
                    foreignField: '_id',
                    as: 'assignedByUser'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    status: 1,
                    deadline: 1,
                    startedDate: 1,
                    completedDate: 1,
                    assignedBy: {
                        firstName: { $arrayElemAt: ["$assignedByUser.firstName", 0] },
                        lastName: { $arrayElemAt: ["$assignedByUser.lastName", 0] }
                    },
                    assignedTo: {
                        firstName: { $arrayElemAt: ["$user.firstName", 0] },
                        lastName: { $arrayElemAt: ["$user.lastName", 0] },
                    },
                    employeeId: { $arrayElemAt: ["$user.employeeId", 0] },

                }
            }
        ]);
        return tasks;
    } catch (error) {
        console.log(error);
        throw new Error('Error occurred while fetching tasks!');
    }
};

module.exports = { getAllTasks };
