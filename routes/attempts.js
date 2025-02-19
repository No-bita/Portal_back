import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import { startAttempt, submitAttempt, authorizeAttemptAccess, saveProgress } from "../controllers/attemptController.js";
import { validate } from "../middleware/validation.js";
import Attempt from "../models/Attempt.js"; // ✅ Ensure Attempt model is imported

const router = express.Router();

// ✅ Ensure the `/api/attempts` base route is correctly handled in `server.js`

// Health check for `attempts` endpoint
router.get("/", (req, res) => {
  res.json({ message: "Attempts API is working!" });
});

// ✅ Ensure parameter handling for `attemptId`
router.param("attemptId", async (req, res, next, id) => {
  try {
    const attempt = await Attempt.findById(id);
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    req.attempt = attempt;
    next();
  } catch (err) {
    next(err);
  }
});

// ✅ Start new attempt
router.post(
  "/start",
  authMiddleware,
  validate("attempt"),
  startAttempt
);

// ✅ Submit attempt
router.post(
  "/:attemptId/submit",
  authMiddleware,
  authorizeAttemptAccess,
  submitAttempt
);

// ✅ Save progress in an attempt
router.patch(
  "/:attemptId",
  authMiddleware,
  authorizeAttemptAccess,
  validate("saveProgress"),
  saveProgress
);

export default router; // ✅ Ensures `server.js` can import correctly
