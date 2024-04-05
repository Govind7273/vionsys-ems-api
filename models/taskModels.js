const mongoose = require('mongoose');

const TaskSchema=new mongoose.Schema({
     title:{
         type:String,
         required:[true,'Title must be required'],
     },
     description:{
         type:String,
         required:[true,'Please provide a description about the task']
     },
     status:{
         type:String,
         enum:["INPROGRESS","COMPLETED","PENDING"],
         default:'PENDING',
         validate: {
            validator: function (value) {
              return ["INPROGRESS","COMPLETED","PENDING"].includes(value);
            },
            message: (props) => `${props.value} is not a valid status !`,
          },
     },
     user:{
         type:mongoose.Schema.Types.ObjectId,
         ref:'User',
         required:[true,'User is required!! whom to assign this task'],
     },
     assignedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:[true,'Task assigner (whose is assinging the task) required!!']
     },
     deadline:{
        type:Date,
        required:[true,'Deadline is required atleast temporary!!']
     },
     completedDate:{
        type:Date,
        default:null
     },
     startedDate:{
        type:Date,
        default:null
     }
});


const Task=mongoose.model('Tasks',TaskSchema);

module.exports=Task;