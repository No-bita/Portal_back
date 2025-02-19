import express from 'express';
import { register, login } from '../controllers/userController.js';
import { validate, handleValidation } from '../middleware/validation.js';

const router = express.Router();

// Registration endpoint
router.post(
  '/register',
  validate('register'),    // Validation rules
  handleValidation,        // Error handling
  register                 // Controller
);

// Login endpoint
router.post(
  '/login',
  validate('login'),       // Validation rules
  handleValidation,        // Error handling
  login                    // Controller
);

export default router;