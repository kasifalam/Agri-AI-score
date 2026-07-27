const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

let db;
let isMock = false;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Check if credentials are present
const hasCredentials = 
  projectId && 
  projectId !== "your-firebase-project-id" &&
  clientEmail && 
  clientEmail.includes("@") &&
  privateKey && 
  privateKey.length > 50;

if (hasCredentials) {
  try {
    const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });
    db = admin.firestore();
    console.log("🔥 Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK. Falling back to Mock Firestore:", error.message);
    setupMockDb();
  }
} else {
  console.warn("⚠️ Firebase credentials missing or default placeholder found in backend/.env. Running in Mock Firestore mode.");
  setupMockDb();
}

function setupMockDb() {
  isMock = true;
  const mockFilePath = path.join(__dirname, "../scratch/mock_firestore.json");
  
  // Ensure scratch directory exists
  const scratchDir = path.dirname(mockFilePath);
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  // Load existing mock database if available
  let mockData = {};
  if (fs.existsSync(mockFilePath)) {
    try {
      mockData = JSON.parse(fs.readFileSync(mockFilePath, "utf8"));
    } catch (e) {
      mockData = {};
    }
  } else {
    fs.writeFileSync(mockFilePath, JSON.stringify({}, null, 2), "utf8");
  }

  const saveMockData = () => {
    fs.writeFileSync(mockFilePath, JSON.stringify(mockData, null, 2), "utf8");
  };

  // Mock Firestore API builder
  db = {
    collection: (collectionName) => {
      if (!mockData[collectionName]) {
        mockData[collectionName] = {};
        saveMockData();
      }

      return {
        // Add a document (auto-generated ID)
        add: async (docData) => {
          const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          const timestamp = new Date().toISOString();
          const docWithMeta = { id, ...docData, createdAt: timestamp, updatedAt: timestamp };
          mockData[collectionName][id] = docWithMeta;
          saveMockData();
          return { id, get: async () => ({ id, exists: true, data: () => docWithMeta }) };
        },

        // Get all documents in collection
        get: async () => {
          const docs = Object.values(mockData[collectionName]).map((doc) => ({
            id: doc.id,
            exists: true,
            data: () => doc,
          }));
          return { docs };
        },

        // Reference specific document
        doc: (docId) => {
          return {
            get: async () => {
              const doc = mockData[collectionName][docId];
              return {
                id: docId,
                exists: !!doc,
                data: () => doc,
              };
            },
            set: async (docData, options) => {
              const timestamp = new Date().toISOString();
              const existing = mockData[collectionName][docId] || {};
              let merged = { ...existing, ...docData, updatedAt: timestamp };
              if (options && options.merge === false) {
                merged = { id: docId, ...docData, createdAt: timestamp, updatedAt: timestamp };
              }
              mockData[collectionName][docId] = merged;
              saveMockData();
              return true;
            },
            update: async (docData) => {
              const doc = mockData[collectionName][docId];
              if (!doc) {
                throw new Error("Document not found");
              }
              mockData[collectionName][docId] = { ...doc, ...docData, updatedAt: new Date().toISOString() };
              saveMockData();
              return true;
            },
            delete: async () => {
              if (mockData[collectionName][docId]) {
                delete mockData[collectionName][docId];
                saveMockData();
                return true;
              }
              return false;
            },
          };
        },
      };
    },
  };
}

module.exports = { db, isMock };
