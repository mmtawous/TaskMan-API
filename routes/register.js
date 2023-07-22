const express = require('express')
const { User } = require('../models/user.js')
const bcrypt = require('bcrypt')

const router = express.Router()
router.use(express.json())

const saltRounds = 10;

router.post('/', registerUser)

/**
 * Registering a user creates a new document in the db and requires the client to pass in
 * a valid email and password. Emails and passwords are verified using a validation
 * function in the user schema (user.js). After validation passwords are hashed to bcrypt
 * with 10 salt rounds and placed in the password field. This endpoint responds with the newly created
 * user in JSON.
 */
async function registerUser(req, res) {
    try {
        // Create a User model instance using the req parameters provided in JSON.
        var user = new User({ email: req.body.email, password: req.body.password })

        // Validate the request body
        await user.validate()

        // Hash the password with bcrypt and auto gen salt with 10 iterations
        bcrypt.hash(user.password, saltRounds, async function (hashingErr, hash) {
            if (hashingErr) {
                // Hashing errors will be caught here
                return res.status(400).json({ message: hashingErr.message }) 
            }

            // Store hash in your password DB.
            user.password = hash

            try {
                user = await user.save()
            } catch (savingError) {
                // Saving errors will be caught here
                return res.status(400).json({ message: savingError.message })
            }

            // Respond with created document
            return res.status(201).json(user)

        });

    } catch (err) {
        // Validation errors will be caught here.
        return res.status(400).json({
            message: err.message
        })
    }
}

module.exports = router 