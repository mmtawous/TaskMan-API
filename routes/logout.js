const express = require('express')
const JWT = require('jsonwebtoken')
const User = require('../models/user.js')
const redisClient = require('../utils/redis_client')
const cookieParser = require("cookie-parser")

const router = express.Router()
router.use(express.json())

// Allow cookie parsing
router.use(cookieParser())

router.post('/', logout)

async function logout(req, res) {
    // Check if the refresh token is present
    if (!req.cookies?.jwt) {
        return res.status(400).json({ message: 'Missing refresh token' })
    }

    const refreshToken = req.cookies.jwt


    var decodedRefresh;
    try {
        // Verify the refresh token ignoring expiration
        decodedRefresh = JWT.verify(refreshToken, process.env.REFRESH_SECRET)
    } catch (err) {
        if (err instanceof TokenExpiredError)
            return res.status(200).json({ message: 'Ignored; Token is already expired' })

        return res.status(401).json({ message: 'Invalid refresh token' })
    }

    // Add the refresh token to the blacklist
    const token_key = `bl_${refreshToken}`;
    await redisClient.set(token_key, refreshToken);
    redisClient.expireAt(token_key, decodedRefresh.exp);

    res.clearCookie('jwt');

    // Update the lastLogoutTime field in user
    try {
        var user = await User.findOneById(decodedRefresh.id).exec()
        user.lastLogoutTime = Date.now();
        user.save();
    } catch (err) {
        res.status(400).json({message: err.message})
    }

    return res.status(200).json({ message: 'Success; Logged out' })
}

module.exports = router