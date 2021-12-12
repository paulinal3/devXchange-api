const express = require('express')
const router = express.Router()
const passport = require('passport')
const Answer = require('../models/answer')
const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })

// create a post route to add an answer
router.post('/answers', (req, res, next) => {
    // req.body.answer.owner = req.user.id

    Answer.create(req.body.answer)
        .then(answer => {
            res.status(201).json({
                answer: answer.toObject()
            })
        })
        .catch(next)
})

// create a patch route to edit an answer

module.exports = router