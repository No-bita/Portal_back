import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true }],
  responses: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
      answer: { type: mongoose.Schema.Types.Mixed }, // Number or null
    },
  ],
  score: { type: Number, default: 0 },
  year: { type: Number, required: true },
  shift: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  subjectBoundaries: {
    Mathematics: { start: Number, end: Number },
    Physics: { start: Number, end: Number },
    Chemistry: { start: Number, end: Number },
  },
});

const Attempt = mongoose.model("Attempt", attemptSchema);
export default Attempt; // ✅ Use ES6 export
