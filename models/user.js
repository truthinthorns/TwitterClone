const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const {Schema} = mongoose;

const ImageSchema = new Schema({
    url: String,
    filename: String
});
ImageSchema.virtual('tweet').get(function(){
    return this.url.replace('/upload','/upload/w_50,h_50,r_max');
});
ImageSchema.virtual('follow').get(function(){
    return this.url.replace('/upload','/upload/w_200,h_250');
});
ImageSchema.virtual('profilePic').get(function(){
    return this.url.replace('/upload','/upload/w_200,h_200,r_max');
})

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
    profilePicture: ImageSchema,
    followers: {
        type: Schema.Types.ObjectId,
        ref: 'Follower',
    },
    following: {
        type: Schema.Types.ObjectId,
        ref: 'Following',
    }
})

UserSchema.plugin(passportLocalMongoose);

// this 'works', but if i login with other info, it seems to default to whoever I logged in with first.
// untested theory. I just saw it didn't work, saw what happened, and assumed that's what happened.
// will need to do something with serializing/deserializing users, though.
// it DID allow me to change username without having to log back in. I may be missing something somewhere.

//credits to https://stackoverflow.com/questions/24023443/passport-local-mongoose-when-i-update-a-records-username-im-logged-out-why
// UserSchema.statics.serializeUser = function() {
//     return function(user, cb) {
//         cb(null, user._id);
//     }
// };

// //credits to https://stackoverflow.com/questions/24023443/passport-local-mongoose-when-i-update-a-records-username-im-logged-out-why
// UserSchema.statics.deserializeUser = function() {
//     let self = this;
//     return function(id, cb) {
//         self.findOne({id}, cb);
//     }
// };

module.exports = mongoose.model('User',UserSchema);