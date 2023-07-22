const express = require('express')
const JWT = require('jsonwebtoken')
const { User } = require('../models/user.js')
const redisClient = require('../utils/redis_client')
const cookieParser = require("cookie-parser")

const router = express.Router()
router.use(express.json())

// Allow cookie parsing
router.use(cookieParser())

router.post('/', logout)

/**
 * 
 * Logging out a user involves:
 * 1. Invalidating their refresh token by adding it to the redis black-list
 * 2. Clearing the refresh token from the cookie
 * 
 * Note: we don't update the lastLogoutTime because that would logout all devices of a user.
 */
async function logout(req, res) {
    // Check if the refresh token is present
    if (!req.cookies?.jwt) {
        return res.status(400).json({ message: 'Missing refresh token' })
    }

    // Get the refresh token from the cookie named 'jwt'
    const refreshToken = req.cookies.jwt

    var decodedRefresh;
    try {
        // Verify the refresh token
        decodedRefresh = JWT.verify(refreshToken, process.env.REFRESH_SECRET)
    } catch (err) {
        // If this wasn't an expiration error then the token must be invalid and we have to fail to logout 
        if (!err instanceof TokenExpiredError)
            return res.status(401).json({ message: 'Invalid refresh token' })
    }

    // Add the refresh token to the blacklist
    const token_key = `bl_${refreshToken}`;
    await redisClient.set(token_key, refreshToken);
    redisClient.expireAt(token_key, decodedRefresh.exp);

    // Clear the cookie
    res.clearCookie('jwt');

    // Respond with a 200
    return res.status(200).json({ message: 'Success; Logged out' })
}

module.exports = router