const express = require('express')
const router = express.Router();
const ticketController = require("../controller/ticketController");

router.post("/raiseTicket", ticketController.raiseTicket);
router.get("/findByEmpId/:id", ticketController.getTicketsByEmpID);
router.get("/findByAssignedToUid/:id", ticketController.getTicketsByAssignedTo);
router.patch("/updateById/:id", ticketController.updateTicketById);
module.exports = router;