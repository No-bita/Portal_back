import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question_id: { 
    type: Number, 
    required: [true, 'Question ID is required'],
    index: true 
  },
  type: { 
    type: String, 
    enum: {
      values: ["MCQ", "Integer"],
      message: 'Question type must be either "MCQ" or "Integer"'
    },
    required: [true, 'Question type is required']
  },
  options: {
    type: [String],
    validate: {
      validator: function(options) {
        return this.type === 'MCQ' ? options.length === 4 : options.length === 0;
      },
      message: 'MCQ must have 4 options, Integer type should have none'
    }
  },
  answer: {
    type: Number,
    required: [true, 'Answer is required'],
    validate: {
      validator: function(answer) {
        if (this.type === 'MCQ') {
          return answer >= 0 && answer < this.options.length;
        }
        return Number.isInteger(answer) && answer >= 0;
      },
      message: 'Invalid answer for question type'
    }
  },
  image: { 
    type: String, 
    required: [true, 'Image URL is required'],
    match: [/^https?:\/\/.+\..+/, 'Invalid image URL format']
  },
  subject: { 
    type: String, 
    enum: ["Mathematics", "Physics", "Chemistry"],
    required: [true, 'Subject is required'],
    index: true 
  }
});

const QuestionSetSchema = new mongoose.Schema({
  year: { 
    type: Number, 
    required: [true, 'Year is required'],
    min: [2000, 'Year must be after 2000'],
    index: true 
  },
  slot: { 
    type: String, 
    required: [true, 'Slot identifier is required'],
    match: [/^[A-Za-z0-9_]+$/, 'Invalid slot format'],
    index: true 
  },
  questions: {
    type: [questionSchema],
    required: [true, 'Questions array is required'],
    validate: {
      validator: questions => questions.length === 90,
      message: 'A complete question set must contain exactly 90 questions'
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for faster lookups
QuestionSetSchema.index({ year: 1, slot: 1 }, { unique: true });

const QuestionSet = mongoose.model('QuestionSet', QuestionSetSchema);
export default QuestionSet;