const { calculateScore } = require("../services/scoringService");
const { generateRecommendations } = require("../services/recommendationService");
const { generateAssessmentExplanation, extractVoiceFormData, explainSchemeRelevance } = require("../services/llmService");

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

/**
 * Generate AI-powered explanation and personalized recommendations for an existing score result
 * POST /api/ai/explanation
 */
exports.generateAIExplanation = async (req, res, next) => {
  try {
    const {
      score,
      riskCategory,
      risk,
      eligibility,
      reasons,
      suggestions,
      recommendations,
      farmData,
      documents,
      language
    } = req.body;

    const finalScore = parseInt(score);
    const finalRisk = riskCategory || risk || "Medium";
    const finalEligibility = eligibility || "Conditioned";
    const finalLang = language || "English";

    if (isNaN(finalScore) || finalScore < 0 || finalScore > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid numerical assessment score provided."
      });
    }

    const aiResult = await generateAssessmentExplanation({
      score: finalScore,
      riskCategory: finalRisk,
      eligibility: finalEligibility,
      reasons: Array.isArray(reasons) ? reasons : [],
      suggestions: Array.isArray(suggestions) ? suggestions : [],
      recommendations: Array.isArray(recommendations) ? recommendations : [],
      farmData: farmData || {},
      documents: documents || {},
      language: finalLang
    });

    res.status(200).json({
      success: true,
      score: finalScore,
      riskCategory: finalRisk,
      language: finalLang,
      data: aiResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Extract structured form parameters from multi-sentence spoken speech
 * POST /api/voice/extract
 */
exports.extractVoiceForm = async (req, res, next) => {
  try {
    const { spokenText, language = "English" } = req.body;

    if (!spokenText || typeof spokenText !== "string") {
      return res.status(400).json({
        success: false,
        message: "Spoken text parameter is required."
      });
    }

    const result = await extractVoiceFormData({ spokenText, language });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate concise AI explanation of why a verified scheme is relevant to a farmer
 * POST /api/ai/scheme-explanation
 */
exports.explainScheme = async (req, res, next) => {
  try {
    const { scheme, farmProfile, language = "English" } = req.body;

    if (!scheme) {
      return res.status(400).json({
        success: false,
        message: "Scheme data parameter is required."
      });
    }

    const result = await explainSchemeRelevance({ scheme, farmProfile, language });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};
