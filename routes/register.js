const express = require('express')
const { User }  = require('../models/user.js')
const bcrypt = require('bcrypt')

const router = express.Router()
router.use(express.json())

const saltRounds = 10;

router.post('/', registerUser)

async function registerUser(req, res) {
    try {
        // Create a User model instance using the req parameters provided in JSON.
        var user = new User({email: req.body.email, password: req.body.password})

        // Validate the request body
        await user.validate()

        // Hash the password with bcrypt and auto gen salt with 10 iterations
        bcrypt.hash(user.password, saltRounds, async function (err, hash) {
            if (err) {
                // Hashing errors will be caught here
                return res.status(400).json({ message: err.message })
            }

            // Store hash in your password DB.
            user.password = hash

            try {
                user = await user.save()
            } catch (error) {
                // Saving errors will be caught here
                return res.status(400).json({ message: error.message })
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