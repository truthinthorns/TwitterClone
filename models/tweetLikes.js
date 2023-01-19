const mongoose = require('mongoose');
const { Schema } = mongoose;

const TweetLikesSchema = new Schema({
    tweetId:{
        type: Schema.Types.ObjectId,
        ref: 'Tweet'
    },
    likers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
})

module.exports = mongoose.model('TweetLikes', TweetLikesSchema);