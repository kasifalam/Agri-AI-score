const axios = require("axios");

/**
 * Fallback generator when LLM API is unavailable, missing key, or fails parsing.
 */
function buildFallbackExplanation({ score, risk, language = "English", reasons = [], suggestions = [] }) {
  const isHi = (language || "").toLowerCase().includes("hi") || (language || "").toLowerCase().includes("हिंदी");
  const isBn = (language || "").toLowerCase().includes("bn") || (language || "").toLowerCase().includes("বাংলা");

  if (isHi) {
    return {
      summary: `आपका वर्तमान लोन तैयारी स्कोर 100 में से ${score} है, जो ${risk === "Low" ? "कम" : risk === "Medium" ? "मध्यम" : "अधिक"} जोखिम श्रेणी को दर्शाता है।`,
      scoreExplanation: `यह स्कोर आपके खेत के भौगोलिक संकेतों, पैदावार डेटा और जमा किए गए दस्तावेज़ों के आधार पर नियम-आधारित मूल्यांकन इंजन द्वारा तय किया गया है।`,
      strengths: reasons.filter(r => r.ok).map(r => r.text),
      areasToImprove: reasons.filter(r => !r.ok).map(r => r.text),
      recommendations: suggestions.length > 0 ? suggestions : ["सिंचाई प्रणाली में सुधार करें।", "बैंक के सभी आवश्यक दस्तावेज़ पूरे करें।"],
      priorityActions: [
        { priority: "Immediate", action: "अधूरे कृषि कागज़ात एवं बैंक एनओसी (NOC) पूरे करें।" },
        { priority: "Medium Term", action: "जल संरक्षण एवं फसल बीमा (PMFBY) का लाभ लें।" },
        { priority: "Long Term", action: "मिट्टी की उर्वरता बढ़ाने के लिए सॉइल हेल्थ कार्ड के अनुसार खाद डालें।" }
      ]
    };
  }

  if (isBn) {
    return {
      summary: `আপনার বর্তমান ঋণ প্রস্তুতি স্কোর ১০০ এর মধ্যে ${score}, যা একটি ${risk === "Low" ? "কম" : risk === "Medium" ? "মাঝারি" : "উচ্চ"} ঝুঁকি নির্দেশ করে।`,
      scoreExplanation: `এই স্কোরটি খামারের কৃষি উপাত্ত, ফলন এবং নথিপত্র মূল্যায়নের ওপর ভিত্তি করে নিয়ম-ভিত্তিক ইঞ্জিন দ্বারা তৈরি করা হয়েছে।`,
      strengths: reasons.filter(r => r.ok).map(r => r.text),
      areasToImprove: reasons.filter(r => !r.ok).map(r => r.text),
      recommendations: suggestions.length > 0 ? suggestions : ["সেচ ব্যবস্থার উন্নতি করুন।", "প্রয়োজনীয় ব্যাংকিং নথি সম্পূর্ণ করুন।"],
      priorityActions: [
        { priority: "Immediate", action: "অবশিষ্ট নথিপত্র এবং ব্যাংক প্রমাণপত্র সংগ্রহ করুন।" },
        { priority: "Medium Term", action: "শস্য বিমা প্রকল্পে যুক্ত হন।" },
        { priority: "Long Term", action: "উৎপাদনশীলতা বৃদ্ধি করতে শস্য বহুমুখীকরণ করুন।" }
      ]
    };
  }

  return {
    summary: `Your current loan readiness score is ${score}/100, placing your farm profile in the ${risk || "Medium"} credit risk category.`,
    scoreExplanation: `This assessment score was calculated by AgriScore AI's deterministic scoring engine based on agronomic signals, yield statistics, and document compliance.`,
    strengths: reasons.filter(r => r.ok).map(r => r.text),
    areasToImprove: reasons.filter(r => !r.ok).map(r => r.text),
    recommendations: suggestions.length > 0 ? suggestions : ["Improve irrigation reliability.", "Complete missing document compliance."],
    priorityActions: [
      { priority: "Immediate", action: "Complete missing compliance certificates before applying to a bank." },
      { priority: "Medium Term", action: "Enroll in crop insurance to hedge against rainfall deficits." },
      { priority: "Long Term", action: "Adopt soil health card recommendations to optimize input costs." }
    ]
  };
}

/**
 * Generate AI-powered assessment explanation and recommendations using Gemini / LLM.
 */
async function generateAssessmentExplanation({
  score,
  riskCategory,
  eligibility,
  reasons = [],
  suggestions = [],
  recommendations = [],
  farmData = {},
  documents = {},
  language = "English"
}) {
  const apiKey = (process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || "").replace(/["']/g, "").trim();
  const rawModel = (process.env.LLM_MODEL || "gemini-2.5-flash").replace(/["']/g, "").trim();

  // If no API key is set, return safe structured fallback without erroring
  if (!apiKey || apiKey === "your_llm_api_key_here") {
    console.warn("⚠️ LLM_API_KEY is missing or unconfigured. Returning local safe AI explanation.");
    return buildFallbackExplanation({ score, risk: riskCategory, language, reasons, suggestions });
  }

  const systemInstruction = `You are the AI assistance layer of AgriScore AI, a farmer loan-readiness assessment application.

Your job is to explain an assessment that has ALREADY been calculated by the application's deterministic scoring engine.

CRITICAL RULES:
1. Never calculate, modify, increase, decrease, reinterpret, or override the numerical score or risk category.
2. The score ${score} out of 100 and risk category "${riskCategory}" are strictly fixed and final.
3. Use ONLY the information provided in the assessment context.
4. Never invent missing farmer information, financial information, weather information, soil information, document status, government scheme eligibility, banking policies, loan approval decisions, or other facts.
5. Clearly distinguish between:
   - Existing assessment results.
   - Explanations of those results.
   - General recommendations based on the provided data.
6. If information is missing, explicitly state that it is unavailable.
7. Do NOT claim that AgriScore AI guarantees loan approval.
8. Do NOT present the assessment as an official bank decision.
9. Generate all response text strictly in the requested target language: ${language}.
10. Return the response strictly as valid JSON with the exact requested keys.`;

  const userPrompt = `Target Language for response: ${language}

Assessment Context (Pre-calculated Source of Truth):
- Numerical Score: ${score} / 100
- Risk Category: ${riskCategory}
- Eligibility Status: ${eligibility}
- Assessment Factors & Signals: ${JSON.stringify(reasons)}
- System Suggestions: ${JSON.stringify(suggestions)}
- Additional System Recommendations: ${JSON.stringify(recommendations)}
- Farm Data: ${JSON.stringify(farmData)}
- Uploaded Documents Status: ${JSON.stringify(documents)}

Generate a structured explanation in ${language} adhering strictly to the JSON schema below.

JSON Output Schema:
{
  "summary": "Farmer-friendly concise summary of current loan readiness",
  "scoreExplanation": "Clear explanation of why this exact score of ${score}/100 was generated based strictly on factors",
  "strengths": ["List of 2-4 strong points based on provided signals"],
  "areasToImprove": ["List of 2-4 areas requiring attention based on provided signals"],
  "recommendations": ["List of 3-5 practical, non-hallucinated recommendations based strictly on the data"],
  "priorityActions": [
    { "priority": "Immediate", "action": "Actionable item 1" },
    { "priority": "Medium Term", "action": "Actionable item 2" },
    { "priority": "Long Term", "action": "Actionable item 3" }
  ]
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${rawModel}:generateContent?key=${apiKey}`;

    const response = await axios.post(
      url,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000 // 15s timeout
      }
    );

    const textOutput = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOutput) {
      throw new Error("Empty text payload received from LLM API.");
    }

    const cleanJsonStr = textOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJsonStr);

    if (
      typeof parsed.summary === "string" &&
      typeof parsed.scoreExplanation === "string" &&
      Array.isArray(parsed.strengths) &&
      Array.isArray(parsed.areasToImprove) &&
      Array.isArray(parsed.recommendations) &&
      Array.isArray(parsed.priorityActions)
    ) {
      return parsed;
    } else {
      throw new Error("Parsed LLM JSON does not match required schema structure.");
    }
  } catch (error) {
    console.error("❌ Error calling LLM service or parsing response:", error.message);
    return buildFallbackExplanation({ score, risk: riskCategory, language, reasons, suggestions });
  }
}

/**
 * Extract structured form fields from natural language speech using Gemini / LLM.
 */
async function extractVoiceFormData({ spokenText = "", language = "English" }) {
  const apiKey = (process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || "").replace(/["']/g, "").trim();
  const rawModel = (process.env.LLM_MODEL || "gemini-2.5-flash").replace(/["']/g, "").trim();

  if (!apiKey || apiKey === "your_llm_api_key_here" || !spokenText.trim()) {
    return { extracted: {} };
  }

  const systemInstruction = `You are an expert multi-lingual speech entity extractor for AgriScore AI.
Your job is to parse spoken text from Indian farmers (in English, Hindi, Bengali, Tamil, etc.) and convert it into structured farm assessment parameters.

RULES:
1. Extract ONLY values explicitly stated or clearly implied in the text.
2. Convert word numbers to numeric values (e.g. "five acres" -> 5, "four lakh" -> 400000, "70 quintals" -> 70).
3. Map irrigation terms: "drip" -> "drip", "sprinkler" -> "sprinkler", "tube well" or "canal" or "borewell" -> "canal", "rain" or "barish" -> "rainfed".
4. Map credit history: "good" -> "Good", "medium" -> "Medium", "poor" or "default" -> "Poor".
5. Return JSON strictly. Do NOT invent values.`;

  const userPrompt = `Spoken Text: "${spokenText}"
Language Context: ${language}

Extract structured parameters into the following JSON format:
{
  "farmerName": null or string,
  "village": null or string,
  "district": null or string,
  "state": null or string,
  "farmSize": null or number,
  "cropType": null or string,
  "harvest": null or number,
  "annualIncome": null or number,
  "existingLoans": null or number,
  "requiredLoanAmount": null or number,
  "irrigation": null or string,
  "creditHistory": null or string
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${rawModel}:generateContent?key=${apiKey}`;

    const response = await axios.post(
      url,
      {
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
      },
      { headers: { "Content-Type": "application/json" }, timeout: 10000 }
    );

    const textOutput = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textOutput) {
      const cleanJsonStr = textOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJsonStr);
      return { extracted: parsed };
    }
  } catch (error) {
    console.warn("⚠️ Voice LLM extraction warning:", error.message);
  }

  return { extracted: {} };
}

/**
 * Explain why a pre-verified government scheme is relevant to a farmer.
 */
async function explainSchemeRelevance({ scheme = {}, farmProfile = {}, language = "English" }) {
  const apiKey = (process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || "").replace(/["']/g, "").trim();
  const rawModel = (process.env.LLM_MODEL || "gemini-2.5-flash").replace(/["']/g, "").trim();

  if (!apiKey || apiKey === "your_llm_api_key_here") {
    return {
      explanation: `This scheme aligns with your crop (${farmProfile.crop || "agriculture"}) and landholding scale.`
    };
  }

  const systemInstruction = `You are the AI assistance layer of AgriScore AI.
Explain in 2 concise, practical sentences why the provided government scheme is relevant to this specific farmer profile.
CRITICAL: Use ONLY the provided scheme details. Do NOT invent new eligibility conditions, loan caps, or fake rules.
Respond strictly in ${language}.`;

  const userPrompt = `Scheme Details: ${JSON.stringify(scheme)}
Farmer Profile: ${JSON.stringify(farmProfile)}

Provide a concise 2-sentence explanation in ${language}.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${rawModel}:generateContent?key=${apiKey}`;

    const response = await axios.post(
      url,
      {
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { temperature: 0.3 }
      },
      { headers: { "Content-Type": "application/json" }, timeout: 10000 }
    );

    const textOutput = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textOutput) {
      return { explanation: textOutput.trim() };
    }
  } catch (error) {
    console.warn("⚠️ Scheme LLM explanation warning:", error.message);
  }

  return {
    explanation: `This scheme aligns with your cultivated crop (${farmProfile.crop || "agricultural profile"}) and farm size.`
  };
}

module.exports = {
  generateAssessmentExplanation,
  extractVoiceFormData,
  explainSchemeRelevance
};
