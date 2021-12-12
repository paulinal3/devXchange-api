const mongoose = require('mongoose')
const Schema = mongoose.Schema

const answerSchema = new mongoose.Schema(
    {
        solution: {
            type: String,
            required: true
        },
        bestAnswer: Boolean,
        img: String,
        contributor: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        problem: {
            type: Schema.Types.ObjectId,
            ref: 'Problem'
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Answer', answerSchema)