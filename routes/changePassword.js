const express = require('express')
const User = require('../models/user.js')
const bcrypt = require('bcrypt')
const { authenticateToken, validatePassword } = require('../utils/auth_utils.js')

const router = express.Router()

router.use(express.json())
router.use(authenticateToken)

const saltRounds = process.env.SALT_ROUNDS;

router.post('/', changePassword)

async function changePassword(req, res) {
    // Check for all required params
    if (!(req.body.email && req.body.password && req.body.new_password)) {
        res.status(400).json({ message: 'Malformed request' })
    }

    // Check for a user with the given email
    const user = await User.findOne({ email: req.body.email }).exec()

    // If the user provided doesn't exist then respond with an error
    if (!user) {
        return res.status(400).json({ message: "User does not exist!" })
    }

    // Hash the provided password and compare with tht db version
    const match = await bcrypt.compare(req.body.password, user.password);

    if (!match) {
        return res.status(401).json({ message: "Invalid credentials" })
    }

    if (!validatePassword(req.body.new_password))
        return res.status(400).json({ message: "Invalid new_password" })

    // Update the user passwordLastChanged field
    user.passwordLastChanged = Date.now();

    // Hash the password with bcrypt and auto gen salt with 10 iterations
    bcrypt.hash(req.body.new_password, saltRounds, async function (err, hash) {
        if (err) {
            // Hashing errors will be caught here
            res.status(400).json({ message: err.message })
        }

        // Store hash in your password DB.
        user.password = hash

        try {
            user = await user.save()
        } catch (error) {
            // Saving errors will be caught here
            res.status(400).json({ message: error.message })
        }

        // Respond with updated document
        res.status(200).json(user)

    });

}