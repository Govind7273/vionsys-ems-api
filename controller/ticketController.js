const Ticket = require("../models/ticketModel");


function handleError(res, statusCode, errorMessage) {
    return res.status(statusCode).json({
        status: "fail",
        error: errorMessage
    });
}
exports.raiseTicket = async (req, res) => {
    try {
        console.log(req.body)
        const ticket = await Ticket.create({ ...req.body });
        // if (!ticket) {
        //     throw new Error("Failed to raise ticket");
        // }
        res.status(201).json({
            status: "success",
            data: ticket
        });
    } catch (error) {
        console.log(error)
        handleError(res, 400, error.message);
    }
}

exports.getTicketsByEmpID = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(id)
        const ticket = await Ticket.find({ ticketRaiser: id });

        // if (ticket.length === 0) {
        //     throw new Error("No ticket found for this employee");
        // }
        res.status(200).json({
            status: "success",
            data: ticket
        })
    } catch (error) {
        console.log(error);
        handleError(res, 400, error.message);
    }
}

exports.getTicketsByAssignedTo = async (req, res) => {
    try {
        const assignedToId = req.params.id;
        const ticket = await Ticket.find({ ticketAssignedTo: assignedToId });
        res.status(200).json({
            status: "success",
            data: ticket
        })
    } catch (error) {
        console.log(error);
        handleError(res, 400, error.message);
    }
}

exports.updateTicketById = async (req, res) => {
    try {
        const id = req.params.id;
        const { status, adminNoteOrResolutionNote, ticketResolvedDate } = req.body;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            throw new Error("Ticket not found with ID");
        }

        if (status) ticket.status = status;
        if (adminNoteOrResolutionNote) ticket.adminNoteOrResolutionNote = adminNoteOrResolutionNote;
        if (ticketResolvedDate) ticket.ticketResolvedDate = ticketResolvedDate;

        const updatedTicket = await ticket.save();
        res.status(200).json({
            status: "success",
            data: updatedTicket
        });
    } catch (error) {
        console.log(error);
        handleError(res, 400, error.message);
    }
}