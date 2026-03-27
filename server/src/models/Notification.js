import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['interview_scheduled', 'interview_rescheduled', 'interview_cancelled'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
    },
    roundId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    readAt: {
        type: Date,
        default: null,
    }
}, {
    timestamps: false,
});

export default mongoose.model('Notification', notificationSchema);
