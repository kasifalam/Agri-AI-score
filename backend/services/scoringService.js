/**
 * Scoring Service for AgriScore AI
 * Ported from frontend loanCalculator.js and enhanced with financial scoring factors.
 */

// Irrigation definitions
const IRRIGATION_BONUSES = { drip: 12, sprinkler: 6, canal: 0, rainfed: -12 };
const IRRIGATION_LABELS = {
  en: { drip: "Drip irrigation", sprinkler: "Sprinkler", canal: "Canal / Tube well", rainfed: "Rain-fed only" },
  hi: { drip: "ड्रिप सिंचाई", sprinkler: "स्प्रिंकलर", canal: "नहर / ट्यूबवेल", rainfed: "केवल वर्षा पर निर्भर" },
  bn: { drip: "ড্রিপ সেচ", sprinkler: "স্প্রিঙ্কলার", canal: "খাল / নলকূপ", rainfed: "শুধুমাত্র বৃষ্টির জল" },
  ta: { drip: "சொட்டு நீர் பாசனம்", sprinkler: "தெளிப்பு நீர்", canal: "கால்வாய் / குழாய் கிணறு", rainfed: "மழை சார்ந்தது மட்டும்" },
  te: { drip: "బిందు సేద్యం", sprinkler: "స్ప్రింక్లర్", canal: "కాలువ / బోరు బావి", rainfed: "వర్షాధారం మాత్రమే" },
  mr: { drip: "ठिबक सिंचन", sprinkler: "तुषार सिंचन", canal: "कालवा / कूपनलिका", rainfed: "केवळ पावसावर अवलंबून" },
  gu: { drip: "ટપક સિંચાઈ", sprinkler: "ફુવારા પદ્ધતિ", canal: "કેનાલ / ટ્યુબવેલ", rainfed: "માત્ર વરસાદ આધારિત" },
  pa: { drip: "ਟਪਕ ਸਿੰਚਾਈ", sprinkler: "ਫੁਹਾਰਾ ਸਿੰਚਾਈ", canal: "ਨਹਿਰ / ਟਿਊਬਵੈੱਲ", rainfed: "ਸਿਰਫ ਮੀਂਹ 'ਤੇ ਨਹਿਰ" },
  kn: { drip: "ಹನಿ ನೀರಾವರಿ", sprinkler: "ಚಿಮುಕಿಸುವ ನೀರாவರಿ", canal: "ಕಾಲುವೆ / ಕೊಳವೆ ಬಾವಿ", rainfed: "ಮಳೆ ಆಶ್ರಿತ ಮಾತ್ರ" },
  ml: { drip: "തുള്ളിനന രീതി", sprinkler: "സ്പ്രിംഗ്ലർ", canal: "കനാൽ / കുഴൽക്കിണർ", rainfed: "മഴയെ മാത്രം ആശ്രയിച്ച്" },
  or: { drip: "ଡ୍ରିପ୍ ଜଳସେଚନ", sprinkler: "ସ୍ପ୍ରିଙ୍କଲର", canal: "କେନାଲ / ନଳକୂପ", rainfed: "କେବଳ ବର୍ଷା ନିର୍ଭରଶୀଳ" },
  as: { drip: "টোপাল জলসিঞ্চন", sprinkler: "স্প্ৰিংকলাৰ", canal: "খাল / নলকূপ", rainfed: "কেৱল বৰষুণৰ ওপৰত নিৰ্ভৰশীল" },
  ur: { drip: "ڈرپ آبپاشی", sprinkler: "اسپرنکلر", canal: "نہر / ٹیوب ویل", rainfed: "صرف بارشی پانی" }
};

// Text dictionary for reasons and suggestions
const TEXT_DICT = {
  en: {
    rainOk: "Adequate rainfall zone reduces agricultural credit risk.",
    rainFail: "Rainfall deficit increases credit risk. Water hedging recommended.",
    soilOk: "Soil nutrients are structurally stable.",
    soilFail: "Nutrient depletion detected. Soil Health Card intervention required.",
    ndviOk: "Healthy crop greenness index proves farm productivity.",
    ndviFail: "Sparse/stressed vegetation signature flags potential default risk.",
    yieldOk: "Yield productivity satisfies credit repayment capacity.",
    yieldFail: "Yield capacity below regional bank requirements.",
    irrLow: "Lower credit risk",
    irrHigh: "Increases dry weather exposure",
    docOk: "Fully compliant for KCC",
    docFail: "Missing essential bank prerequisites.",
    sugRain: "Enroll in PM Fasal Bima Yojana (PMFBY) to offset rain deficit default risks.",
    sugSoil: "Apply for a government Soil Health Card to optimize cost on chemical inputs.",
    sugNdvi: "Consult local block officer for crop stress management and recommended seeds.",
    sugYield: "Switch to certified seeds to improve crop density per acre.",
    sugIrr: "Apply for Per Drop More Crop (PDMC) subsidy to transition to drip/sprinkler systems.",
    sugDoc: "Acquire missing compliance document certificates before applying to a bank.",
    sugPerfect: "Maintain credit discipline and farm records — farm profile is loan-ready.",
    rainSignal: "Climate Moisture Signal",
    soilSignal: "Soil Nutrient Verification",
    ndviSignal: "NDVI Biomass Density",
    yieldSignal: "Yield-to-Debt capacity",
    irrLabel: "Irrigation Risk Management",
    docLabel: "Compliance Documentation status",
    docsChecked: "documents ticked"
  },
  hi: {
    rainOk: "आपके इलाके में सही समय पर बारिश होती है, जिससे फसल सूखने का डर बहुत कम है।",
    rainFail: "आपके इलाके में बारिश कम होती है, जिससे फसल को पानी की दिक्कत हो सकती है। पानी देने का कोई पक्का उपाय रखें।",
    soilOk: "आपके खेत की मिट्टी उपजाऊ है, जिससे फसल की पैदावार अच्छी होगी।",
    soilFail: "आपके खेत की मिट्टी में ताकत थोड़ी कम है। मिट्टी की जाँच कराकर सही खाद डालें।",
    ndviOk: "आपके खेत की फसल की हरियाली बहुत अच्छी है, जिससे फसल की पैदावार बढ़िया होने की उम्मीद है।",
    ndviFail: "खेत में फसल की हरियाली कुछ कमजोर दिख रही है, जिससे पैदावार कम होने का डर है। फसल पर थोड़ा ध्यान दें।",
    yieldOk: "आपकी फसल की पैदावार अच्छी है, जिससे आप आसानी से बैंक का लोन चुका पाएंगे।",
    yieldFail: "आपके खेत में फसल की पैदावार अभी थोड़ी कम है, जिससे बैंक से लोन मिलने में दिक्कत आ सकती है।",
    irrLow: "खेत में ड्रिप या स्प्रिंकलर से पानी देने की व्यवस्था होने से फसल सूखने का डर नहीं है।",
    irrHigh: "खेत में पानी देने के नए साधन न होने से सूखे का डर थोड़ा ज्यादा रहता है।",
    docOk: "लोन के लिए जरूरी सभी बैंक कागज़ तैयार हैं।",
    docFail: "बैंक के कुछ जरूरी कागज़ अभी बाकी हैं, उन्हें जल्द तैयार कर लें।",
    sugRain: "सूखे या कम बारिश के नुकसान से बचने के लिए फसल बीमा योजना से फसल का बीमा जरूर करवाएं।",
    sugSoil: "खाद और दवाई का खर्च कम करने के लिए मिट्टी जाँच कार्ड (सॉइल हेल्थ कार्ड) जरूर बनवाएं।",
    sugNdvi: "कमजोर फसल को सुधारने और अच्छे बीजों के लिए गाँव के कृषि सहायक या अधिकारी से सलाह लें।",
    sugYield: "खेत में पैदावार बढ़ाने के लिए सिर्फ सहकारी समिति या भरोसेमंद दुकान के अच्छे बीजों का ही उपयोग करें।",
    sugIrr: "खेत में ड्रिप या फुआरा लगाने के लिए सरकारी योजना की छूट (सब्सिडी) का तुरंत फायदा उठाएं।",
    sugDoc: "बैंक में लोन के लिए जाने से पहले बाकी बचे कागज़ जैसे खतौनी और एनओसी (NOC) तैयार कर लें।",
    sugPerfect: "अपने खेत के कागज़ साफ रखें और बैंक खाते का लेन-देन अच्छा रखें। आपका खेत लोन के लिए बिल्कुल तैयार है।",
    rainSignal: "बारिश और मौसम",
    soilSignal: "मिट्टी की ताकत",
    ndviSignal: "فصل की हरियाली",
    yieldSignal: "पैदावार और कमाई",
    irrLabel: "पानी देने की व्यवस्था",
    docLabel: "लोन के कागज़",
    docsChecked: "कागज़ तैयार हैं"
  },
  bn: {
    rainOk: "পর্যাপ্ত বৃষ্টিপাত অঞ্চল কৃষি ঋণ ঝুঁকি হ্রাস করে।",
    rainFail: "বৃষ্টিপাতের ঘাটতি ঋণ ঝুঁকি বৃদ্ধি করে। জল ধরে রাখার পরামর্শ দেওয়া হচ্ছে।",
    soilOk: "মাটির পুষ্টি উপাদান কাঠামোগতভাবে স্থিতিশীল।",
    soilFail: "পুষ্টির ঘাটতি সনাক্ত করা হয়েছে। মৃত্তিকা স্বাস্থ্য কার্ডের হস্তক্ষেপ প্রয়োজন।",
    ndviOk: "স্বাস্থ্যকর ফসলের সবুজ সূচক খামারের উৎপাদনশীলতা প্রমাণ করে।",
    ndviFail: "স্বল্প/পীড়িত উদ্ভিদের উপস্থিতি সম্ভাব্য খেলাপি ঝুঁকি নির্দেশ করে।",
    yieldOk: "ফলন উৎপাদনশীলতা ঋণ পরিশোধের ক্ষমতা পূরণ করে।",
    yieldFail: "ফলন ক্ষমতা আঞ্চলিক ব্যাংকের প্রয়োজনীয়তার নিচে।",
    irrLow: "কম ঋণ ঝুঁকি",
    irrHigh: "শুষ্ক আবহাওয়ার ঝুঁকি বাড়ায়",
    docOk: "কেসিসি (KCC) এর জন্য সম্পূর্ণ উপযুক্ত",
    docFail: "ব্যাংকের প্রয়োজনীয় মূল নথিপত্র ঘাটতি রয়েছে।",
    sugRain: "বৃষ্টিপাতের ঘাটতিজনিত ডিফল্ট ঝুঁকি কমাতে পিএম ফসল বিমা যোজনায় (PMFBY) নাম লেখান।",
    sugSoil: "রাসায়নিক সারের খরচ কমাতে সরকারি মৃত্তিকা স্বাস্থ্য কার্ডের জন্য আবেদন করুন।",
    sugNdvi: "ফসল চাপ নিয়ন্ত্রণ এবং প্রস্তাবিত বীজের জন্য স্থানীয় ব্লক অফিসারের পরামর্শ নিন।",
    sugYield: "একর প্রতি ফসলের ঘনত্ব উন্নত করতে শংসাপত্রপ্রাপ্ত বীজ ব্যবহার করুন।",
    sugIrr: "ড্রিপ বা স্প্রিঙ্কলার সেচ ব্যবস্থায় রূপান্তরের জন্য 'প্রতি ফোঁটায় বেশি ফসল' (PDMC) ভর্তুকির আবেদন করুন।",
    sugDoc: "ব্যাংকে আবেদন করার আগে প্রয়োজনীয় কমপ্লায়েন্স নথি সংগ্রহ করুন।",
    sugPerfect: "ঋণ শৃঙ্খলা এবং খামারের হিসাব বজায় রাখুন — খামারের প্রোফাইল ঋণের জন্য প্রস্তুত।",
    rainSignal: "জলবায়ু আর্দ্রতা সংকেত",
    soilSignal: "মাটির উর্বরতা যাচাইকরণ",
    ndviSignal: "NDVI বায়োমাস ঘনত্ব",
    yieldSignal: "ঋণ পরিশোধের ক্ষমতা সূচক",
    irrLabel: "সেচ ঝুঁকি ব্যবস্থাপনা",
    docLabel: "কমপ্লায়েন্স নথিপত্র স্থিতি",
    docsChecked: "নথি সম্পূর্ণ হয়েছে"
  }
};

/**
 * Seed generation helper matching the frontend deterministic pseudo-random values.
 */
function seedFromString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function seededValue(seedStr, min, max) {
  const s = seedFromString(seedStr);
  const x = Math.sin(s) * 10000;
  const frac = x - Math.floor(x);
  return Math.round(min + frac * (max - min));
}

/**
 * Core scoring service logic.
 */
function calculateScore({
  location = "",
  crop = "",
  land = 1,
  harvest = 0,
  irrigation = "canal",
  tickedCount = 0,
  weather = null,
  lang = "en",
  annualIncome = 0,
  existingLoans = 0,
  creditHistory = "Good",
  requiredLoanAmount = 0
}) {
  const seedBase = `${location}-${crop}`;
  
  // 1. Agronomic Telemetry Base Signals
  let rainfall = seededValue(seedBase + "-rain", 40, 95);
  let soilQuality = seededValue(seedBase + "-soil", 45, 94);
  let ndvi = seededValue(seedBase + "-ndvi", 45, 95);

  // Weather telemetry adjustments
  if (weather && weather.success) {
    if (weather.rain > 0) {
      rainfall = Math.min(100, rainfall + Math.round(weather.rain * 4));
    } else {
      rainfall = Math.max(30, rainfall - 10);
    }
    if (weather.temp > 35) {
      ndvi = Math.max(35, ndvi - 8);
    }
    soilQuality = Math.min(98, Math.max(30, soilQuality + (weather.humidity > 60 ? 5 : -5)));
  }

  // Harvest Yield calculations
  const landNum = Math.max(0.25, parseFloat(land) || 1);
  const harvestNum = Math.max(0, parseFloat(harvest) || 0);
  const yieldPerAcre = harvestNum / landNum;
  const yieldScore = Math.max(0, Math.min(100, (yieldPerAcre / 30) * 100));

  // Irrigation system credit factor
  const irrBonus = IRRIGATION_BONUSES[irrigation] !== undefined ? IRRIGATION_BONUSES[irrigation] : 0;

  // Base Agronomic Score (0-85 points)
  const baseRaw =
    rainfall * 0.22 +
    soilQuality * 0.20 +
    ndvi * 0.18 +
    yieldScore * 0.20 +
    (50 + irrBonus) * 0.10;

  // Compliance checklist score (0-15 points)
  const docBonus = tickedCount * 3;

  // Agronomic score total (5 - 100)
  let score = Math.max(5, Math.min(100, Math.round(baseRaw + docBonus)));

  // 2. Financial Parameter Adjustments
  // Credit History adjustment
  if (creditHistory === "Good") {
    score = Math.min(100, score + 5);
  } else if (creditHistory === "Poor") {
    score = Math.max(5, score - 15);
  }

  // Debt-to-Income (DTI) Ratio adjustment
  const annualIncomeNum = parseFloat(annualIncome) || 0;
  const existingLoansNum = parseFloat(existingLoans) || 0;
  if (annualIncomeNum > 0) {
    const dti = existingLoansNum / annualIncomeNum;
    if (dti === 0) {
      score = Math.min(100, score + 3);
    } else if (dti > 0.8) {
      score = Math.max(5, score - 20);
    } else if (dti > 0.5) {
      score = Math.max(5, score - 10);
    }
  }

  // Loan-to-Income (LTI) Ratio adjustment
  const reqLoanNum = parseFloat(requiredLoanAmount) || 0;
  if (annualIncomeNum > 0 && reqLoanNum > 0) {
    const lti = reqLoanNum / annualIncomeNum;
    if (lti > 3.0) {
      score = Math.max(5, score - 15);
    } else if (lti > 2.0) {
      score = Math.max(5, score - 8);
    }
  }

  // Cap final score bounds
  score = Math.max(5, Math.min(100, score));

  // Determine Risk Category
  let risk = "High";
  if (score >= 72) risk = "Low";
  else if (score >= 48) risk = "Medium";

  // Determine Eligibility Status
  let eligibility = "Ineligible";
  if (score >= 72) eligibility = "Eligible";
  else if (score >= 48) eligibility = "Conditioned"; // Conditional Approval

  // Build localized reasons and suggestions (falling back to English dictionary)
  const l = TEXT_DICT[lang] || TEXT_DICT.en || TEXT_DICT.hi || TEXT_DICT.bn;
  
  const reasons = [];
  const suggestions = [];

  reasons.push({
    ok: rainfall >= 60,
    text: `${l.rainSignal}: ${rainfall}/100 - ${rainfall >= 60 ? l.rainOk : l.rainFail}`
  });
  reasons.push({
    ok: soilQuality >= 60,
    text: `${l.soilSignal}: ${soilQuality}/100 - ${soilQuality >= 60 ? l.soilOk : l.soilFail}`
  });
  reasons.push({
    ok: ndvi >= 62,
    text: `${l.ndviSignal}: ${ndvi}/100 - ${ndvi >= 62 ? l.ndviOk : l.ndviFail}`
  });
  reasons.push({
    ok: yieldScore >= 50,
    text: `${l.yieldSignal}: ${Math.round(yieldScore)}/100 - ${yieldScore >= 50 ? l.yieldOk : l.yieldFail}`
  });

  const irrLabelTranslated = IRRIGATION_LABELS[lang] ? IRRIGATION_LABELS[lang][irrigation] : IRRIGATION_LABELS.en[irrigation];
  reasons.push({
    ok: irrBonus >= 0,
    text: `${l.irrLabel}: ${irrLabelTranslated} (${irrBonus >= 0 ? l.irrLow : l.irrHigh})`
  });
  reasons.push({
    ok: tickedCount >= 4,
    text: `${l.docLabel}: ${tickedCount}/5 ${l.docsChecked}. (${tickedCount === 5 ? l.docOk : l.docFail})`
  });

  // Base agronomic suggestions
  if (rainfall < 60) suggestions.push(l.sugRain);
  if (soilQuality < 60) suggestions.push(l.sugSoil);
  if (ndvi < 62) suggestions.push(l.sugNdvi);
  if (yieldScore < 50) suggestions.push(l.sugYield);
  if (irrBonus < 6) suggestions.push(l.sugIrr);
  if (tickedCount < 5) suggestions.push(l.sugDoc);
  if (suggestions.length === 0) suggestions.push(l.sugPerfect);

  // Return formatted results
  return {
    score,
    eligibility,
    risk,
    rainfall,
    soilQuality,
    ndvi,
    yieldScore,
    irrObj: {
      id: irrigation,
      label: IRRIGATION_LABELS.en[irrigation],
      bonus: irrBonus
    },
    reasons,
    suggestions
  };
}

module.exports = {
  calculateScore
};
