const express = require('express')
const registerRoute = require('./register.js')
const loginRoute = require('./login.js')
const logoutRoute = require('./logout.js')
const changePwdRoute = require('./changePassword.js')
const refreshRoute = require('./refresh.js')
const tasksRoute = require('./tasks.js')


// Routing api endpoints here
const router = express.Router()
router.use('/api/register', registerRoute)
router.use('/api/login', loginRoute)
router.use('/api/logout', logoutRoute)
router.use('/api/changePassword', changePwdRoute)
router.use('/api/refresh', refreshRoute)
router.use('/api/tasks', tasksRoute)

// Any url that is not handled above gets a 404!
router.use((req, res) => {
    // respond with json
    res.status(404).json({ error: 'Not found' })
})

module.exports = router