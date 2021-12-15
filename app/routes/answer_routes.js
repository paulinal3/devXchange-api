const express = require('express')
const router = express.Router()
const passport = require('passport')
const Answer = require('../models/answer')
const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })

// get/index route
router.get('/answers', (req, res, next) => {
    // req.body.answer.contributor = req.user.id
    Answer.find()
        .then(foundAnswers => {
            return foundAnswers.map(answer => answer.toObject())
        })
        .then(foundAnswers => res.status(200).json({ foundAnswers }))
        .catch(next)
})

// post route to add an answer
router.post(':id/answers', requireToken, (req, res, next) => {
    // set contributor of answer to be the current user 
    req.body.answer.contributor = req.user.id
    

    Answer.create(req.body.answer)
        .then(createdAnswer => {
            // User.findById(req.user.id)
            // .then(foundUser => {
            //     foundUser.answers.push(createdAnswer)
            // })
            res.status(201).json({
                answer: createdAnswer.toObject()
            })
        })
        .catch(next)
})

// patch route to edit an answer
router.patch('/answers/:id', requireToken, removeBlanks, (req, res, next) => {
    delete req.body.answer.contributor

    Answer.findById(req.params.id)
        .then(handle404)
        .then(foundAnswer => {
            requireOwnership(req, foundAnswer)
            return foundAnswer.updateOne(req.body.answer)
        })
        .then(() => res.sendStatus(204))
        .catch(next)
})

// delete route for an answer
router.delete('/answers/:id', (req, res, next) => {
    Answer.findById(req.params.id)
        .then(handle404)
        .then(foundAnswer => {
            requireOwnership(req, foundAnswer)
            foundAnswer.deleteOne()
        })
        .then(() => res.sendStatus(204))
        .catch(next)
})

module.exports = router