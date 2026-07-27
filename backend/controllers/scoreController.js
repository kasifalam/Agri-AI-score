const { calculateScore } = require("../services/scoringService");
const { generateRecommendations } = require("../services/recommendationService");

/**
 * Calculate loan readiness score and risk recommendations
 * POST /api/score
 */
exports.calculateLoanScore = async (req, res, next) => {
  try {
    const {
      location,
      crop,
      land,
      harvest,
      irrigation,
      tickedCount,
      weather,
      lang = "en",
      annualIncome,
      existingLoans,
      creditHistory,
      requiredLoanAmount
    } = req.body;

    const parseNum = (v) => {
      const p = parseFloat(v);
      return isNaN(p) ? 0 : p;
    };

    // Calculate score, risk, and other diagnostics
    const scoreResult = calculateScore({
      location,
      crop,
      land: parseNum(land),
      harvest: parseNum(harvest),
      irrigation,
      tickedCount: parseInt(tickedCount) || 0,
      weather,
      lang,
      annualIncome: parseNum(annualIncome),
      existingLoans: parseNum(existingLoans),
      creditHistory: creditHistory || "Good",
      requiredLoanAmount: parseNum(requiredLoanAmount)
    });

    // Generate personalized AI recommendations
    const recommendations = generateRecommendations({
      farmSize: parseNum(land),
      cropType: crop,
      annualIncome: parseNum(annualIncome),
      existingLoans: parseNum(existingLoans),
      creditHistory: creditHistory || "Good",
      tickedCount: parseInt(tickedCount) || 0,
      lang
    });

    // Return combined result
    res.status(200).json({
      success: true,
      ...scoreResult,
      recommendations
    });
  } catch (error) {
    next(error);
  }
};
