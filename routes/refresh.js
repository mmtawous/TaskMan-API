const express = require('express')
const redisClient = require('../utils/redis_client')
const JWT = require('jsonwebtoken')
const { genJWT } = require('../utils/auth_utils.js')
const cookieParser = require("cookie-parser")
const { User }  = require('../models/user.js')


const router = express.Router()
router.use(express.json())

// Allow cookie parsing
router.use(cookieParser())

router.post('/', refresh)

// This endpoint refreshes the access token provided a valid refresh token that isn't in the
// blacklist
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

    var decodedRefresh;
    try {
        // Verify the refresh token
        decodedRefresh = JWT.verify(refreshToken, process.env.REFRESH_SECRET)

    } catch (err) {
        // If refresh token verification fails then return 401
        return res.status(401).json({ message: 'Invalid refresh token' })
    }

    const user = await User.findById(decodedRefresh.id)

    if (decodedRefresh.iat < user.lastLogoutTime.getTime()) {
        console.log(decodedRefresh.iat)
        console.log(user.lastLogoutTime.getTime())

        return res.status(400).json({ message: 'Refresh token created before last logout' })
    }


    // Check that the bearer token was passed in the Authorization header
    if (!req.header('Authorization')) {
        return res.status(400).json({ message: 'Missing access token' })
    }

    // If refresh is valid then parse the Authorization header to get the expired access token
    const accessToken = req.header('Authorization').split(' ')[1]

    var decodedAccess;
    try {
        // Verify that the access token is real
        decodedAccess = JWT.verify(accessToken, process.env.ACCESS_SECRET, { ignoreExpiration: true })

    } catch (err) {
        // If we get an error that isn't an expired token error then the token was invalid
        return res.status(400).json({ message: 'Bad access token' })
    }

    // If the IDs don't match then return an error
    if (decodedAccess.id !== decodedRefresh.id) {
        return res.status(400).json({ message: 'Mismatched access and refresh tokens' })
    }

    // Otherwise we can finally return a new access token
    else {
        const new_access_token = genJWT(decodedAccess.email, decodedAccess.id);
        return res.status(200).json({ new_access_token })
    }
}

module.exports = router