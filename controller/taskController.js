const Task = require('../models/taskModels');
const getTasksFromUserId = require('../utils/getTasksFromUserId');
function handleError(res, statusCode, errorMessage) {
    return res.status(statusCode).json({
        status: "fail",
        error: errorMessage,
    });
};


exports.createTask = async (req, res) => {
    try {
        // req body
        // create task
        // check task created
        // res
        const isDeadLineValid = new Date(req.body?.deadline) > new Date();
        if (!isDeadLineValid) throw new Error("Deadline must be in the future only!!");
        const task = await Task.create({ ...req.body });
        if (!task) throw new Error("Task is not created may be it's already there!");
        res.status(201).json({
            status: "success",
            data: task,
        });
    } catch (error) {
        console.log(error);
        handleError(res, 400, error.message);
    }
};


// task started or the task accepted by the employee then update the start date in task db
exports.updateTaskStart = async (req, res) => {
    try {
        //define the start date
        //find the id from req.params
        // get the task
        // update the task start date and status
        const start_date = new Date();
        const { id } = req?.params;
        const task = await Task.findById({ _id: id });
        if (!task) throw new Error("Task not found");
        task.startedDate = start_date;
        task.status = 'INPROGRESS';
        if (task.completedDate) throw new Error("Before start can't complete task.");
        const updatedTask = await task.save();
        res.status(200).json({
            status: "success",
            data: updatedTask,
        })
    } catch (err) {
        console.log(err);
        handleError(res, 404, err.message);
    }
};


// once employee completes the taks then update the completion date 
exports.updateTaskCompleted = async (req, res) => {
    try {
        //define the completion date
        // find by id from req.params
        // get the task
        // update the task completion date
        const completion_Date = new Date();
        const { id } = req?.params;
        const task = await Task.findById({ _id: id });
        if (!task) throw new Error("Task not found");
        if (!task.startedDate) throw new Error("Before start can't complete task!!!");
        task.completedDate = completion_Date;
        task.status = 'COMPLETED';
        const updatedTask = await task.save();
        res.status(200).json({
            status: "success",
            data: updatedTask,
        });
    } catch (error) {
        console.log(error);
        handleError(res, 404, error.message);
    }
};


exports.getTasksFromUserId = async (req, res) => {
    try {
        const { id: userId } = req?.params;
        const tasks = await getTasksFromUserId(userId);
        res.status(200).json({
            status: "success",
            data: tasks,
        });
    } catch (error) {
        console.log(error);
        handleError(res, 404, error.message);
    }
}