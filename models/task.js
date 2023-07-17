const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
    {
        "title": {
            type: String,
            required: [true, "Title is required!"],
            unique: true
        },
        "description": {
            type: String,
            required: false,
            default: ""
        },
        "dueDate": {
            type: Date,
            required: false,
            default: Date.now(),
            min: Date.now()
        },
        "status": {
            type: Number,
            default: 0,
            min: [0, "There are 5 status states. Provide a value between 0 and 4. Refer to documentation for translation."],
            max: [4, "There are 5 status states. Provide a value between 0 and 4. Refer to documentation for translation."],
        },
        "priority": {
            type: Number,
            default: -1,
            min: [-1, "Lowest allowed value is -1 to denote 'no priority'"]
        },
        "ownerId": {
            type: String,
            required: false,
        }
    },
    { timestamps: true }
)



const Task = mongoose.model('Task', taskSchema)

module.exports = Task
