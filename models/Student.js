const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const StudentSchema = new Schema({
    name: {
        type: String,
        required: true
    }, 
    email:{
        type: String,
        required: true,
        unique: true
    },
    ssn: {
        type: String,
        required: true,
        unique: true
    },
    // picture: {
    //     type: String,
    //     required: true
    // },
    dob: {
        type: Date,
        required: true
    },
    courseHistory:[
        {
            type: Schema.Types.ObjectId,
            ref: 'CourseHistory'
        }
    ]
})

StudentSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Student',StudentSchema);