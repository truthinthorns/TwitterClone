const mongoose = require('mongoose');
const {Schema} = mongoose;

const TweetSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        required: true
    },
    formattedTimestamp: {
        type: String,
        required: true
    },
    likesRef: {
        type: Schema.Types.ObjectId,
        ref: 'Likes'
    },
})

module.exports = mongoose.model('Tweet',TweetSchema);