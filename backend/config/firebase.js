const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

let db;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Clean environment variables (removes trailing commas and outer quotes)
const cleanProjectId = (projectId || "").replace(/^["']|["']$/g, "").replace(/,$/, "").trim();
const cleanClientEmail = (clientEmail || "").replace(/^["']|["']$/g, "").replace(/,$/, "").trim();
const cleanPrivateKey = (privateKey || "").replace(/^["']|["']$/g, "").replace(/,$/, "").trim();

const hasCredentials = 
  cleanProjectId && 
  cleanProjectId !== "your-firebase-project-id" &&
  cleanClientEmail && 
  cleanClientEmail.includes("@") &&
  cleanPrivateKey && 
  cleanPrivateKey.length > 50;

if (hasCredentials) {
  try {
    const formattedPrivateKey = cleanPrivateKey.replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: cleanProjectId,
        clientEmail: cleanClientEmail,
        privateKey: formattedPrivateKey,
      }),
    });
    db = admin.firestore();
    console.log("🔥 Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK. Please check credentials:", error.message);
    process.exit(1);
  }
} else {
  console.error("❌ Firebase credentials missing or default placeholder found in backend/.env.");
  process.exit(1);
}

module.exports = {
  db,
  admin
};
