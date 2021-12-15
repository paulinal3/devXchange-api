// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')
// pull in Mongoose model for problems
const Problem = require('../models/problem')
// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')
// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership
// this is middleware that will remove blank fields from `req.body`, e.g.
// { problem: { title: '', text: 'foo' } } -> { problem: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })
// instantiate a router (mini app that only handles routes)
const router = express.Router()
// INDEX
// GET /problems
router.get('/problems', (req, res, next) => {
    Problem.find()
        .populate('owner', ['firstName', 'lastName'])
        .then((foundProblems) => {
            // `problems` will be an array of Mongoose documents
            // we want to convert each one to a POJO, so we use `.map` to
            // apply `.toObject` to each one
            return foundProblems.map(problem => problem.toObject() )
            // return problems.map((problem) => problem.toObject())
        })
        // respond with status 200 and JSON of the problems
        .then((problems) => res.status(200).json({ problems: problems }))
        // if an error occurs, pass it to the handler
        .catch(next)
})
// // SHOW
// // GET /problems/5a7db6c74d55bc51bdf39793
router.get('/problems/:id',  (req, res, next) => {
    // req.params.id will be set based on the `:id` in the route
    Problem.findById(req.params.id)
        // use the problemId to populate the corresponding owner
        .populate('owner', ['firstName', 'lastName'])
        .then(handle404)
        // if `findById` is succesful, respond with 200 and "problem" JSON
        .then((foundProblem) => res.status(200).json({ problem: foundProblem.toObject() }))
        // if an error occurs, pass it to the handler
        .catch(next)
})
// CREATE
// POST /problems
router.post('/problems', requireToken,  (req, res, next) => {
	// set owner of new problem to be current user
	req.body.problem.owner = req.user.id 
	let currentUser = req.user
	console.log('this is req.user', req.user)

	Problem.create(req.body.problem)
		// respond to succesful `create` with status 201 and JSON of new "problem"
		.then((problem) => {
			// push created problem id into the current users problem arr of obj ref
			currentUser.problems.push(problem._id)
			// save the current user
			currentUser.save()
			res.status(201).json({ problem: problem.toObject() })
		})
		// if an error occurs, pass it off to our error handler
		// the error handler needs the error message and the `res` object so that it
		// can send an error message back to the client
		.catch(next)
})
// UPDATE
// PATCH /problems/5a7db6c74d55bc51bdf39793
router.patch('/problems/:id', requireToken, removeBlanks, (req, res, next) => {
    // if the client attempts to change the `owner` property by including a new
    // owner, prevent that by deleting that key/value pair
    delete req.body.problem.owner
    Problem.findById(req.params.id)
        .then(handle404)
        .then((problem) => {
            // pass the `req` object and the Mongoose record to `requireOwnership`
            // it will throw an error if the current user isn't the owner
            requireOwnership(req, problem) 
            // pass the result of Mongoose's `.update` to the next `.then`
            return problem.updateOne(req.body.problem)
        })
        // if that succeeded, return 204 and no JSON
        .then(() => res.sendStatus(204))
        // if an error occurs, pass it to the handler
        .catch(next)
})
// DESTROY
// DELETE /problems/5a7db6c74d55bc51bdf39793
router.delete('/problems/:id', requireToken, (req, res, next) => {
    Problem.findById(req.params.id)
        .then(handle404)
        .then((problem) => {
            // throw an error if current user doesn't own `problem`
            requireOwnership(req, problem)
            // delete the problem ONLY IF the above didn't throw
            problem.deleteOne()
        })
        // send back 204 and no content if the deletion succeeded
        .then(() => res.sendStatus(204))
        // if an error occurs, pass it to the handler
        .catch(next)
})
module.exports = router