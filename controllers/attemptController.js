import Attempt from "../models/Attempt.js";
import Question from "../models/QuestionSet.js";

export const startAttempt = async (req, res) => {
  try {
    const { year, shift } = req.body;

    const collectionName = `${shift}`;
    const QuestionModel = mongoose.model(collectionName, new mongoose.Schema({}, { strict: false }), collectionName);
    // Fetch all 90 questions in original order
    const questions = await QuestionModel.find().sort({ question_id: 1 });

    if (questions.length !== 90) {
      return res.status(404).json({ message: "Complete question paper not found" });
    }

    res.status(200).json({
      message: "Questions found",
      questions,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId)
      .populate("questions", "type answer")
      .lean(); // ✅ Use `.lean()` for faster reads

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    // Calculate score
    let score = 0;
    const questionMap = new Map(attempt.questions.map(q => [q._id.toString(), q]));

    const detailedResults = attempt.responses.map(response => {
      const question = questionMap.get(response.questionId.toString());
      if (!question) return null;

      let marks = 0;
      if (response.answer !== null && question.answer !== undefined) {
        marks = Number(response.answer) === Number(question.answer) ? 4 : -1;
      }
      score += marks;

      return {
        questionId: response.questionId,
        marks,
        correct: marks === 4
      };
    });

    // Update attempt
    attempt.score = score;
    attempt.completedAt = new Date();
    await Attempt.findByIdAndUpdate(attempt._id, { score, completedAt: attempt.completedAt });

    res.json({
      score,
      totalQuestions: 90,
      maxPossible: 360,
      detailedResults,
      subjectBoundaries: attempt.subjectBoundaries
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const authorizeAttemptAccess = async (req, res, next) => {
  try {
    if (!req.attempt.user.equals(req.user.id)) { // ✅ Use `.equals()` instead of `.toString()`
      return res.status(403).json({ error: "Unauthorized access to attempt" });
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const saveProgress = async (req, res) => {
  try {
    const updatedAttempt = await Attempt.findByIdAndUpdate(
      req.params.attemptId,
      { $set: { responses: req.body.responses } }, // ✅ Use `$set` instead of overwriting `responses`
      { new: true, runValidators: true }
    );
    res.json({
      status: "success",
      data: updatedAttempt
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: "Failed to save progress"
    });
  }
};