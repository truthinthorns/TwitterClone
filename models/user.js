const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const {Schema} = mongoose;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    dob: {
        type: Date,
        required: true
    },
    bio: {
        type: String
    },
    joinDate: {
        type: Date,
        required: true
    }
})

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User',UserSchema);