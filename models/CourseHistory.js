const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseHistorySchema = new Schema({
    number: {
        type: String,
        required: true
    }, 
    name: {
        type: String,
        required: true
    },
    term: {
        type: String,
        required: true
    },
    grade: {
        type: String,
        enum: ['A+','A','A-','B+','B','B-','C+','C','C-','D','F'],
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['In Progress', 'Taken'],
        required: true
    },
    meetingInfo: {
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        days: [
            {
                type: String,
                required: true
            }
        ],
        times: [
            {
                type: String,
                required: true
            }
        ],
        room: {
            type: String,
            required: true
        },
        instructor: {
            type: String,
            required: true
        }
    },
    studentRef: {
        type: Schema.Types.ObjectId,
        ref: 'Student'
    }
})

module.exports = mongoose.model('CourseHistory',CourseHistorySchema);