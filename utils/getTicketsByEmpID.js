const mongoose = require("mongoose");
const Ticket = require("../models/ticketModel");

async function getTicketsByEmpID(empId) {
  try {
    const tickets = await Ticket.aggregate([
      {
        $match: {
          ticketRaiser: new mongoose.Types.ObjectId(empId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "ticketAssignedTo",
          foreignField: "_id",
          as: "ticketAssignedTo",
        },
      },
      {
        $unwind: {
          path: "$ticketAssignedTo",
        },
      },
      {
        $project: {
          _id: 1,
          ticketType: 1,
          description: 1,
          priority: 1,
          status: 1,
          ticketRaisedDate: 1,
          adminNoteOrResolutionNote: 1,
          ticketResolvedDate: 1,
          ticketAssignedTo: {
            firstName: "$ticketAssignedTo.firstName",
            lastName: "$ticketAssignedTo.lastName",
            designation: "$ticketAssignedTo.designation",
            employeeId: "$ticketAssignedTo.employeeId",
          },
          ticketAssignedToFullName: {
            $concat: [
              "$ticketAssignedTo.firstName",
              " ",
              "$ticketAssignedTo.lastName",
            ],
          },
        },
      },
    ]);

    return tickets;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

module.exports = getTicketsByEmpID;
