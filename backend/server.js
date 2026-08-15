const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");

// Load Environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, ".env") });

const farmerRoutes = require("./routes/farmerRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Security Middleware (Helmet)
app.use(helmet());

// 2. Enable Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: "*", // In production, customize this to your specific frontend domain.
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// 3. API Rate Limiting (Express Rate Limit)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    status: 429,
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});
app.use("/api", apiLimiter);

// 4. Request Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. API Routes
app.use("/api", farmerRoutes);

// Firebase client config endpoint for dynamic frontend authentication initialization
app.get("/api/config/firebase", (req, res) => {
  const clean = (val) => (val || "").replace(/["']/g, "").replace(/,$/, "").trim();
  const cleanApiKey = clean(process.env.FIREBASE_WEB_API_KEY);
  const cleanProjectId = clean(process.env.FIREBASE_PROJECT_ID) || "agriscore-ai-cf54b";

  res.status(200).json({
    success: true,
    config: {
      apiKey: cleanApiKey,
      authDomain: `${cleanProjectId}.firebaseapp.com`,
      projectId: cleanProjectId,
      storageBucket: `${cleanProjectId}.appspot.com`
    }
  });
});

// 6. Root status check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AgriScore AI Production-Ready API Server is running.",
    timestamp: new Date().toISOString()
  });
});

// 7. Handle 404 Route Not Found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: `API Route not found: ${req.originalUrl}`
  });
});

// 8. Global Error Handler
app.use(errorHandler);

// Bind Server
app.listen(PORT, () => {
  console.log(`🚀 AgriScore AI API Server running on port ${PORT}`);
  console.log(`🔗 REST API Root available at: http://localhost:${PORT}/api`);
});
