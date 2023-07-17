const express = require('express')
const User = require('../models/user.js')
const JWT = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const redisClient = require('../utils/redis_client')
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
        return res.status(400).json({ message: "User does not exist!" })
    }

    // Hash the provided password and compare with tht db version
    const match = await bcrypt.compare(req.body.password, user.password);

    if (!match)
        return res.status(401).json({ message: "Invalid credentials" })
    

    if (!validatePassword(req.body.new_password))
        return res.status(400).json({ message: "Invalid new_password" })

    // Update the user lastLogoutTime field
    user.lastLogoutTime = Date.now();

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

    });


    /********************** Invalidate the refresh token **********************/
    // Invalidate the current refresh token
    const token_key = `bl_${refreshToken}`;
    await redisClient.set(token_key, refreshToken);
    redisClient.expireAt(token_key, decodedRefresh.exp);

    res.clearCookie('jwt');



    // Respond with updated document
    res.status(200).json(user)
}

module.exports = router