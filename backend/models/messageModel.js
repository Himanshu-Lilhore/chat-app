const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, {timestamps: true})

const User = mongoose.model('message', messageSchema)
module.exports = User