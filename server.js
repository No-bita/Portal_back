import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// Configuration files
import connectDB from "./config/db.js";

// Route imports
import authRoutes from "./routes/auth.js";
import attemptRoutes from "./routes/attempts.js";
import questionRoutes from "./routes/questions.js";
import examRoutes from "./routes/exam.js";

// Initialize environment variables
dotenv.config();

// ES Modules fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate essential environment variables
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "CORS_ORIGINS"];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

// Initialize Express
const app = express();

// ======================
// SECURITY MIDDLEWARE
// ======================
const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"]
      }
    }
  }),
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }),
  compression(),
  express.json({ limit: "10kb" }),
  express.urlencoded({ extended: true, limit: "10kb" })
];

app.use(securityMiddleware);

// ======================
// DEVELOPMENT TOOLS
// ======================
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  mongoose.set("debug", true);
}

// ======================
// RATE LIMITING
// ======================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false
});

// ======================
// CORS CONFIGURATION
// ======================
const corsOptions = {
  origin: process.env.CORS_ORIGINS.split(","),
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ======================
// TRUST & PROXY
// ======================
app.set("trust proxy", 1);

// ======================
// ROUTES
// ======================
app.use("/api/", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/exams", examRoutes);

// ======================
// HEALTH CHECK
// ======================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    dbStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    memoryUsage: process.memoryUsage()
  });
});

// ======================
// STATIC ASSETS (If needed)
// ======================
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client/build", "index.html"));
  });
}

// ======================
// ERROR HANDLING
// ======================
app.use("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: "Endpoint not found"
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" && statusCode === 500 
    ? "An unexpected error occurred" 
    : err.message;

  if (process.env.NODE_ENV !== "test") {
    console.error(`[${new Date().toISOString()}] ${statusCode} - ${err.message}`);
  }

  res.status(statusCode).json({
    status: "error",
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      errors: err.errors
    })
  });
});

// ======================
// DATABASE & SERVER START
// ======================
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    
    // Database event listeners
    mongoose.connection.on("connected", () => {
      console.log("🗄️  MongoDB connection established");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode`);
      console.log(`🔗 Port: ${PORT}`);
      console.log(`📅 ${new Date().toLocaleString()}`);
      console.log(`🌍 CORS Origins: ${process.env.CORS_ORIGINS}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

export default app;