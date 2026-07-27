/**
 * Recommendation Service for AgriScore AI
 * Generates custom agricultural and financial recommendations based on farmer profile signals.
 */

const RECOMMENDATIONS_I18N = {
  en: {
    lowIncome: "Your annual income is low. Explore supplementary incomes such as dairy farming, poultry, or bee-keeping to enhance your financial security.",
    poorCredit: "Poor credit history detected. Prioritize clearing any past defaults, request interest subventions, and avoid taking high-interest informal loans.",
    smallLand: "Small landholding limits farm scale. Form or join a local Farmer Producer Organisation (FPO) to gain collective bargaining power.",
    highDebt: "High existing debt ratio relative to income. Consult with banks to restructure existing credit lines under low-interest institutional programs.",
    missingDocs: "Missing key compliance documents. Complete the document checklist (specifically your Soil Card or Land Registry Passbook) to expedite processing.",
    cropDiversification: "Monoculture warning: Introduce crop diversification (e.g. legumes or oilseeds in rotation) to replenish soil nutrients and reduce price volatility."
  },
  hi: {
    lowIncome: "वार्षिक आय कम है। वित्तीय स्थिरता बढ़ाने के लिए डेयरी पालन, मुर्गी पालन या मधुमक्खी पालन जैसे सहायक व्यवसायों को अपनाएं।",
    poorCredit: "कमजोर क्रेडिट इतिहास। पहले के बकाये को चुकाने को प्राथमिकता दें, ब्याज छूट के लिए बैंक से मिलें और अनौपचारिक ऊंचे ब्याज वाले ऋणों से बचें।",
    smallLand: "छोटी जोत (कम जमीन) होने से पैदावार सीमित होती है। सामूहिक सौदेबाजी की शक्ति और छूट का लाभ उठाने के लिए किसान उत्पादक संगठन (FPO) से जुड़ें।",
    highDebt: "आय की तुलना में कर्ज का बोझ अधिक है। बैंकों से मिलकर सरकारी कम-ब्याज योजनाओं के तहत अपने ऋणों के पुनर्गठन (restructuring) पर बात करें।",
    missingDocs: "जरूरी कागजात अधूरे हैं। बैंक जाने से पहले सॉइल हेल्थ कार्ड या खतौनी जैसे शेष दस्तावेजों को तैयार कर लें ताकि लोन जल्दी पास हो सके।",
    cropDiversification: "फसल विविधता की सलाह: मिट्टी की उर्वरता बढ़ाने और बाजार के उतार-चढ़ाव से बचने के लिए गेहूं-धान के साथ दलहन (दालें) या तिलहन भी उगाएं।"
  },
  bn: {
    lowIncome: "বার্ষিক আয় কম রয়েছে। আর্থিক নিরাপত্তা বাড়াতে দুগ্ধ খামার, হাঁস-মুরগি পালন বা মৌমাছি পালনের মতো অতিরিক্ত আয়ের উৎস অন্বেষণ করুন।",
    poorCredit: "দুর্বল ক্রেডিট রেকর্ড পাওয়া গেছে। অতীতের বকেয়া পরিশোধকে অগ্রাধিকার দিন, সুদ মকুবের জন্য ব্যাংকে যোগাযোগ করুন এবং চড়া সুদের ঋণ এড়িয়ে চলুন।",
    smallLand: "জমির পরিমাণ কম হওয়ায় উৎপাদন সীমিত। সমবায় বা কৃষক উৎপাদক সংগঠনে (FPO) যোগ দিন যাতে যৌথভাবে সার-বীজ কম খরচে পেতে পারেন।",
    highDebt: "আয়ের তুলনায় ঋণের পরিমাণ বেশি। কম সুদের প্রাতিষ্ঠানিক প্রকল্পের অধীনে আপনার ঋণ পুনর্গঠনের জন্য ব্যাংকের সাথে আলোচনা করুন।",
    missingDocs: "প্রয়োজনীয় ব্যাংকিং নথিপত্র অসম্পূর্ণ। লোন প্রক্রিয়া দ্রুত করতে মৃত্তিকা স্বাস্থ্য কার্ড বা জমির পর্চা প্রস্তুত রাখুন।",
    cropDiversification: "শস্য বহুমুখীকরণ: মাটির উর্বরতা রক্ষা করতে এবং বাজারের ঝুঁকি কমাতে শস্য আবর্তনে ডাল বা তৈলবীজ চাষের ব্যবস্থা করুন।"
  }
};

/**
 * Generate actionable insights.
 */
function generateRecommendations({
  farmSize = 1,
  cropType = "",
  annualIncome = 0,
  existingLoans = 0,
  creditHistory = "Good",
  tickedCount = 0,
  lang = "en"
}) {
  const recommendations = [];
  const dict = RECOMMENDATIONS_I18N[lang] || RECOMMENDATIONS_I18N.en;

  const farmSizeNum = parseFloat(farmSize) || 1;
  const income = parseFloat(annualIncome) || 0;
  const loans = parseFloat(existingLoans) || 0;

  // 1. Low Income Heuristics
  if (income < 150000) {
    recommendations.push(dict.lowIncome);
  }

  // 2. Poor Credit History Heuristics
  if (creditHistory === "Poor") {
    recommendations.push(dict.poorCredit);
  }

  // 3. Small Landholding Heuristics
  if (farmSizeNum < 2) {
    recommendations.push(dict.smallLand);
  }

  // 4. High Debt-to-Income Ratio
  if (income > 0 && loans > income * 0.5) {
    recommendations.push(dict.highDebt);
  }

  // 5. Missing Checklist Documents
  if (tickedCount < 5) {
    recommendations.push(dict.missingDocs);
  }

  // 6. Monoculture Crop Diversification Heuristics
  // Suggest crop rotation/diversification for high-depletion monoculture crops (e.g. Rice or Wheat)
  const isMonoculture = ["rice", "wheat", "धान", "गेहूँ", "গম"].includes(cropType.toLowerCase());
  if (isMonoculture || recommendations.length === 0) {
    recommendations.push(dict.cropDiversification);
  }

  return recommendations;
}

module.exports = {
  generateRecommendations
};
