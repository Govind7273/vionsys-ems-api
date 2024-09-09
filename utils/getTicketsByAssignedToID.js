const mongoose = require('mongoose');
const Ticket = require("../models/ticketModel");

async function getTicketsByAssignedToID(assignedToId) {
    try {
        const tickets = await Ticket.aggregate([
            {
                $match: {
                    ticketAssignedTo: new mongoose.Types.ObjectId(assignedToId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "ticketRaiser",
                    foreignField: "_id",
                    as: "ticketRaiser"
                }
            },
            {
                $unwind: '$ticketRaiser'
            },
            {
                $project: {
                    _id: 1,
                    ticketType: 1,
                    description: 1,
                    priority: 1,
                    ticketRaiser: 1,
                    ticketAssignedTo: 1,
                    status: 1,
                    ticketRaisedDate: 1,
                    adminNoteOrResolutionNote: 1,
                    ticketResolvedDate: 1,
                    ticketRaiser: {
                        firstName: "$ticketRaiser.firstName",
                        lastName: "$ticketRaiser.lastName",
                        designation: "$ticketRaiser.designation",
                        email: "$ticketRaiser.email",
                        employeeId: "$ticketRaiser.employeeId"
                    },
                    ticketRaiserFullName: {
                        $concat: ['$ticketRaiser.firstName', ' ', '$ticketRaiser.lastName']
                    }
                }
            }
        ]);

        return tickets;
    } catch (error) {
        console.error('Error retrieving tickets:', error);
        throw error;
    }
}

module.exports = getTicketsByAssignedToID;