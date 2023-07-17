const express = require('express')
const Task = require('../models/task.js')
const { authenticateToken } = require('../utils/auth_utils.js')
const router = express.Router()
router.use(express.json())
router.use(authenticateToken);

// Task creation
router.post('/', createTask)
router.put('/:taskId', updateTask)
router.delete('/:taskId', deleteTask)

// Task Retrieval
router.get('/', getAllTasks)
router.get('/filter', filterTasks)
// router.get('/sort', sortTasks)
router.get('/:taskId', getTaskById)

async function createTask(req, res) {
    // Set the ownerId to the one in the decoded access token passed to this middleware in res.locals.message
    req.body.ownerId = res.locals.message.id;

    try {
        // Then create the task and send the response.
        const task = await Task.create(req.body)
        return res.status(201).json(task)
    } catch (err) {
        return res.status(400).json({ message: err.message })
    }
}

async function updateTask(req, res) {
    const taskId = req.params.taskId
    const ownerId = res.locals.message.id

    // prohibit modification of ownership
    req.body.ownerId = ownerId

    /**
     * The following call does the following:
     * 
     * Check for existence of task
     * Verify that the ownerId of the task matches the current user
     * If all is well then go ahead and update the task with the provided req.body
     */

    try {
        const task = await Task.findOneAndUpdate({ _id: taskId, ownerId: ownerId }, req.body, { runValidators: true, returnDocument: 'after' });
        res.status(200).json(task ? task : { message: 'Task not found' })
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
}


async function deleteTask(req, res) {
    const taskId = req.params.taskId
    const ownerId = res.locals.message.id

    try {
        const task = await Task.findOneAndDelete({ _id: taskId, ownerId: ownerId });
        res.status(200).json(task ? { message: 'Task \'' + task.title + '\' deleted successfully' } : { message: 'Task not found' })
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
}

async function getAllTasks(req, res) {
    const ownerId = res.locals.message.id

    try {
        const tasks = await Task.find({ ownerId: ownerId });
        const data = { task_count: tasks.length, tasks }
        res.status(200).json(data)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
}

async function getTaskById(req, res) {
    const taskId = req.params.taskId
    const ownerId = res.locals.message.id

    try {
        const task = await Task.findOne({ _id: taskId, ownerId: ownerId });
        res.status(200).json(task ? task : { message: 'Task not found' })
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
}

async function filterTasks(req, res) {
    const filter = {};

    req.query.title && (filter.title = req.query.title)
    req.query.dueDate && (filter.dueDate = req.query.dueDate)
    req.query.status && (filter.status = req.query.status)
    req.query.priority && (filter.priority = req.query.priority)

    filter.ownerId = res.locals.message.id


    try {
        const tasks = await Task.find(filter);

        const data = { task_count: tasks.length, tasks }
        res.status(200).json(data)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
}

module.exports = router