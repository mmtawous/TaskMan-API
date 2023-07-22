const express = require('express')
const redisClient = require('../utils/redis_client')
const JWT = require('jsonwebtoken')
const { genJWT } = require('../utils/auth_utils.js')
const cookieParser = require("cookie-parser")
const { User } = require('../models/user.js')


const router = express.Router()
router.use(express.json())

// Allow cookie parsing
router.use(cookieParser())

router.post('/', refresh)

/**
 * This endpoint refreshes the access token provided a valid refresh token that 
 * 1. Isn't in the blacklist
 * 2. Its creation time isn't before the last logout time
 */
async function refresh(req, res) {
    // Optional chaining is cool
    if (!req.cookies?.jwt) {
        return res.status(400).json({ message: 'Missing refresh token' })
    }

    const refreshToken = req.cookies.jwt

    // Check if the token is in the black list
    const inBlackList = await redisClient.get(`bl_${refreshToken}`);
    if (inBlackList) {
        return res.status(401).json({ message: 'Token is in deny list' });
    }

    try {
        // Verify the refresh token
        var decodedRefresh = JWT.verify(refreshToken, process.env.REFRESH_SECRET)

    } catch (err) {
        // If refresh token verification fails then return 401
        return res.status(401).json({ message: 'Invalid refresh token' })
    }

    // Query for the user
    const user = await User.findById(decodedRefresh.id).exec()

    // Ensure the current refresh token wasn't created before the last logout time because that would make it invalid.
    if (decodedRefresh.iat < user.lastLogoutTime.getTime()) {
        return res.status(400).json({ message: 'Refresh token created before last logout' })
    } else {
        const new_access_token = genJWT(decodedAccess.email, decodedAccess.id);
        return res.status(200).json({ new_access_token })
    }
}

module.exports = router