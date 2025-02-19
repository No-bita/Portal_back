import express from "express";
import {
  uploadQuestionSet,
  getQuestionSets,
  getQuestionsByFilter
} from "../controllers/questionController.js"; // Fixed casing
import { authMiddleware as auth, authorize } from "../middleware/authmiddleware.js";
import { validateQuestionSet } from "../middleware/validation.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiting configurations
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many upload attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true
});

// 🔒 Admin-only endpoints
router.post(
  "/sets",
  apiLimiter,
  auth,
  authorize("admin"),
  uploadLimiter,
  validateQuestionSet,
  uploadQuestionSet
);

// 🔍 Public endpoints with rate limiting
router.get("/sets",
  apiLimiter,
  auth,
  getQuestionSets
);

router.get("/filter",
  apiLimiter,
  auth,
  getQuestionsByFilter
);

// 404 handler for question routes
router.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: "Question endpoint not found"
  });
});

export default router;