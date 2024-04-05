const mongoose = require('mongoose');
const Task = mongoose.model('Tasks');

async function getTasksFromUserId(userId) {
    try {
        // Validate if userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid userId');
        }
        const pipeline = [
            // stage 1 Match the tasks assigned to specfic user
            {
                $match: { user: new mongoose.Types.ObjectId(userId) },
            },

            // stage 2 lookup to get the details of the assignedBy user
            {
                $lookup: {
                    from: 'users',
                    localField: 'assignedBy',
                    foreignField: '_id',
                    as: 'assignedBy'
                }
            },
            //stage 3 unwind the assignedBy array to get the details of the user
            {
                $unwind: '$assignedBy'
            },

            //stage 4 project to shape the output
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
                        firstName: "$assignedBy.firstName",
                        lastName: "$assignedBy.lastName"
                    },
                }
            }
        ]
        const tasks = await Task.aggregate(pipeline);
        return tasks;
    } catch (error) {
        console.log(error);
        throw new Error('Error occured while fetching tasks!');
    }
}

module.exports = getTasksFromUserId;