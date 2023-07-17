const mongoose = require('mongoose');

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

const userSchema = new mongoose.Schema(
    {
        "email": {
            type: String,
            validate: {
                validator: function (v) {
                    // Validate email with this regex
                    return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(v)
                },

                message: props => `${props.value} is not a valid email!`
            },

            required: [true, "Email is required!"],
            unique: true
        },
        "password": {
            type: String,

            validate: {
                validator: validatePassword,

                message: props => `${props.value} password is not valid!`
            },

            required: [true, "Password is required!"]
        },
        "lastLogoutTime": {
            type: Date,
            required: false,
            default: Date.now()
        }
    },
    { timestamps: true }
)

// Allows us to skip verifying the password when it is already hash because it won't pass validation.
userSchema.set('validateBeforeSave', false);

const User = mongoose.model('User', userSchema)

module.exports = { User, validatePassword }
