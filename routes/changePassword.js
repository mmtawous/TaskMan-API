const express = require('express')
const { User, validatePassword } = require('../models/user.js')
const JWT = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const redisClient = require('../utils/redis_client')
const { authenticateToken } = require('../utils/auth_utils.js')
const cookieParser = require("cookie-parser")

const router = express.Router()

router.use(express.json())

// Allow cookie parsing
router.use(cookieParser())

const saltRounds = 10;

router.post('/', authenticateToken, changePassword)

/**
 * 
 * Changing the password of a user involves the following steps:
 * 
 * 1. Handle checking for and decoding the refresh token
 * 2. Find the user and change the password if it exists. This requires hashing the password
 * 
 */
async function changePassword(req, res) {
    // Check for all required params
    if (!(req.body.email && req.body.password && req.body.new_password)) {
        return res.status(400).json({ message: 'Malformed request' })
    }

    /********************** Handle checking for and decoding the refresh token **********************/
    // Check if the refresh token is present
    if (!req.cookies?.jwt) {
        return res.status(400).json({ message: 'Missing refresh token' })
    }
    const refreshToken = req.cookies.jwt

    // Decode the refresh token
    var decodedRefresh;
    try {
        // Verify the refresh token ignoring expiration
        decodedRefresh = JWT.verify(refreshToken, process.env.REFRESH_SECRET)
    } catch (err) {
        return res.status(401).json({ message: 'Invalid refresh token' })
    }

    /********************** Find the user and change the password if it exists **********************/
    // Check for a user with the given email
    var user = await User.findOne({ email: req.body.email }).exec()

    // If the user provided doesn't exist then respond with an error
    if (!user) {
        return res.status(400).json({ message: "User does not exist" })
    }

    // Hash the provided password and compare with the db version
    const match = await bcrypt.compare(req.body.password, user.password);

    // Check the provided credentials match the existing ones
    if (!match)
        return res.status(401).json({ message: "Invalid credentials" })

    // Validate the new password
    if (!validatePassword(req.body.new_password))
        return res.status(400).json({ message: "Invalid new_password" })

    // Update the user lastLogoutTime field to logout all devices.
    user.lastLogoutTime = Date.now();

    // Hash the password with bcrypt and auto gen salt with 10 iterations
    // Any response from here on out are handled inside the callback. If this wasn't the case you could get
    // multiple responses from the same request, which isn't good.
    bcrypt.hash(req.body.new_password, saltRounds, async function (hashingErr, hash) {
        if (hashingErr) {
            // Hashing errors will be caught here
            return res.status(400).json({ message: hashingErr.message })
        }

        // Store hash in password DB.
        user.password = hash

        try {
            await user.save()
        } catch (savingError) {
            // Saving errors will be caught here
            return res.status(400).json({ message: savingError.message })
        }

        /********************** Invalidate the refresh token **********************/
        const token_key = `bl_${refreshToken}`;
        await redisClient.set(token_key, refreshToken);
        redisClient.expireAt(token_key, decodedRefresh.exp);

        // Respond with updated document
        return res.status(200).json(user)
    });

}

module.exports = router