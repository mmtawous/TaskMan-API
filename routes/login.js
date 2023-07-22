const express = require('express')
const { User }  = require('../models/user.js')
const bcrypt = require('bcrypt')
const { genJWT } = require('../utils/auth_utils.js')
const router = express.Router()
router.use(express.json())

router.post('/', login)

// This auth system uses JWT tokens paired with a refresh token sent to the client in an http-only cookie
// storing any revoked tokens in the backend on a local redis instance for quick lookups. The benefit of refresh
// tokens is enhanced security and convenience for the user while also allowing for the user to logout and revoke
// their refresh token by adding it to the redis db.
async function login(req, res) {
    // Check for all required params
    if (!(req.body.email && req.body.password)) {
        return res.status(400).json({ message: 'Malformed request' })
    }

    // Check for a user with the given email
    var user = await User.findOne({ email: req.body.email }).exec()

    // If the user provided doesn't exist then respond with an error
    if (!user) {
        return res.status(400).json({ message: "User does not exist!" })
    }

    // Hash the provided password and compare with the db version
    const match = await bcrypt.compare(req.body.password, user.password);

    if (!match) {
        return res.status(401).json({ message: "Invalid credentials" })
    }

    // If we have a match then generate a refresh and access token and send them off with a 200 status
    const access = genJWT(user.email, user.id);
    const refresh = genJWT(undefined, user.id);

    // Assigning refresh token in http-only cookie 
    res.cookie('jwt', refresh, {
        httpOnly: true,
        sameSite: 'None', secure: true,
        maxAge: 24 * 60 * 60 * 1000
    });

    // Respond with the access token 
    return res.status(200).json({ access });
}


module.exports = router