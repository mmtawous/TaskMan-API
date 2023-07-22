const JWT = require('jsonwebtoken')

/**
 * Generates a JWT token. If both an email and id are passed then the generated token will expire
 * in the time alloted for access tokens. Otherwise, if only the id is passed then the generated token 
 * will expire in the time alloted for refresh tokens
 */
function genJWT(email, id) {
    // Generate and return an access token
    if (email && id) {
        return JWT.sign({ email: email, id: id, iat: Date.now() }, process.env.ACCESS_SECRET, { expiresIn: '100m' })
    } else if (id) {
        return JWT.sign({ id: id, iat: Date.now() }, process.env.REFRESH_SECRET, { expiresIn: '1d' })
    } else {
        throw new Error("id is required")
    }
}

/**
 * Verify the integrity of the current access token and pass the decoded token as 
 * a local variable to next middleware.
 */
async function authenticateToken(req, res, next) {
    // Check that the bearer token was passed in the Authorization header
    if (!req.header('Authorization')) {
        return res.status(400).json({ message: 'Missing access token' })
    }

    // Parse the Authorization header
    const accessToken = req.header('Authorization').split(' ')[1]

    try {
        // Verify that the access token is real
        var decodedAccess = JWT.verify(accessToken, process.env.ACCESS_SECRET)

    } catch (err) {
        // If we get an error then the token was invalid
        return res.status(400).json({ message: 'Bad access token' })
    }

    res.locals.decoded = decodedAccess
    next();
}

module.exports = { genJWT, authenticateToken }