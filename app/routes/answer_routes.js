const express = require('express')
const router = express.Router()
const passport = require('passport')
const Answer = require('../models/answer')
const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })

// // get/index route for ALL answers
// router.get('/answers', (req, res, next) => {
//     // req.body.answer.contributor = req.user.id
//     Answer.find()
//         .then(foundAnswers => {
//             return foundAnswers.map(answer => answer.toObject())
//         })
//         .then(foundAnswers => res.status(200).json({ foundAnswers }))
//         .catch(next)
// })

// get/index route for all answers of current user
router.get('/answers', requireToken, (req, res, next) => {
    // req.body.answer.contributor = req.user.id
    Answer.find({ contributor: req.user.id })
        .then(handle404)
        .then(foundAnswers => {
            return foundAnswers.map(answer => answer.toObject())
        })
        .then(foundAnswers => res.status(200).json({ foundAnswers }))
        .catch(next)
})

// get/index route for all answers to a specific problem
router.get('/:problemId/answers', (req, res, next) => {
    Answer.find({ problem: req.params.problemId })
        .populate('contributor', ['firstName', 'lastName'])
        .then(handle404)
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
    // set problem of answer to be the problem id from the url param
    req.body.answer.problem = req.params.problemId
    // console.log('is this the problem id:', req.body.answer.problem)
    const currentUser = req.user

    Answer.create(req.body.answer)
        .then(createdAnswer => {
            console.log('this is the created answer\n', createdAnswer)
            // push created problem id into the current users answer arr of obj ref
            currentUser.answers.push(createdAnswer._id)
            // save the current user
            currentUser.save()
            // find current problem based on id
            Problem.findById(req.params.problemId)
                .then(foundProblem => {
                    // push created answer id into the current problems answer arr of obj ref
                    foundProblem.answers.push(createdAnswer._id)
                    // save the current problem
                    foundProblem.save()
                    res.status(201).json({ answer: createdAnswer.toObject() })
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