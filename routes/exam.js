import express from "express";
import {
  createExam,
  getExamById,
  submitExam,
  getAllExams
} from "../controllers/examController.js";

const router = express.Router();

// ✅ Route to create an exam
router.post("/create", createExam);

// ✅ Route to get details of a specific exam
router.get("/:examId", getExamById);

// ✅ Route to submit an exam attempt
router.post("/:examId/submit", submitExam);

// ✅ Route to get all exams
router.get("/", getAllExams);

export default router;
