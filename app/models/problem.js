const mongoose = require('mongoose')
const Schema = mongoose.Schema

const problemSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		solved: {
			type: Boolean,
			default: false,
		},
		img: {
			type: String,
		},
		answers: [{
			type: Schema.Types.ObjectId,
			ref: 'Answer'
		}],
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Problem', problemSchema)
