require('dotenv').config()
const express = require('express')
const app = express()
const routes = require('./routes/routes.js')
const mongoose = require('mongoose')

// Connect to mongodb via mongoose
mongoose.connect(process.env.DB_URL).then(() => {
    console.log("Connected to db!")

    // Declare routes and start listening on p 3000
    app.use(routes)

    // Listen on port 3000
    app.listen(3000, () => console.log("Listening on port 3000!"))

}).catch((err) => {
    console.log(err)
})

