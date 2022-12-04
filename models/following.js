const mongoose = require('mongoose');
const { Schema } = mongoose;

const FollowingSchema = new Schema({
    user: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

module.exports = mongoose.model('Following', FollowingSchema);