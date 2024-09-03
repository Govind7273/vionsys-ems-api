const Ticket = require("../models/ticketModel");
const getTicketsByAssignedToID = require("../utils/getTicketsByAssignedToID");
const getTicketsByEmpID = require("../utils/getTicketsByEmpID");
const User = require("../models/userModels");
const { sendNotificationToOne } = require("../utils/sendNotificationToUser");

function handleError(res, statusCode, errorMessage) {
  return res.status(statusCode).json({
    status: "fail",
    error: errorMessage,
  });
}
exports.raiseTicket = async (req, res) => {
  try {
    const ticket = await Ticket.create({ ...req.body });
    if (!ticket) {
      throw new Error("Failed to raise ticket");
    }

    // fetch user who raised the ticket
    const user = await User.findById(ticket.ticketRaiser);
    if (!user) {
      throw new Error("User not found!");
    }

    // fetch admin to whom ticket was assigned
    const admin = await User.findById(ticket.ticketAssignedTo);
    if (!admin) {
      throw new Error("admin not found!");
    }

    // Save the admin Token
    const adminNotificationToken = admin?.notificationToken || "";

    // Construct Noitification Payload
    const notificationPayload = {
      title: `Ticket Raised`,
      description: `${user.firstName} ${user.lastName} Raised a Ticket. Ticket Type: ${ticket.ticketType} `,
    };

    // Send notification to the Admin
    sendNotificationToOne(adminNotificationToken, notificationPayload);

    // Respond with success status
    res.status(201).json({
      status: "success",
      data: ticket,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 400, error.message);
  }
};

exports.getTicketsByEmpID = async (req, res) => {
  try {
    const id = req.params.id;
    const ticket = await getTicketsByEmpID(id);

    if (ticket.length === 0) {
      throw new Error("No ticket found for this employee");
    }
    res.status(200).json({
      status: "success",
      data: ticket,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 400, error.message);
  }
};

exports.getTicketsByAssignedTo = async (req, res) => {
  try {
    const assignedToId = req.params.id;
    const ticket = await getTicketsByAssignedToID(assignedToId);
    res.status(200).json({
      status: "success",
      data: ticket,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 400, error.message);
  }
};

exports.updateTicketById = async (req, res) => {
  try {
    const id = req.params.id;
    const ticketResolvedDate = new Date();
    const { status, adminNoteOrResolutionNote } = req.body;

    // Find the ticket by its ID
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new Error("Ticket not found with ID");
    }

    // Update ticket properties
    if (status) ticket.status = status;
    if (adminNoteOrResolutionNote)
      ticket.adminNoteOrResolutionNote = adminNoteOrResolutionNote;
    if (ticketResolvedDate && status === "CLOSED")
      ticket.ticketResolvedDate = ticketResolvedDate;

    const updatedTicket = await ticket.save();

    // Fetch the user who raised the ticket
    const user = await User.findById(ticket.ticketRaiser);
    if (!user) {
      throw new Error("User not found!");
    }

    // Fetch the admin who Updated the ticket
    const admin = await User.findById(ticket.ticketAssignedTo);
    if (!admin) {
      throw new Error("admin not found!");
    }

    const userNotificationToken = user.notificationToken || "";

    // Construct Notification Payload
    const notificationPayload = {
      title: `Ticket Status Updated`,
      description: `Your ticket (${ticket.ticketType}) has been updated to: ${ticket.status} by ${admin.firstName} ${admin.lastName}.`,
    };
    // Send notification to the user
    await sendNotificationToOne(userNotificationToken, notificationPayload);

    // Respond with success status
    res.status(200).json({
      status: "success",
      data: updatedTicket,
    });
  } catch (error) {
    console.log(error);
    handleError(res, 400, error.message);
  }
};
