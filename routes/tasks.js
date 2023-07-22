const express = require('express')
const Task = require('../models/task.js')
const { authenticateToken } = require('../utils/auth_utils.js')
const router = express.Router()

router.use(express.json())

// Run the authentication middleware before all task operations
router.use(authenticateToken);

// Task creation
router.post('/', createTask)
router.put('/:taskId', updateTask)
router.delete('/:taskId', deleteTask)

// Task Retrieval
router.get('/', getAllTasks)
router.get('/filter', filterTasks)
router.get('/:taskId', getTaskById)

/**
 * Create a task given the following in the JSON request body:
 * 
 * Title (required)
 * Description
 * Due Date
 * Status: { 0 = Pending, 
 *           1 = In Progress, 
 *           2 = Completed, 
 *           3 = On-Hold, 
 *           4 = Cancelled }
 * Priority
 * 
 * The new task object is returned in the response in JSON
 */
async function createTask(req, res) {
    // Set the ownerId to the one in the decoded access token passed to this middleware in res.locals.decoded
    req.body.ownerId = res.locals.decoded.id;

    try {
        // Then create the task and send the response.
        const task = await Task.create(req.body)
        return res.status(201).json(task)
    } catch (err) {
        return res.status(400).json({ message: err.message })
    }
}

/**
 * Updates a task given its id as a request parameter (part of url path). All field listed in the createTask endpoint
 * can be modified or added (if not already present). The task to be updated must be owned by the currently authenticated user.
 * 
 * The new task object is returned in the response in JSON
 */
async function updateTask(req, res) {
    const taskId = req.params.taskId
    const ownerId = res.locals.decoded.id

    // Prohibit modification of ownership
    req.body.ownerId = ownerId

    try {
        const task = await Task.findOneAndUpdate({ _id: taskId, ownerId: ownerId },
            req.body,
            { runValidators: true, returnDocument: 'after' }).exec();

        return res.status(200).json(task ? task : { message: 'Task not found' })
    } catch (err) {
        return res.status(400).json({ message: err.message })
    }
}

/**
 * Deletes a task given its id as a request parameter (part of url path). The provided task must be owned
 * by the currently authenticated user.
 */
async function deleteTask(req, res) {
    const taskId = req.params.taskId
    const ownerId = res.locals.decoded.id

    try {
        const task = await Task.findOneAndDelete({ _id: taskId, ownerId: ownerId });
        if (task) {
            return res.status(200).json({ message: 'Task \'' + task.title + '\' deleted successfully' })
        } else {
            return res.status(400).json({ message: 'Task not found' })
        }
    } catch (err) {
        return res.status(400).json({ message: err.message })
    }
}

/**
 * Responds with a single task with a matching id given as a request parameter (part of url path). The provided task must be owned
 * by the currently authenticated user.
 */
async function getTaskById(req, res) {
    const taskId = req.params.taskId
    const ownerId = res.locals.decoded.id

    try {
        const task = await Task.findOne({ _id: taskId, ownerId: ownerId });
        if (task) return res.status(200).json(task);
        else return res.status(400).json({ message: 'Task not found' })
    } catch (err) {
        return res.status(400).json({ message: err.message })
    }
}

/**
 * Responds with all tasks owned by the currently authenticated user in a JSON array of task objects.
 * 
 * Callers may optionally sort the returned tasks by providing the sortBy and/or the sortOrder query parameter(s). 
 * users may sort by title, due date, status or priority. If the sortBy param is provided without the sortOrder param, 
 * the sort order is ascending by default. If the sortOrder param is provided without the sortBy param, the tasks are sorted by
 * priority by default.
 */
async function getAllTasks(req, res) {
    const ownerId = res.locals.decoded.id

    var tasks = null;

    try {
        tasks = await Task.find({ ownerId: ownerId });
    } catch (err) {
        return res.status(400).json({ message: err.message })
    }

    // Check if sorting is should be done
    if (tasks && (req.query.sortBy || req.query.sortOrder)) {
        tasks = sortTasks(req.query.sortBy, req.query.sortOrder, tasks);
    }

    const data = { task_count: tasks.length, tasks }
    res.status(200).json(data)
}

/**
 * Provides tasks filtered by the provided query parameters. Filtering currently only supports exact 
 * matching, including case sensitivity. Supported filter parameters are:
 * 
 * Title
 * Due Date
 * Status
 * Priority
 * 
 * Callers may optionally sort the returned tasks by providing the sortBy and/or the sortOrder query parameter(s). 
 * users may sort by title, due date, status or priority. The sortOrder parameter may be "ascending" or "descending".
 * If the sortBy param is provided without the sortOrder param, the sort order is ascending by default. If the sortOrder
 * param is provided without the sortBy param, the tasks are sorted by priority by default.
 */
async function filterTasks(req, res) {
    const filter = {};

    req.query.title && (filter.title = req.query.title)
    req.query.dueDate && (filter.dueDate = req.query.dueDate)
    req.query.status && (filter.status = req.query.status)
    req.query.priority && (filter.priority = req.query.priority)

    filter.ownerId = res.locals.decoded.id

    var tasks = null;

    try {
        // Find tasks based on filter
        tasks = await Task.find(filter);
    } catch (err) {
        return res.status(400).json({ message: err.message })
    }

    // Check if sorting is should be done
    if (tasks && (req.query.sortBy || req.query.sortOrder)) {
        tasks = sortTasks(req.query.sortBy, req.query.sortOrder, tasks);
    }

    const data = { task_count: tasks.length, tasks }
    return res.status(200).json(data);
}

// Helper function for sorting tasks.
function sortTasks(sortBy, sortOrder, tasks) {
    sortBy = sortBy ? sortBy : 'priority'

    // If sortOrder is provided check if it starts with 'des' and set ascending to false, if not just assume ascending. If
    // sortOrder is not provided assume ascending order.
    const ascending = sortOrder ? !(sortOrder.toLowerCase().startsWith('des')) : true;

    // Sort based on query param
    switch (sortBy) {
        case 'title':
            tasks.sort((a, b) => {
                return (ascending ? a.title.localeCompare(b.title) : -(a.title.localeCompare(b.title)));
            })
            break;

        case 'dueDate':
            tasks.sort((a, b) => {
                return (ascending ? (a.dueDate - b.dueDate) : -(a.dueDate - b.dueDate))
            })
            break;

        case 'status':
            tasks.sort((a, b) => {
                return (ascending ? (a.status - b.status) : -(a.status - b.status))
            })
            break;

        default:
            tasks.sort((a, b) => {
                return (ascending ? (a.priority - b.priority) : -(a.priority - b.priority))
            })
    }

    return tasks
}

module.exports = router