const { db } = require("../config/firebase");

/**
 * Create/Store farmer details
 * POST /api/farmers
 */
exports.createFarmer = async (req, res, next) => {
  try {
    const {
      farmerName,
      phoneNumber,
      village,
      district,
      state,
      farmSize,
      cropType,
      annualIncome,
      existingLoans,
      creditHistory,
      requiredLoanAmount,
      uploadedDocuments,
      score,
      risk,
      eligibility,
      recommendations,
      reasons,
      suggestions,
      harvest,
      irrigation,
      weather,
      date,
      aiExplanation,
      aiLanguage
    } = req.body;

    const parseNum = (v) => {
      const p = parseFloat(v);
      return isNaN(p) ? 0 : p;
    };

    const newFarmer = {
      userId: req.user.uid, // Track document ownership by authenticated user's Firebase UID
      farmerName: farmerName || "Unknown Farmer",
      phoneNumber: phoneNumber || "",
      village: village || "",
      district: district || "",
      state: state || "",
      farmSize: parseNum(farmSize),
      cropType: cropType || "",
      annualIncome: parseNum(annualIncome),
      existingLoans: parseNum(existingLoans),
      creditHistory: creditHistory || "Good",
      requiredLoanAmount: parseNum(requiredLoanAmount),
      uploadedDocuments: uploadedDocuments || [],
      score: parseInt(score) || 0,
      risk: risk || "High",
      eligibility: eligibility || "Ineligible",
      recommendations: recommendations || [],
      reasons: reasons || [],
      suggestions: suggestions || [],
      harvest: parseNum(harvest),
      irrigation: irrigation || "canal",
      weather: weather || null,
      date: date || new Date().toLocaleDateString(),
      aiExplanation: aiExplanation || null,
      aiLanguage: aiLanguage || "English",
      timestamp: new Date().toISOString()
    };


    const docRef = await db.collection("farmers").add(newFarmer);
    
    res.status(201).json({
      success: true,
      id: docRef.id,
      message: "Farmer details saved successfully.",
      data: { id: docRef.id, ...newFarmer }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all farmers
 * GET /api/farmers
 */
exports.getAllFarmers = async (req, res, next) => {
  try {
    const snapshot = await db.collection("farmers").where("userId", "==", req.user.uid).get();
    const farmers = [];
    
    snapshot.docs.forEach(doc => {
      farmers.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by timestamp descending (newest first)
    farmers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      count: farmers.length,
      data: farmers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single farmer by ID
 * GET /api/farmers/:id
 */
exports.getFarmerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("farmers").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: `Farmer with ID ${id} not found.`
      });
    }

    // Enforce data ownership block
    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden. This record belongs to another user."
      });
    }

    res.status(200).json({
      success: true,
      data: { id: doc.id, ...doc.data() }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update farmer details
 * PUT /api/farmers/:id
 */
exports.updateFarmer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("farmers").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: `Farmer with ID ${id} not found.`
      });
    }

    // Enforce data ownership block
    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden. This record belongs to another user."
      });
    }

    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    
    // Perform document merge update
    await docRef.update(updates);
    const updatedDoc = await docRef.get();

    res.status(200).json({
      success: true,
      message: "Farmer details updated successfully.",
      data: { id: updatedDoc.id, ...updatedDoc.data() }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete farmer by ID
 * DELETE /api/farmers/:id
 */
exports.deleteFarmer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("farmers").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: `Farmer with ID ${id} not found.`
      });
    }

    // Enforce data ownership block
    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden. This record belongs to another user."
      });
    }

    await docRef.delete();

    res.status(200).json({
      success: true,
      message: "Farmer record deleted successfully."
    });
  } catch (error) {
    next(error);
  }
};
