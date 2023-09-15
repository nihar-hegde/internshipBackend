import express from 'express';
import { authenticateJwt, SECRET } from"../middleware/index";
import { Todo }  from "../db";
const router = express.Router();
import {z} from 'zod';
const signUpInput = z.object({
  title:z.string().min(1).max(50),
  description:z.string().min(6).max(100)
})

type CreateTodoInput = z.infer<typeof signUpInput>;

router.post('/todos', authenticateJwt, (req, res) => {
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

  const { title, description }: CreateTodoInput = parsedInput.data; // Use parsedInput.data to get the parsed data

  const done = false;
  const userId = req.headers["userId"];

  const newTodo = new Todo({ title, description, done, userId });

  newTodo.save()
    .then((savedTodo) => {
      res.status(201).json(savedTodo);
    })
    .catch((err) => {
      res.status(500).json({ error: 'Failed to create a new todo' });
    });
});


router.get('/todos', authenticateJwt, (req, res) => {
  const userId = req.headers["userId"]

  Todo.find({ userId })
    .then((todos) => {
      res.json(todos);
    })
    .catch((err) => {
      res.status(500).json({ error: 'Failed to retrieve todos' });
    });
});

router.patch('/todos/:todoId/done', authenticateJwt, (req, res) => {
  const { todoId } = req.params;
  const userId = req.headers["userId"]
  

  Todo.findOneAndUpdate({ _id: todoId, userId }, { done: true }, { new: true })
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

router.patch('/todos/:todoId/update', authenticateJwt, async (req, res) => {
  const { todoId } = req.params;
  const userId = req.headers["userId"]
  const { title, description } = req.body;

  // Update the todo using findOneAndUpdate()
  const updatedTodo = await Todo.findOneAndUpdate({ _id: todoId, userId }, {
    title: title,
    description: description
  }, { new: true });

  // If the todo was not found, return a 404 error
  if (!updatedTodo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  // Return the updated todo
  res.json(updatedTodo);
});
router.delete('/todos/:todoId/delete', authenticateJwt, async (req, res) => {
  try {
    const { todoId } = req.params;
    const userId = req.headers["userId"];

    // Find and delete the todo
    const deletedTodo = await Todo.findOneAndDelete({ _id: todoId, userId });

    // If the todo was not found, return a 404 error
    if (!deletedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Return a success message or any other response as needed
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    // Handle any potential errors, e.g., database errors
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
export default router;