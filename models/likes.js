const mongoose = require('mongoose');
const {Schema} = mongoose;

const LikesSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    likers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    likerCount: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('Likes',LikesSchema);