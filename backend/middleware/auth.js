const { admin, isMock } = require("../config/firebase");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: "Unauthorized. Missing token."
      });
    }

    const token = authHeader.split(" ")[1];

    // If running in Mock Firestore mode, decode mock token for development convenience
    if (isMock) {
      try {
        const decoded = JSON.parse(Buffer.from(token, "base64").toString());
        req.user = decoded;
        return next();
      } catch (e) {
        req.user = { uid: "mock-uid-default", email: "guest@agriscore.com", name: "Guest User" };
        return next();
      }
    }

    // Verify token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Firebase ID Token verification failed:", error.message);
    return res.status(401).json({
      success: false,
      status: 401,
      message: "Unauthorized. Invalid token."
    });
  }
};
