"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../middleware/index");
const db_1 = require("../db");
const router = express_1.default.Router();
const zod_1 = require("zod");
const signUpInput = zod_1.z.object({
    title: zod_1.z.string().min(1).max(50),
    description: zod_1.z.string().min(6).max(100)
});
router.post('/todos', index_1.authenticateJwt, (req, res) => {
    const parsedInput = signUpInput.safeParse(req.body);
    if (!parsedInput.success) {
        // Extract the error message from parsedInput.error
        const errorMessage = parsedInput.error.message;
        // Send the error message in the response
        res.status(400).json({
            error: errorMessage
        });
        return;
    }
    const { title, description } = parsedInput.data; // Use parsedInput.data to get the parsed data
    const done = false;
    const userId = req.headers["userId"];
    const newTodo = new db_1.Todo({ title, description, done, userId });
    newTodo.save()
        .then((savedTodo) => {
        res.status(201).json(savedTodo);
    })
        .catch((err) => {
        res.status(500).json({ error: 'Failed to create a new todo' });
    });
});
router.get('/todos', index_1.authenticateJwt, (req, res) => {
    const userId = req.headers["userId"];
    db_1.Todo.find({ userId })
        .then((todos) => {
        res.json(todos);
    })
        .catch((err) => {
        res.status(500).json({ error: 'Failed to retrieve todos' });
    });
});
router.patch('/todos/:todoId/done', index_1.authenticateJwt, (req, res) => {
    const { todoId } = req.params;
    const userId = req.headers["userId"];
    db_1.Todo.findOneAndUpdate({ _id: todoId, userId }, { done: true }, { new: true })
        .then((updatedTodo) => {
        if (!updatedTodo) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        res.json(updatedTodo);
    })
        .catch((err) => {
        res.status(500).json({ error: 'Failed to update todo' });
    });
});
router.patch('/todos/:todoId/update', index_1.authenticateJwt, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { todoId } = req.params;
    const userId = req.headers["userId"];
    const { title, description } = req.body;
    // Update the todo using findOneAndUpdate()
    const updatedTodo = yield db_1.Todo.findOneAndUpdate({ _id: todoId, userId }, {
        title: title,
        description: description
    }, { new: true });
    // If the todo was not found, return a 404 error
    if (!updatedTodo) {
        return res.status(404).json({ error: 'Todo not found' });
    }
    // Return the updated todo
    res.json(updatedTodo);
}));
router.delete('/todos/:todoId/delete', index_1.authenticateJwt, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { todoId } = req.params;
        const userId = req.headers["userId"];
        // Find and delete the todo
        const deletedTodo = yield db_1.Todo.findOneAndDelete({ _id: todoId, userId });
        // If the todo was not found, return a 404 error
        if (!deletedTodo) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        // Return a success message or any other response as needed
        res.json({ message: 'Todo deleted successfully' });
    }
    catch (error) {
        // Handle any potential errors, e.g., database errors
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
