const JWT = require('jsonwebtoken')

/**
 * Generates a JWT token. If both an email and id are passed then the generated token will expire
 * in the time alloted for access tokens. Otherwise, if only the id is passed then the generated token 
 * will expire in the time alloted for refresh tokens
 */
function genJWT(email, id) {
    // Generate and return an access token
    if (email && id) {
        return JWT.sign({ email: email, id: id }, process.env.ACCESS_SECRET, { expiresIn: '100m' })
    } else if (id) {
        return JWT.sign({ id: id }, process.env.REFRESH_SECRET, { expiresIn: '1d' })
    } else {
        throw new Error("id is required")
    }
}

function authenticateToken(req, res, next) {
    // Check that the bearer token was passed in the Authorization header
    if (!req.header('Authorization')) {
        return res.status(400).json({ message: 'Missing access token' })
    }

    // Parse the Authorization header
    const accessToken = req.header('Authorization').split(' ')[1]

    let decodedAccess;
    try {
        // Verify that the access token is real
        decodedAccess = JWT.verify(accessToken, process.env.ACCESS_SECRET)
        res.locals.authenticated = true
        res.locals.message = decodedAccess
        next();

    } catch (err) {
        // If we get an error then the token was invalid
        return res.status(400).json({ message: 'Bad access token' })
    }

}

function validatePassword(pass) {
    let checks = 0;

    // Check that length is between 8 and 32 chars
    if (pass.length >= 8 && pass.length <= 32) checks++;

    // Check that we have a digit
    if (/[0-9]/.test(pass)) checks++;

    // Check that we have an upper case
    if (/[A-Z]/.test(pass)) checks++;

    // Check that we have a lower case
    if (/[a-z]/.test(pass)) checks++;

    // Check that we have a special char
    if (/[!@#$%^&*()_\-+={}|?<>\/\\]/.test(pass)) checks++;

    return checks == 5;
}

module.exports = { genJWT, authenticateToken, validatePassword }