import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import QuestionSet from "../models/QuestionSet.js"; // Use improved schema

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const processFile = async (filePath) => {
  try {
    // 1. Validate filename pattern
    const filename = path.basename(filePath);
    if (!filename.match(/^\d{4}_[A-Za-z]{3}_\d{2}_Shift_\d\.json$/)) {
      throw new Error(`Invalid filename format: ${filename}`);
    }

    // 2. Extract metadata
    const [year, month, day, shift] = filename.replace(".json", "").split("_");
    const slot = `${month} ${day} ${shift.replace("Shift", "Shift ")}`;

    // 3. Read and parse data
    const fileContent = await fs.readFile(filePath, "utf-8");
    const questions = JSON.parse(fileContent);

    // 4. Validate questions
    const validationErrors = [];
    questions.forEach((q, index) => {
      if (!q.question_id) validationErrors.push(`Question ${index}: Missing ID`);
      if (q.type === "MCQ" && q.options?.length !== 4) {
        validationErrors.push(`Question ${index}: MCQ must have 4 options`);
      }
      // Add more validations...
    });

    if (validationErrors.length > 0) {
      throw new Error(`Validation failed:\n${validationErrors.join("\n")}`);
    }

    // 5. Check for existing set
    const exists = await QuestionSet.exists({ year, slot });
    if (exists) {
      throw new Error(`Question set ${year} ${slot} already exists`);
    }

    // 6. Create new question set
    const questionSet = new QuestionSet({
      year: parseInt(year),
      slot,
      questions: questions.map(q => ({
        ...q,
        options: q.options?.map(opt => opt.trim()) || [],
        answer: q.type === "MCQ" ? Math.max(0, Math.min(3, q.answer)) : q.answer
      }))
    });

    // 7. Save to database
    await questionSet.save();
    console.log(`✅ Successfully imported ${questions.length} questions for ${year} ${slot}`);

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    process.exit(1);
  }
};

// Execute for all JSON files in directory
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const directoryPath = path.join(__dirname, "JEE Mains");
    const files = await fs.readdir(directoryPath);
    
    for (const file of files.filter(f => f.endsWith(".json"))) {
      await processFile(path.join(directoryPath, file));
    }

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
})();