import mongoose from "mongoose";
import QuestionSet from "../models/QuestionSet.js";
import { validate } from "../middleware/validation.js";

// 🛡️ Security & Validation Middleware
const processUpload = async (req, res, next) => {
  try {
    const { filename, fileData } = req.body;
    
    // Validate input structure
    if (!filename || !fileData || !Array.isArray(fileData)) {
      return res.status(400).json({ 
        status: "error",
        message: "Invalid request format" 
      });
    }

    // Validate filename pattern (e.g., 2024_Jan_27_Shift_1)
    const filenameRegex = /^(\d{4})_([A-Za-z]{3})_(\d{2})_Shift_(\d)$/;
    const match = filename.match(filenameRegex);
    
    if (!match) {
      return res.status(400).json({
        status: "error",
        message: "Invalid filename format. Expected: YYYY_MMM_DD_Shift_N"
      });
    }

    // 🗂️ Extract metadata
    const [, year, month, day, shiftNumber] = match;
    const slot = `${month} ${day} Shift ${shiftNumber}`;

    // Check for existing entry
    const exists = await QuestionSet.exists({ year, slot });
    if (exists) {
      return res.status(409).json({
        status: "error",
        message: "Question set already exists"
      });
    }

    // ✅ Validate all questions
    const validationErrors = validateQuestionData(fileData);
    if (validationErrors.length > 0) {
      return res.status(422).json({
        status: "error",
        message: "Validation failed",
        errors: validationErrors
      });
    }

    // Prepare for transaction
    req.uploadData = { year: parseInt(year), slot, questions: fileData };
    next();

  } catch (error) {
    console.error("[UPLOAD PROCESSING ERROR]", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during upload processing"
    });
  }
};

// 📤 Upload Controller
export const uploadQuestionSet = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    
    const newSet = new QuestionSet(req.uploadData);
    await newSet.save({ session });

    await session.commitTransaction();
    
    res.status(201).json({
      status: "success",
      data: {
        id: newSet._id,
        year: newSet.year,
        slot: newSet.slot,
        questionCount: newSet.questions.length
      }
    });

  } catch (error) {
    await session.abortTransaction();
    
    console.error("[DATABASE ERROR]", error);
    res.status(500).json({
      status: "error",
      message: "Failed to save question set to database"
    });
  } finally {
    session.endSession();
  }
};

// 🔍 Get Controller
export const getQuestionSets = async (req, res) => {
  try {
    const { year, slot, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    if (year) filter.year = parseInt(year);
    if (slot) filter.slot = slot;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: "-questions",
      sort: "-year slot"
    };

    const result = await QuestionSet.paginate(filter, options);

    res.status(200).json({
      status: "success",
      data: {
        total: result.totalDocs,
        sets: result.docs,
        totalPages: result.totalPages,
        currentPage: result.page
      }
    });

  } catch (error) {
    console.error("[RETRIEVAL ERROR]", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve question sets"
    });
  }
};

// 🔎 Filter Controller
export const getQuestionsByFilter = async (req, res) => {
  try {
    const { subjects, years, types, page = 1, limit = 50 } = req.query;
    const match = {};

    if (subjects) match.subject = { $in: subjects.split(",") };
    if (years) match.year = { $in: years.split(",").map(y => parseInt(y)) };
    if (types) match.type = { $in: types.split(",") };

    const pipeline = [
      { $unwind: "$questions" },
      { $match: match },
      { $project: { _id: 0, __v: 0 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ];

    const results = await QuestionSet.aggregate(pipeline);

    res.status(200).json({
      status: "success",
      data: {
        count: results.length,
        questions: results.map(q => q.questions),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("[FILTER ERROR]", error);
    res.status(500).json({
      status: "error",
      message: "Failed to filter questions"
    });
  }
};