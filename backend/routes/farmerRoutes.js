const express = require("express");
const { body, validationResult } = require("express-validator");
const farmerController = require("../controllers/farmerController");
const scoreController = require("../controllers/scoreController");
const auth = require("../middleware/auth");

const router = express.Router();

// Middleware to capture and process validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Validation failed.",
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

// Input validators for score calculation and farmer creation
const scoreValidationRules = [
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Village/Location name is required."),
  body("crop")
    .trim()
    .notEmpty()
    .withMessage("Crop Type is required."),
  body("land")
    .isFloat({ min: 0.1 })
    .withMessage("Farm Size must be a positive number of at least 0.1 acres."),
  body("harvest")
    .isFloat({ min: 0 })
    .withMessage("Harvest must be a non-negative number."),
  body("irrigation")
    .trim()
    .notEmpty()
    .withMessage("Irrigation method is required."),
  body("annualIncome")
    .isFloat({ min: 0 })
    .withMessage("Annual Income must be a non-negative number."),
  body("existingLoans")
    .isFloat({ min: 0 })
    .withMessage("Existing Loans must be a non-negative number."),
  body("creditHistory")
    .isIn(["Good", "Medium", "Poor"])
    .withMessage("Credit History must be one of: 'Good', 'Medium', or 'Poor'."),
  body("requiredLoanAmount")
    .isFloat({ min: 1 })
    .withMessage("Required Loan Amount must be a positive number.")
];

const farmerValidationRules = [
  body("farmerName")
    .trim()
    .notEmpty()
    .withMessage("Farmer name is required."),
  body("village")
    .trim()
    .notEmpty()
    .withMessage("Village/Location is required."),
  body("cropType")
    .trim()
    .notEmpty()
    .withMessage("Crop Type is required."),
  body("farmSize")
    .isFloat({ min: 0 })
    .withMessage("Farm Size must be a positive number."),
  body("phoneNumber")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\+?[\d\s-]{10,15}$/)
    .withMessage("Phone number must be a valid format between 10 to 15 digits.")
];

const aiExplanationValidationRules = [
  body("score")
    .isInt({ min: 0, max: 100 })
    .withMessage("Score must be an integer between 0 and 100.")
];

// Score API
router.post("/score", scoreValidationRules, validateRequest, scoreController.calculateLoanScore);

// AI Explanation Layer API
router.post("/ai/explanation", aiExplanationValidationRules, validateRequest, scoreController.generateAIExplanation);

// Voice Natural Language Extraction API
router.post("/voice/extract", scoreController.extractVoiceForm);

// AI Scheme Guidance Explanation API
router.post("/ai/scheme-explanation", scoreController.explainScheme);

// Farmer REST CRUD APIs - secured with Firebase Auth middleware
router.post("/farmers", auth, farmerValidationRules, validateRequest, farmerController.createFarmer);
router.get("/farmers", auth, farmerController.getAllFarmers);
router.get("/farmers/:id", auth, farmerController.getFarmerById);
router.put("/farmers/:id", auth, farmerController.updateFarmer);
router.delete("/farmers/:id", auth, farmerController.deleteFarmer);

module.exports = router;
