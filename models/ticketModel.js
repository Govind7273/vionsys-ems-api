const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketType: {
        type: String,
        enum: ['INCIDENT', 'REQUEST', 'SUPPORT', 'ATTENDANCE', 'COMPLAINT'],
        required: [true, 'Ticket Type Required!!']
    },
    description: {
        type: String,
        required: [true, 'Description Required!!'],
    },
    priority: {
        type: String,
        enum: ['HIGH', 'NORMAL', 'LOW'], //if required in future-->use 'URGENT'
        required: [true, 'Priority Required!!']
    },
    ticketRaiser: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Ticket Raiser Required!!']
    },
    ticketAssignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', //Referencing the User model
        required: [true, 'Ticket Assigned To Required!!']
    },
    status: {
        type: String,
        enum: ['OPEN', 'CLOSED'], //if required use --> INPROGRESS in future
        default: 'OPEN'
    },
    ticketRaisedDate: {
        type: Date,
        default: Date.now(),
    },
    adminNoteOrResolutionNote: {
        type: String,
        validate: {
            validator: function (value) {
                if (this.isNew) {
                    return !value; // No value provided during the creation or addition
                } else {
                    return !!value; //value required during update
                }
            },
            message: function () {
                return this.isNew ?
                    'Admin note should not be provided during creation..' :
                    'Admin note or Resolution note should be provided during update.'
            }
        }
    },
    ticketResolvedDate: {
        type: Date,
        default: null,
        validate: {
            validator: function (value) {
                if (this.status === 'CLOSED' && !value) {
                    return false; // No value provided during the closure
                } else {
                    return true; // value required during closure
                }
            },
            message: function () {
                return this.status === 'CLOSED' ?
                    'Ticket resolved date is required when ticket is closed.' :
                    '';
            }
        }
    }
});

// Ensure that adminNoteOrResolutionNote is required on updates
ticketSchema.pre('save', function (next) {
    if (!this.isNew && !this.adminNoteOrResolutionNote) {
        return next(new Error('Admin Note is required during update.'))
    }
    next();
})

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;