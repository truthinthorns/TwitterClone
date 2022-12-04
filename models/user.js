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
    },
    followers: {
        type: Schema.Types.ObjectId,
        ref: 'Follower'
    },
    following: {
        type: Schema.Types.ObjectId,
        ref: 'Following'
    }
})

UserSchema.plugin(passportLocalMongoose);

//credits to https://stackoverflow.com/questions/24023443/passport-local-mongoose-when-i-update-a-records-username-im-logged-out-why
UserSchema.statics.serializeUser = function() {
    return function(user, cb) {
        cb(null, user._id);
    }
};

//credits to https://stackoverflow.com/questions/24023443/passport-local-mongoose-when-i-update-a-records-username-im-logged-out-why
UserSchema.statics.deserializeUser = function() {
    let self = this;

    return function(id, cb) {
        self.findOne({id}, cb);
    }
};

module.exports = mongoose.model('User',UserSchema);