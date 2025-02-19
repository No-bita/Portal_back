import Exam from "../models/Exam.js";
import Question from "../models/QuestionSet.js";

// ✅ Create a new exam
export const createExam = async (req, res) => {
  try {
    const { title, description, QuestionId, duration } = req.body;

    // Validate required fields
    if (!title || !QuestionId || !duration) {
      return res.status(400).json({ message: "Title, question file ID, and duration are required" });
    }

    // Check if question file exists
    const Question = await Question.findById(QuestionId);
    if (!Question) {
      return res.status(404).json({ message: "Question file not found" });
    }

    // Create new exam
    const newExam = new Exam({
      title,
      description,
      questions: [Question._id],
      duration,
    });

    await newExam.save();
    res.status(201).json({ message: "Exam created successfully", exam: newExam });
  } catch (error) {
    console.error("Error creating exam:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get exam details by ID
export const getExamById = async (req, res) => {
  try {
    const { examId } = req.params;
    
    const exam = await Exam.findById(examId).populate("questions");
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.status(200).json(exam);
  } catch (error) {
    console.error("Error fetching exam:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Submit an exam attempt
export const submitExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body; // Answers will be an object with question_id -> selected answer

    if (!answers) {
      return res.status(400).json({ message: "Answers are required" });
    }

    const exam = await Exam.findById(examId).populate("questions");
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Evaluate exam (Simple logic)
    let score = 0;
    exam.questions.forEach((question) => {
      if (answers[question.question_id] === question.answer) {
        score++;
      }
    });

    res.status(200).json({ message: "Exam submitted", score, totalQuestions: exam.questions.length });
  } catch (error) {
    console.error("Error submitting exam:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get all exams
export const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find().populate("questions");
    res.status(200).json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
