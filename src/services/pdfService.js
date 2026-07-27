import { jsPDF } from "jspdf";
import { STRINGS, IRRIGATION_I18N, getLocalizedCrop, getLocalizedLocation } from "./translationService";
import { computeScore } from "../utils/loanCalculator";

// Dictionary of PDF layout terms for all 13 languages to prevent fallback translation leakages.
const pdfTranslations = {
  en: {
    reportTitle: "Farmer Credit & Loan Readiness Evaluation Report",
    secProfile: "1. FARMER & LAND PROFILE",
    secCredit: "2. CREDIT ASSESSMENTS & RISK PROFILE",
    secXAI: "3. EXPLAINABLE AI (XAI) CREDIT SIGNALS DIAGNOSTICS",
    secDocs: "4. REGIONAL BANK DOCUMENT & COMPLIANCE STATS",
    secRoadmap: "5. PERSONALIZED CREDIT SCORE IMPROVEMENT ROADMAP",
    lblFarmerName: "Farmer Name:",
    lblLocation: "Location / District:",
    lblEmail: "Farmer Email:",
    lblCrop: "Cultivated Crop:",
    lblArea: "Cultivated Area:",
    lblIrrigation: "Irrigation System:",
    lblHarvest: "Recent Harvest:",
    lblScoreTitle: "LOAN READINESS SCORE",
    lblSuitability: "CREDIT SUITABILITY STATUS",
    lblVerified: "[VERIFIED]",
    lblPending: "[PENDING]",
    lblPass: "[PASS]",
    lblWarn: "[WARN]",
    lblWeatherTelemetry: "Linked Weather Geocoding Telemetry",
    region: "Region",
    disclaimer: "Disclaimer: AgriScore AI acts as an advisory underwriting assistant. Final loan sanctioning remains at the sole discretion of the bank.",
    footerHackathon: "AgriScore AI · Developed for BRAINWAVE 2026 National Hackathon",
    strong: "Strong baseline. Recommended for fast-track credit approval.",
    moderate: "Moderate credit metrics. Approvals subject to water management verification.",
    weak: "High production volatility. Credit enhancement required."
  },  hi: {
    reportTitle: "लोन सहायता रिपोर्ट",
    secProfile: "1. किसान और खेत का ब्योरा",
    secCredit: "2. लोन की जाँच और जोखिम रिपोर्ट",
    secXAI: "3. आपका लोन स्कोर ऐसा क्यों है? (मुख्य कारण)",
    secDocs: "4. लोन के जरूरी कागज़ और उनकी तैयारी",
    secRoadmap: "5. लोन स्कोर बढ़ाने की सलाह",
    lblFarmerName: "किसान का नाम:",
    lblLocation: "गाँव / जिला:",
    lblEmail: "ईमेल:",
    lblCrop: "बोई गई फसल:",
    lblArea: "कुल ज़मीन (एकड़ में):",
    lblIrrigation: "पानी देने का साधन:",
    lblHarvest: "पिछली पैदावार (क्विंटल):",
    lblScoreTitle: "लोन स्कोर",
    lblSuitability: "लोन मिलने की संभावना",
    lblVerified: "[कागज़ तैयार है]",
    lblPending: "[कागज़ बाकी है]",
    lblPass: "अच्छा",
    lblWarn: "सुधार की ज़रूरत",
    lblWeatherTelemetry: "खेत के मौसम का हाल",
    region: "गाँव / जिला",
    disclaimer: "जरूरी बात: यह रिपोर्ट सिर्फ आपकी लोन की तैयारी समझने के लिए है। लोन देने का अंतिम फैसला पूरी तरह बैंक का होगा।",
    footerHackathon: "एग्रीस्कोर एआई — किसानों के लिए आसान लोन सहायक ऐप",
    strong: "आपके खेत की स्थिति बहुत अच्छी है। बैंक से आसानी से लोन मिलने की पूरी संभावना है।",
    moderate: "खेत की स्थिति ठीक-ठाक है। अगर आप पानी देने का पक्का साधन और जरूरी कागज़ तैयार कर लें, तो लोन मिल जाएगा।",
    weak: "अभी लोन मिलने में थोड़ी मुश्किल हो सकती है। लोन स्कोर बढ़ाने के लिए नीचे दी गई सलाहों को देखें।"
  },
  bn: {
    reportTitle: "কৃষক ঋণ এবং ঋণ যোগ্যতা মূল্যায়ন রিপোর্ট",
    secProfile: "১. কৃষক এবং জমির প্রোফাইল",
    secCredit: "২. ক্রেডিট মূল্যায়ন এবং ঝুঁকি প্রোফাইল",
    secXAI: "৩. এক্সপ্লেনেবল এআই (XAI) ক্রেডিট সিগন্যাল ডায়াগনস্টিকস",
    secDocs: "৪. আঞ্চলিক ব্যাংক নথি এবং কমপ্লায়েন্স স্থিতি",
    secRoadmap: "৫. ব্যক্তিগত ক্রেডিট স্কোর উন্নতির রোডম্যাপ",
    lblFarmerName: "কৃষকের নাম:",
    lblLocation: "অবস্থান / জেলা:",
    lblEmail: "কৃষক ইমেল:",
    lblCrop: "চাষকৃত ফসল:",
    lblArea: "চাষের জমি:",
    lblIrrigation: "সেচ পদ্ধতি:",
    lblHarvest: "সাম্প্রতিক ফসল:",
    lblScoreTitle: "ঋণ যোগ্যতা স্কোর",
    lblSuitability: "ঋণ উপযুক্ততা স্থিতি",
    lblVerified: "[যাচাইকৃত]",
    lblPending: "[लंबित]",
    lblPass: "[উত্তীর্ণ]",
    lblWarn: "[সতর্কতা]",
    lblWeatherTelemetry: "সংযুক্ত আবহাওয়া জিওকোडिंग টেলিমেট্রি",
    region: "অঞ্চল",
    disclaimer: "দাবিত্যাগ: এগ্রিস্কোর এআই একটি পরামর্শমূলক আন্ডাররাইটিং সহকারী হিসেবে কাজ করে। চূড়ান্ত ঋণ অনুমোদন ব্যাংকের সম্পূর্ণ বিবেচনার ওপর নির্ভর করে।",
    footerHackathon: "এগ্রিস্কোর এআই · ব্রেইনওয়েভ ২০২৬ জাতীয় হ্যাকাথনের জন্য তৈরি",
    strong: "শক্তিশালী ভিত্তি। দ্রুত ঋণ অনুমোদনের জন্য প্রস্তাবিত।",
    moderate: "মাঝারি ক্রেডিট সূচক। জল সেচ যাচাই সাপেক্ষে অনুমোদন করা হবে।",
    weak: "উচ্চ উৎপাদন অস্থিরতা। অতিরিক্ত ক্রেডিট নিশ্চয়তা প্রয়োজন।"
  },
  ta: {
    reportTitle: "விவசாயி கடன் தகுதி மதிப்பீட்டு அறிக்கை",
    secProfile: "1. விவசாயி மற்றும் நில சுயவிவரம்",
    secCredit: "2. கடன் மதிப்பீடுகள் மற்றும் அபாய சுயவிவரம்",
    secXAI: "3. விளக்கக்கூடிய ஏஐ (XAI) கடன் சமிக்ஞை பகுப்பாய்வு",
    secDocs: "4. பிராந்திய வங்கி ஆவணங்கள் மற்றும் இணக்க நிலவரம்",
    secRoadmap: "5. தனிப்பயனாக்கப்பட்ட கடன் தகுதி மேம்பாட்டு வழிகாட்டி",
    lblFarmerName: "விவசாயி பெயர்:",
    lblLocation: "இடம் / மாவட்டம்:",
    lblEmail: "மின்னஞ்சல் முகவரி:",
    lblCrop: "சாகுபடி பயிர்:",
    lblArea: "சாகுபடி பரப்பளவு:",
    lblIrrigation: "பாசன முறை:",
    lblHarvest: "சமீபத்திய அறுவடை:",
    lblScoreTitle: "கடன் தகுதி மதிப்பெண்",
    lblSuitability: "கடன் தகுதி நிலைமை",
    lblVerified: "[சரிபார்க்கப்பட்டது]",
    lblPending: "[நிலுவையில் உள்ளது]",
    lblPass: "[வெற்றி]",
    lblWarn: "[எச்சரிக்கை]",
    lblWeatherTelemetry: "இணைக்கப்பட்ட வானிலை இருப்பிடத் தரவு",
    region: "வட்டாரம்",
    disclaimer: "பொறுப்புத் துறப்பு: அகிரிஸ்கோர் ஏஐ என்பது ஒரு கடன் மதிப்பீட்டு உதவியாளர் மட்டுமே. இறுதி கடன் ஒப்புதல் வங்கியின் முழு அதிகாரத்திற்கு உட்பட்டது.",
    footerHackathon: "அகிரிஸ்கோர் ஏஐ · பிரைன்வேவ் 2026 தேசிய ஹேக்கத்தானுக்காக உருவாக்கப்பட்டது",
    strong: "வலுவான தகுதி. விரைவான கடன் ஒப்புதலுக்கு பரிந்துரைக்கப்படுகிறது.",
    moderate: "நடுத்தர கடன் தகுதி. நீர் மேலாண்மை சரிபார்ப்புக்கு உட்பட்டது.",
    weak: "அதிக உற்பத்தி ஏற்ற இறக்கம். கடன் மேம்பாடு தேவைப்படுகிறது."
  },
  te: {
    reportTitle: "రైతు రుణ అర్హత అంచనా నివేదిక",
    secProfile: "1. రైతు మరియు భూమి ప్రొఫైల్",
    secCredit: "2. రుణ అంచనాలు మరియు ప్రమాద ప్రొఫైల్",
    secXAI: "3. వివరించదగిన ఏఐ (XAI) రుణ సంకేతాల విశ్లేషణ",
    secDocs: "4. ప్రాంతీయ బ్యాంక్ పత్రాలు మరియు నిబంధనల స్థితి",
    secRoadmap: "5. రుణ అర్హత మెరుగుదల ప్రణాళిక",
    lblFarmerName: "రైతు పేరు:",
    lblLocation: "గ్రామం / జిల్లా:",
    lblEmail: "రైతు ఈమెయిల్:",
    lblCrop: "సాగు పంట:",
    lblArea: "సాగు భూమి పరిమాణం:",
    lblIrrigation: "నీటిపారుదల వ్యవస్థ:",
    lblHarvest: "ఇటీవలి పంట దిగుబడి:",
    lblScoreTitle: "రుణ అర్హత స్కోరు",
    lblSuitability: "రుణ అర్హత స్థితి",
    lblVerified: "[ధృవీకరించబడింది]",
    lblPending: "[ప్రక్రియలో ఉంది]",
    lblPass: "[సఫలం]",
    lblWarn: "[హెచ్చరిక]",
    lblWeatherTelemetry: "వాతావరణ వివరాల అనుసంధానం",
    region: "ప్రాంతం",
    disclaimer: "గమనిక: అగ్రిస్కోర్ ఏఐ కేవలం అంచనా సహాయకుడు మాత్రమే. రుణ మంజూరు పూర్తిగా బ్యాంక్ నిర్ణయంపై ఆధారపడి ఉంటుంది.",
    footerHackathon: "అగ్రిస్కోర్ ఏఐ · బ్రెయిన్‌వేవ్ 2026 జాతీయ హ్యాకథాన్ కొరకు అభివృద్ధి చేయబడింది",
    strong: "బలమైన స్కోరు. వేగవంతమైన రుణ ఆమోదం కోసం సిఫార్సు చేయబడింది.",
    moderate: "మధ్యస్థ రుణ సూచికలు. నీటి నిర్వహణ వెరిఫికేషన్‌కు లోబడి ఉంటుంది.",
    weak: "ఎక్కువ దిగుబడి అస్థిరత. అదనపు హామీలు అవసరం."
  },
  mr: {
    reportTitle: "शेतकरी कर्ज पात्रता मूल्यमापन अहवाल",
    secProfile: "1. शेतकरी आणि जमीन तपशील",
    secCredit: "2. कर्ज मूल्यमापन आणि जोखीम अहवाल",
    secXAI: "3. एक्सप्लेनेबल एआय (XAI) क्रेडिट सिग्नल विश्लेषण",
    secDocs: "4. बँक दस्तऐवज आणि अनुपालन स्थिती",
    secRoadmap: "5. वैयक्तिक कर्ज पात्रता सुधारणा मार्गदर्शक",
    lblFarmerName: "शेतकऱ्याचे नाव:",
    lblLocation: "गाव / जिल्हा:",
    lblEmail: "शेतकरी ईमेल:",
    lblCrop: "लागवड केलेले पीक:",
    lblArea: "लागवडीखालील जमीन:",
    lblIrrigation: "सिंचन पद्धत:",
    lblHarvest: "अलीकडील उत्पादन:",
    lblScoreTitle: "कर्ज पात्रता स्कोअर",
    lblSuitability: "कर्ज पात्रता स्थिती",
    lblVerified: "[सत्यापित]",
    lblPending: "[प्रलंबित]",
    lblPass: "[यशस्वी]",
    lblWarn: "[इशारा]",
    lblWeatherTelemetry: "हवामान डेटा जोडणी",
    region: "विभाग",
    disclaimer: "जबाबदारी नाकारणे: अॅग्रीस्कोर एआय केवळ मूल्यमापनासाठी सहाय्यक आहे. अंतिम कर्ज मंजूर करणे पूर्णपणे बँकेच्या अधिकारात आहे.",
    footerHackathon: "अॅग्रीस्कोर एआय · ब्रेनवेव्ह २०२६ राष्ट्रीय हॅकाथॉनसाठी विकसित",
    strong: "भक्कम स्कोअर. त्वरित कर्ज मंजुरीसाठी शिफारस केली जाते.",
    moderate: "मध्यम कर्ज निकष. सिंचन पद्धतींच्या पडताळणीच्या अधीन मंजुरी.",
    weak: "जास्त उत्पादन अस्थिरता. अतिरिक्त कर्ज हमी आवश्यक आहे."
  },
  gu: {
    reportTitle: "ખેડૂત લોન યોગ્યતા મૂલ્યાંકન અહેવાલ",
    secProfile: "1. ખેડૂત અને જમીનની વિગત",
    secCredit: "2. લોન મૂલ્યાંકન અને જોખમ વિગત",
    secXAI: "3. એક્સપ્લેનેબલ એઆઈ (XAI) ક્રેડિટ સિગ્નલ વિશ્લેષણ",
    secDocs: "4. બેંક દસ્તાવેજ અને અનુપાલન સ્થિતિ",
    secRoadmap: "5. લોન યોગ્યતા સુધારણા માર્ગદર્શિકા",
    lblFarmerName: "ખેડૂતનું નામ:",
    lblLocation: "ગામ / જિલ્લો:",
    lblEmail: "ખેડૂત ઈમેલ:",
    lblCrop: "ખેડેલો પાક:",
    lblArea: "ખેડાણ હેઠળની જમીન:",
    lblIrrigation: "સિંચાઈ પદ્ધતિ:",
    lblHarvest: "તાજેતરનું ઉત્પાદન:",
    lblScoreTitle: "લોન યોગ્યતા સ્કોર",
    lblSuitability: "લોન પાત્રતા સ્થિતિ",
    lblVerified: "[ચકાસાયેલ]",
    lblPending: "[બાકી]",
    lblPass: "[પાસ]",
    lblWarn: "[ચેતવણી]",
    lblWeatherTelemetry: "હવામાન કનેક્શન ટેલીમેટ્રી",
    region: "પ્રદેશ",
    disclaimer: "ડિસ્ક્લેમર: એગ્રીસ્કોર એઆઈ માત્ર સલાહકાર મૂલ્યાંકન સહાયક છે. લોન મંજૂરીનો અંતિમ નિર્ણય સંપૂર્ણપણે બેંકના હાથમાં છે.",
    footerHackathon: "એગ્રીસ્કોર એઆઈ · બ્રેઈનવેવ ૨૦૨૬ રાષ્ટ્રીય હેકાથોન માટે વિકસિત",
    strong: "મજબૂત સ્કોર. ઝડપી લોન મંજૂરી માટે ભલામણ પાત્ર.",
    moderate: "મધ્યમ ક્રેડિટ માપદંડ. સિંચાઈ ચકાસણીને આધીન લોન મંજૂરી.",
    weak: "વધુ પાક જોખમ. વધારાની સુરક્ષા આવશ્યક છે."
  },
  pa: {
    reportTitle: "ਕਿਸਾਨ ਲੋਨ ਯੋਗਤਾ ਮੁਲਾਂਕਣ ਰਿਪੋਰਟ",
    secProfile: "1. ਕਿਸਾਨ ਅਤੇ ਜ਼ਮੀਨ ਦਾ ਵੇਰਵਾ",
    secCredit: "2. ਲੋਨ ਮੁਲਾਂਕਣ ਅਤੇ ਜੋਖਮ ਪ੍ਰੋਫਾਈਲ",
    secXAI: "3. ਐਕਸਪਲੇਨੇਬਲ ਏਆਈ (XAI) ਕ੍ਰੈਡਿਟ ਸਿਗਨਲ ਵਿਸ਼ਲੇਸ਼ਣ",
    secDocs: "4. ਬੈਂਕ ਦਸਤਾਵੇਜ਼ ਅਤੇ ਪਾਲਣਾ ਸਥਿਤੀ",
    secRoadmap: "5. ਲੋਨ ਯੋਗਤਾ ਸੁਧਾਰ ਯੋਜਨਾ",
    lblFarmerName: "ਕਿਸਾਨ ਦਾ ਨਾਮ:",
    lblLocation: "ਪਿੰਡ / ਜ਼ਿਲ੍ਹਾ:",
    lblEmail: "ਕਿਸਾਨ ਈਮੇਲ:",
    lblCrop: "ਬੀਜੀ ਗਈ ਫਸਲ:",
    lblArea: "ਖੇਤੀਯੋਗ ਜ਼ਮੀਨ:",
    lblIrrigation: "ਸਿੰਚਾਈ ਪ੍ਰਣਾਲੀ:",
    lblHarvest: "ਹਾਲੀਆ ਪੈਦਾਵਾਰ:",
    lblScoreTitle: "ਲੋਨ ਯੋਗਤਾ ਸਕੋਰ",
    lblSuitability: "ਲੋਨ ਪਾਤਰਤਾ ਸਥਿਤੀ",
    lblVerified: "[ਪ੍ਰਮਾਣਿਤ]",
    lblPending: "[ਬਾਕੀ ਹੈ]",
    lblPass: "[ਪਾਸ]",
    lblWarn: "[ਚੇਤਾਵਨੀ]",
    lblWeatherTelemetry: "ਮੌਸਮ ਡੇਟਾ ਕਨੈਕਸ਼ਨ",
    region: "ਖੇਤਰ",
    disclaimer: "ਬੇਦਾਅਵਾ: ਐਗਰੀਸਕੋਰ ਏਆਈ ਸਿਰਫ ਇੱਕ ਮੁਲਾਂਕਣ ਸਹਾਇਕ ਹੈ। ਲੋਨ ਮਨਜ਼ੂਰ ਕਰਨ ਦਾ ਆਖਰੀ ਫੈਸਲਾ ਪੂਰੀ ਤਰ੍ਹਾਂ ਬੈਂਕ ਦੇ ਅਧਿਕਾਰ ਵਿੱਚ ਹੈ।",
    footerHackathon: "ਐਗਰੀਸਕੋਰ ਏਆਈ · ਬ੍ਰੇਨਵੇਵ 2026 ਰਾਸ਼ਟਰੀ ਹੈਕਾਥੌਨ ਲਈ ਤਿਆਰ ਕੀਤਾ ਗਿਆ",
    strong: "ਮਜ਼ਬੂਤ ਸਕੋਰ। ਤੇਜ਼ੀ ਨਾਲ ਲੋਨ ਮਨਜ਼ੂਰੀ ਲਈ ਸਿਫਾਰਸ਼ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।",
    moderate: "ਦਰਮਿਆਨੇ ਕ੍ਰੈਡਿਟ ਪੈਰਾਮੀਟਰ। ਪਾਣੀ ਪ੍ਰਬੰਧਨ ਦੀ ਜਾਂਚ ਦੇ ਅਧੀਨ ਲੋਨ।",
    weak: "ਵੱਧ ਉਤਪਾਦਨ ਜੋਖਮ। ਵਾਧੂ ਕ੍ਰੈਡਿਟ ਗਾਰੰਟੀ ਦੀ ਲੋੜ ਹੈ।"
  },
  kn: {
    reportTitle: "ರೈತ ಸಾಲ ಅರ್ಹತೆ ಮೌಲ್ಯಮಾಪನ ವರದಿ",
    secProfile: "1. ರೈತ ಮತ್ತು ಭೂಮಿ ಪ್ರೊಫೈಲ್",
    secCredit: "2. ಸಾಲ ಮೌಲ್ಯಮಾಪನ ಮತ್ತು ಅಪಾಯದ ಪ್ರೊಫೈಲ್",
    secXAI: "3. ವಿವರಿಸಬಹುದಾದ ಏಐ (XAI) ಸಾಲದ ಸಂಕೇತಗಳ ವಿಶ್ಲೇಷಣೆ",
    secDocs: "4. ಬ್ಯಾಂಕ್ ದಾಖಲೆಗಳು ಮತ್ತು ಅನುಸರಣೆ ಸ್ಥಿತಿ",
    secRoadmap: "5. ಸಾಲದ ಅರ್ಹತೆ ಸುಧಾರಣಾ ಮಾರ್ಗಸೂಚಿ",
    lblFarmerName: "ರೈತನ ಹೆಸರು:",
    lblLocation: "ಗ್ರಾಮ / ಜಿಲ್ಲೆ:",
    lblEmail: "ರೈತ ಇಮೇಲ್:",
    lblCrop: "ಬೆಳೆದ ಬೆಳೆ:",
    lblArea: "ಸಾಗುವಳಿ ಭೂಮಿ ಗಾತ್ರ:",
    lblIrrigation: "ನೀರಾವರಿ ವ್ಯವಸ್ಥೆ:",
    lblHarvest: "ಇತ್ತೀಚಿನ ಇಳುವರಿ:",
    lblScoreTitle: "ಸಾಲ ಅರ್ಹತೆ ಸ್ಕೋರ್",
    lblSuitability: "ಸಾಲ ಅರ್ಹತೆ ಸ್ಥಿತಿ",
    lblVerified: "[ಪರಿಶೀಲಿಸಲಾಗಿದೆ]",
    lblPending: "[ಬಾಕಿ ಇದೆ]",
    lblPass: "[ಉತ್ತೀರ್ಣ]",
    lblWarn: "[ಎಚ್ಚರಿಕೆ]",
    lblWeatherTelemetry: "ಹವಾಮಾನ ಮಾಹಿತಿ ಲಿಂಕ್",
    region: "ಪ್ರದೇಶ",
    disclaimer: "ಹಕ್ಕು ನಿರಾಕರಣೆ: ಅಗ್ರಿಸ್ಕೋರ್ ಏಐ ಕೇವಲ ಸಾಲ ಸಹಾಯಕರಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ. ಅಂತಿಮ ಸಾಲ ಮಂಜೂರಾತಿ ಬ್ಯಾಂಕಿನ ವಿವೇಚನೆಗೆ ಸೇರಿದ್ದು.",
    footerHackathon: "ಅಗ್ರಿಸ್ಕೋರ್ ಏಐ · ಬ್ರೈನ್‌ವೇವ್ 2026 ರಾಷ್ಟ್ರೀಯ ಹ್ಯಾಕಥಾನ್‌ಗಾಗಿ ಅಭಿವೃದ್ಧಿಪಡಿಸಲಾಗಿದೆ",
    strong: "ಬಲವಾದ ಸ್ಕೋರ್. ತ್ವರಿತ ಸಾಲ ಅನುಮೋದನೆಗೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.",
    moderate: "ಮಧ್ಯಮ ಸಾಲದ ಸೂಚ್ಯಂಕಗಳು. ನೀರಾವರಿ ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಒಳಪಟ್ಟು ಅನುಮೋದನೆ.",
    weak: "ಹೆಚ್ಚಿನ ಇಳುವರಿ ಅಸ್ಥಿರತೆ. ಹೆಚ್ಚುವರಿ ಸಾಲದ ಭರವಸೆ ಅಗತ್ಯವಿದೆ."
  },
  ml: {
    reportTitle: "കർഷക വായ്പ യോഗ്യത വിലയിരുത്തൽ റിപ്പോർട്ട്",
    secProfile: "1. കർഷകനും കൃഷിയിടവും",
    secCredit: "2. വായ്പ വിലയിരുത്തലും റിസ്ക് പ്രൊഫൈലും",
    secXAI: "3. വിശദീകരിക്കാവുന്ന എഐ (XAI) വായ്പ വിവര വിശകലനം",
    secDocs: "4. ബാങ്ക് രേഖകളും യോഗ്യത പരിശോധന നിലയും",
    secRoadmap: "5. വായ്പ യോഗ്യത മെച്ചപ്പെടുത്തൽ മാർഗ്ഗരേഖ",
    lblFarmerName: "കർഷകന്റെ പേര്:",
    lblLocation: "ഗ്രാമം / ജില്ല:",
    lblEmail: "ഇമെയിൽ വിലാസം:",
    lblCrop: "കൃഷി ചെയ്ത വിള:",
    lblArea: "കൃഷിസ്ഥലത്തിന്റെ അളവ്:",
    lblIrrigation: "ജലസേചന രീതി:",
    lblHarvest: "അടുത്തകാലത്തെ വിളവ്:",
    lblScoreTitle: "വായ്പ യോഗ്യത സ്കോർ",
    lblSuitability: "വായ്പ യോഗ്യത നില",
    lblVerified: "[സ്ഥിരീകരിച്ചു]",
    lblPending: "[അപൂർണ്ണം]",
    lblPass: "[പാസ്സായി]",
    lblWarn: "[മുന്നറിയിപ്പ്]",
    lblWeatherTelemetry: "കാലാവസ്ഥ വിവരങ്ങളുമായി ബന്ധിപ്പിച്ചിരിക്കുന്നു",
    region: "പ്രദേശം",
    disclaimer: "ബാധ്യതാനിരാകരണം: അഗ്രിസ്കോർ എഐ ഒരു വിലയിരുത്തൽ സഹായി മാത്രമാണ്. അന്തിമ വായ്പ അനുമതി ബാങ്കിന്റെ വിവേചനാധികാരത്തിലാണ്.",
    footerHackathon: "അഗ്രിസ്കോർ എഐ · ബ്രെയിൻവേവ് 2026 ദേശീയ ഹാക്കത്തോണിനായി വികസിപ്പിച്ചത്",
    strong: "മികച്ച സ്കോർ. വേഗത്തിലുള്ള വായ്പ അനുമതിക്കായി ശുപാർശ ചെയ്യുന്നു.",
    moderate: "മിതമായ വായ്പ സൂചകങ്ങൾ. ജലസേചന പരിശോധനയ്ക്ക് വിധേയമായി അനുമതി നൽകും.",
    weak: "ഉയർന്ന ഉൽപ്പാദന റിസ്ക്. അധിക വായ്പ സുരക്ഷകൾ ആവശ്യമാണ്."
  },
  or: {
    reportTitle: "କୃଷକ ଋଣ ଯୋଗ୍ୟତା ମୂଲ୍ୟାଙ୍କନ ରିପୋର୍ଟ",
    secProfile: "1. କୃଷକ ଏବଂ ଜମିର ବିବରଣୀ",
    secCredit: "2. ଋଣ ଆକଳନ ଏବଂ ବିପଦ ପ୍ରୋଫାଇଲ୍",
    secXAI: "3. ବ୍ୟାଖ୍ୟାଯୋଗ୍ୟ ଏଆଇ (XAI) ଋଣ ସୂଚକର ଆକଳନ",
    secDocs: "4. ବ୍ୟାଙ୍କ ଦସ୍ତାବିଜ ଏବଂ ଅନୁପାଳନ ସ୍ଥିତି",
    secRoadmap: "5. ବ୍ୟକ୍ତିଗତ ଋଣ ଯୋଗ୍ୟତା ସୁଧାର ମାର୍ଗଚିତ୍ର",
    lblFarmerName: "କୃଷକଙ୍କ ନାମ:",
    lblLocation: "ଗାଁ / ଜିଲ୍ଲା:",
    lblEmail: "ଇମେଲ୍ ଆଇଡି:",
    lblCrop: "ଚାଷ କରିଥିବା ଫସଲ:",
    lblArea: "ଚାଷ ଜମିର ପରିମାଣ:",
    lblIrrigation: "ଜଳସେଚନ ପ୍ରଣାଳୀ:",
    lblHarvest: "ନିକଟତମ ଅମଳ:",
    lblScoreTitle: "ଋଣ ଯୋଗ୍ୟତା ସ୍କୋର",
    lblSuitability: "ଋଣ ଉପଯୁକ୍ତତା ସ୍ଥିତି",
    lblVerified: "[ଯାଞ୍ଚ ହୋଇଛି]",
    lblPending: "[ବାକି ଅଛି]",
    lblPass: "[ସଫଳ]",
    lblWarn: "[ସତର୍କତା]",
    lblWeatherTelemetry: "ପାଣିପାଗ ତଥ୍ୟର ସଂଯୋਗ",
    region: "ଅଞ୍ଚଳ",
    disclaimer: "ଅସ୍ୱୀକାରନାମା: ଅଗ୍ରିସ୍କୋର ଏଆଇ କେବଳ ପରାମର୍ଶଦାତା ଆକଳନ ସହାୟକ ଅଟେ। ଋଣ ମଞ୍ଜୁର କରିବା ସମ୍ପୂର୍ଣ୍ଣ ରୂପେ ବ୍ୟାଙ୍କର ନିଷ୍ପତ୍ତି ଅଟେ ।",
    footerHackathon: "ଅଗ୍ରିସ୍କୋର ଏଆଇ · ବ୍ରେନୱେଭ୍ ୨୦୨୬ ଜାତୀୟ ହାକାଥନ୍ ପାଇଁ ବିକଶିତ",
    strong: "ଉତ୍ତମ ସ୍କୋର । ଶୀଘ୍ର ଋଣ ମଞ୍ଜୁର ପାଇଁ ଅନୁମୋଦିତ ।",
    moderate: "ମଧ୍ୟମ ଋଣ ମାପଦଣ୍ଡ । ଜଳ ପରିଚାଳନା ଯାଞ୍ચ ସାପେକ୍ଷ ମଞ୍ջୁର ।",
    weak: "ଅଧିକ ଫସଲ ଅସ୍ଥିରତା । ଅଧିକ କ୍ରେଡିଟ୍ ଗ୍ୟାରେଣ୍ଟି ଆବଶ୍ୟକ ।"
  },
  as: {
    reportTitle: "কৃষক ঋণ যোগ্যতা মূল্যায়ন প্ৰতিবেদন",
    secProfile: "১. কৃষক আৰু ভূমিৰ প্ৰফাইল",
    secCredit: "২. ঋণ মূল্যায়ন আৰু আশংকাৰ প্ৰফাইল",
    secXAI: "৩. ব্যাখ্যাযোগ্য এআই (XAI) ঋণ সংকেতৰ বিশ্লেষণ",
    secDocs: "৪. বেংকৰ নথিপত্ৰ আৰু নিয়ম পালনৰ স্থিতি",
    secRoadmap: "৫. ব্যক্তিগত ঋণ যোগ্যতা উন্নয়নৰ পৰিকল্পনা",
    lblFarmerName: "কৃষকৰ নাম:",
    lblLocation: "গাঁও / জিলা:",
    lblEmail: "কৃষকৰ ইমেইল:",
    lblCrop: "চাষ কৰা শস্য:",
    lblArea: "কৃষিভূমিৰ পৰিমাণ:",
    lblIrrigation: "জলসিঞ্চন প্ৰণালী:",
    lblHarvest: "শেহতীয়া শস্য উৎপাদন:",
    lblScoreTitle: "ঋণ যোগ্যতা স্কোৰ",
    lblSuitability: "ঋণ উপযুক্ততাৰ স্থিতি",
    lblVerified: "[যাচাইকৃত]",
    lblPending: "[বাকী আছে]",
    lblPass: "[উত্তীৰ্ণ]",
    lblWarn: "[সতৰ্কতা]",
    lblWeatherTelemetry: "বতৰৰ তথ্য সংযোগ",
    region: "অঞ্চল",
    disclaimer: "অস্বীকাৰকৰণ: এগ্ৰিস্কোৰ এআই কেৱল মূল্যায়নকাৰী সহায়ক হিচাপে কাম কৰে। ঋণ অনুমোদন সম্পূৰ্ণৰূপে বেংকৰ নিজা সিদ্ধান্তৰ ওপৰत নিৰ্ভৰ কৰে।",
    footerHackathon: "এগ্ৰিস্কোৰ এআই · ব্ৰেইনৱেভ ২০২৬ ৰাষ্ট্ৰীয় হেকাথনৰ বাবে যুগুত কৰা হৈছে",
    strong: "সবল স্কোৰ। খৰতকীয়া ঋণ অনুমোদনৰ বাবে উপযুক্ত।",
    moderate: "মধ্যমীয়া ঋণ যোগ্যতা। জলসিঞ্চন পৰীক্ষাৰ সাপেক্ষে অনুমোদন কৰা হ’ব।",
    weak: "অধিক উৎপাদনশীলতাৰ উঠা-নমা। অতিৰিক্ত ঋণ নিশ্চয়তাৰ প্ৰয়োজন।"
  },
  ur: {
    reportTitle: "کسان لون اہلیت کے جائزے کی رپورٹ",
    secProfile: "1. کسان اور زمین کی تفصیلات",
    secCredit: "2. لون کی تشخیص اور رسک پروفائل",
    secXAI: "3. وضاحت طلب اے آئی (XAI) کریڈٹ سگنلز کی جانچ",
    secDocs: "4. بینک دستاویزات اور تعمیل کی صورتحال",
    secRoadmap: "5. لون اہلیت میں بہتری کا ذاتی پروگرام",
    lblFarmerName: "کسان کا نام:",
    lblLocation: "گاؤں / ضلع:",
    lblEmail: "کسان کا ای میل:",
    lblCrop: "زیر کاشت فصل:",
    lblArea: "زیر کاشت زمین کا رقبہ:",
    lblIrrigation: "آبپاشی کا نظام:",
    lblHarvest: "حالیہ پیداوار:",
    lblScoreTitle: "لون اہلیت کا اسکور",
    lblSuitability: "لون اہلیت کی حیثیت",
    lblVerified: "[تصدیق شدہ]",
    lblPending: "[غیر مکمل]",
    lblPass: "[کامیاب]",
    lblWarn: "[انتباہ]",
    lblWeatherTelemetry: "موسمی معلومات کا اشتراک",
    region: "علاقہ",
    disclaimer: "دستبرداری: ایگری اسکور اے آئی صرف ایک جائزہ لینے والا اسسٹنٹ ہے۔ لون کی حتمی منظوری مکمل طور پر بینک کی صوابدید پر ہے۔",
    footerHackathon: "ایگری اسکور اے آئی · برین ویو 2026 قومی ہیکاتھون کے لیے تیار کردہ",
    strong: "بہترین اسکور۔ تیز رفتاری سے لون کی منظوری کی سفارش کی جاتی ہے۔",
    moderate: "درمیانہ اسکور۔ آبپاشی کے نظام کی جانچ پڑتال کے بعد لون کی منظوری۔",
    weak: "زیادہ پیداواری خطرہ۔ اضافی ضمانتوں کی ضرورت ہے۔"
  }
};

/**
 * Generates and downloads a clean, professional, bank-ready PDF report.
 * Generated fully in the selected language using custom-embedded TrueType Unicode fonts (Noto Sans)
 * to ensure perfect rendering across Windows, Chrome, Edge, Adobe Acrobat, and mobile.
 */
export async function downloadReport(item, documents, lang) {
  try {
    const t = STRINGS[lang] || STRINGS.en;
    const p = pdfTranslations[lang] || pdfTranslations.en;

    // 1. Setup jsPDF Document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // 2. Load Unicode TTF Font Dynamically based on current language
    let fontBase64 = null;
    let fontName = "Helvetica";
    let fontFile = "helvetica.ttf";

    if (lang === "hi" || lang === "mr") {
      const module = await import("./fonts/devanagari.js");
      fontBase64 = module.fontBase64;
      fontName = "NotoSansDevanagari";
      fontFile = "NotoSansDevanagari.ttf";
    } else if (lang === "bn" || lang === "as") {
      const module = await import("./fonts/bengali.js");
      fontBase64 = module.fontBase64;
      fontName = "NotoSansBengali";
      fontFile = "NotoSansBengali.ttf";
    } else if (lang === "ta") {
      const module = await import("./fonts/tamil.js");
      fontBase64 = module.fontBase64;
      fontName = "NotoSansTamil";
      fontFile = "NotoSansTamil.ttf";
    } else if (lang === "te") {
      const module = await import("./fonts/telugu.js");
      fontBase64 = module.fontBase64;
      fontName = "NotoSansTelugu";
      fontFile = "NotoSansTelugu.ttf";
    } else if (lang === "gu") {
      const module = await import("./fonts/gujarati.js");
      fontBase64 = module.fontBase64;
      fontName = "NotoSansGujarati";
      fontFile = "NotoSansGujarati.ttf";
    } else if (lang === "pa") {
      const module = await import("./fonts/gurmukhi.js");
      fontBase64 = module.fontBase64;
      fontName = "NotoSansGurmukhi";
      fontFile = "NotoSansGurmukhi.ttf";
    } else if (lang === "kn") {
      const module = await import("./fonts/kannada.js");
      fontBase64 = module.fontBase64;
      fontName = "NotoSansKannada";
      fontFile = "NotoSansKannada.ttf";
    } else if (lang === "ml") {
      const module = await import("./fonts/malayalam.js");
      fontBase64 = module.fontBase64;
      fontName = "NotoSansMalayalam";
      fontFile = "NotoSansMalayalam.ttf";
    } else if (lang === "or") {
      const module = await import("./fonts/oriya.js");
      fontBase64 = module.fontBase64;
      fontName = "NotoSansOriya";
      fontFile = "NotoSansOriya.ttf";
    } else if (lang === "ur") {
      const module = await import("./fonts/arabic.js");
      fontBase64 = module.fontBase64;
      fontName = "NotoSansArabic";
      fontFile = "NotoSansArabic.ttf";
    }

    if (fontBase64) {
      doc.addFileToVFS(fontFile, fontBase64);
      doc.addFont(fontFile, fontName, "normal");
      doc.setFont(fontName);
    } else {
      doc.setFont("helvetica");
    }

    // 3. Use pre-calculated backend scores if available, otherwise fallback to local calculation
    const tickedCount = Object.values(documents).filter(Boolean).length;
    const finalResult = (item.score !== undefined && item.risk !== undefined && item.reasons !== undefined)
      ? item
      : computeScore({
          location: item.location,
          crop: item.crop,
          land: item.land,
          harvest: item.harvest,
          irrigation: item.irrObj?.id || item.irrigation,
          tickedCount,
          weather: item.weatherData || { success: false },
          lang
        });

    const forest = "#1F3D2B";
    const gold = "#D4A017";
    const ink = "#1B2B20";
    const lightBg = "#F7F5EF";
    const borderCol = "#E4E0D4";

    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };

    const rForest = hexToRgb(forest);
    const rInk = hexToRgb(ink);
    const rLight = hexToRgb(lightBg);
    const rBorder = hexToRgb(borderCol);

    // --- Page Header Banner ---
    doc.setFillColor(rForest[0], rForest[1], rForest[2]);
    doc.rect(15, 15, 180, 22, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    // Explicitly bolding using standard method if custom font lacks bold
    doc.text(t.appName.toUpperCase(), 22, 24);

    doc.setFontSize(8.5);
    doc.text(p.reportTitle, 22, 29);

    doc.text(`${t.checkedOn || "Date"}: ${item.date || new Date().toLocaleDateString()}`, 144, 26);

    // --- Section 1: Farmer & Crop Profile ---
    let y = 48;
    doc.setTextColor(rInk[0], rInk[1], rInk[2]);
    doc.setFontSize(10.5);
    doc.setFillColor(31, 61, 43); // forest green accent bar
    doc.rect(15, y - 3.8, 2, 4.5, "F");
    doc.text(p.secProfile, 19, y);
    doc.line(15, y + 2, 195, y + 2);

    // Language-aware fallback for missing values
    const na = "जानकारी उपलब्ध नहीं";

    // Helper: guarantee a non-empty string or fallback
    const safeStr = (v) => {
      if (v === null || v === undefined) return na;
      const s = String(v).trim();
      return s.length > 0 ? s : na;
    };

    // Helper: truncate to char count to avoid overflow (no splitTextToSize which can fail silently)
    const trunc = (str, maxChars) => str.length > maxChars ? str.slice(0, maxChars - 1) + "…" : str;

    // --- Resolve all field values upfront ---
    const farmerName    = safeStr(item.farmerName);
    const farmerEmail   = safeStr(item.farmerEmail);
    const rawLoc        = item.location || item.village || item.district || "";
    const farmerLoc     = safeStr(getLocalizedLocation(rawLoc, lang) || rawLoc);
    const farmerCrop    = safeStr(getLocalizedCrop(item.crop, lang) || item.crop);
    const farmerLand    = item.land || item.farmSize ? `${item.land || item.farmSize} ${t.acres}` : na;
    const farmerHarvest = item.harvest ? `${item.harvest} ${t.quintals || "quintals"}` : na;

    const irrListCurrent = IRRIGATION_I18N[lang] || IRRIGATION_I18N.en;
    const irrObjCurrent  = irrListCurrent.find(
      (i) => i.id === (item.irrObj?.id || item.irrigation)
    ) || irrListCurrent[2];
    const farmerIrr = safeStr(irrObjCurrent?.label);

    // Resolve financial parameters
    const farmerPhone = safeStr(item.phoneNumber);
    const farmerDistrict = safeStr(item.district || item.location);
    const farmerState = safeStr(item.state);
    const farmerIncome = item.annualIncome !== undefined ? `Rs. ${item.annualIncome}` : na;
    const farmerLoans = item.existingLoans !== undefined ? `Rs. ${item.existingLoans}` : na;
    const farmerCredit = safeStr(item.creditHistory);
    const farmerReqAmount = item.requiredLoanAmount !== undefined ? `Rs. ${item.requiredLoanAmount}` : na;

    // Diagnostic: confirm values in browser console before drawing
    console.log("[AgriScore PDF] Profile field values:", {
      farmerName, farmerEmail, farmerLoc, farmerCrop,
      farmerLand, farmerHarvest, farmerIrr, farmerPhone, farmerIncome,
      rawUser: user, rawItem: { location: item.location, crop: item.crop, land: item.land, harvest: item.harvest }
    });

    // Column x-positions
    const COL1_LBL = 15, COL1_VAL = 52, COL2_LBL = 108, COL2_VAL = 148;

    y += 8;
    doc.setFontSize(9);

    // Row 1: Farmer Name | Phone Number
    doc.text(p.lblFarmerName,           COL1_LBL, y);
    doc.text(trunc(farmerName, 30),     COL1_VAL, y);
    doc.text("Phone Number:",           COL2_LBL, y);
    doc.text(trunc(farmerPhone, 28),    COL2_VAL, y);

    y += 5.5;
    // Row 2: Email | Crop
    doc.text(p.lblEmail,                COL1_LBL, y);
    doc.text(trunc(farmerEmail, 30),    COL1_VAL, y);
    doc.text(p.lblCrop,                 COL2_LBL, y);
    doc.text(trunc(farmerCrop, 28),     COL2_VAL, y);

    y += 5.5;
    // Row 3: Village/Location | District/State
    doc.text(p.lblLocation,             COL1_LBL, y);
    doc.text(trunc(farmerLoc, 30),      COL1_VAL, y);
    doc.text("District / State:",       COL2_LBL, y);
    doc.text(trunc(`${farmerDistrict}, ${farmerState}`, 28), COL2_VAL, y);

    y += 5.5;
    // Row 4: Land Area | Irrigation
    doc.text(p.lblArea,                 COL1_LBL, y);
    doc.text(trunc(farmerLand, 30),     COL1_VAL, y);
    doc.text(p.lblIrrigation,           COL2_LBL, y);
    doc.text(trunc(farmerIrr, 28),      COL2_VAL, y);

    y += 5.5;
    // Row 5: Harvest | Required Loan
    doc.text(p.lblHarvest,              COL1_LBL, y);
    doc.text(trunc(farmerHarvest, 30),  COL1_VAL, y);
    doc.text("Required Loan Amount:",   COL2_LBL, y);
    doc.text(trunc(farmerReqAmount, 28), COL2_VAL, y);

    y += 5.5;
    // Row 6: Annual Income | Debt & Credit
    doc.text("Annual Income:",          COL1_LBL, y);
    doc.text(trunc(farmerIncome, 30),   COL1_VAL, y);
    doc.text("Debt & Credit History:",  COL2_LBL, y);
    doc.text(trunc(`${farmerLoans} (${farmerCredit})`, 28), COL2_VAL, y);

    // --- Section 2: Credit Score Summary ---
    y += 12;
    doc.setFontSize(10.5);
    doc.setFillColor(31, 61, 43); // forest green accent bar
    doc.rect(15, y - 3.8, 2, 4.5, "F");
    doc.text(p.secCredit, 19, y);
    doc.line(15, y + 2, 195, y + 2);

    y += 8;
    // Score box
    doc.setFillColor(rLight[0], rLight[1], rLight[2]);
    doc.setDrawColor(rBorder[0], rBorder[1], rBorder[2]);
    doc.rect(15, y, 65, 24, "FD");

    doc.setTextColor(rInk[0], rInk[1], rInk[2]);
    doc.setFontSize(7.5);
    doc.text(p.lblScoreTitle, 20, y + 6);
    doc.setFontSize(18);
    doc.text(`${finalResult.score} / 100`, 20, y + 16);

    // Risk card
    let riskColor = [59, 122, 87]; // Low (Green)
    if (finalResult.risk === "Medium") riskColor = [201, 138, 43]; // Medium (Orange)
    if (finalResult.risk === "High") riskColor = [180, 72, 59]; // High (Red)

    doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.rect(88, y, 107, 24, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(p.lblSuitability, 94, y + 6);
    
    doc.setFontSize(12.5);
    const riskTrans = t[finalResult.risk.toLowerCase()] || finalResult.risk;
    doc.text(`${riskTrans.toUpperCase()} ${t.risk.toUpperCase()}`, 94, y + 14);

    doc.setFontSize(7.5);
    const statusNote = finalResult.score >= 72
      ? p.strong
      : finalResult.score >= 48
      ? p.moderate
      : p.weak;
    doc.text(statusNote, 94, y + 20);

    // --- Weather parameters ---
    if (item.weatherData) {
      y += 28;
      doc.setFillColor(rLight[0], rLight[1], rLight[2]);
      doc.rect(15, y, 180, 10, "F");
      doc.setFontSize(7.5);
      doc.setTextColor(rForest[0], rForest[1], rForest[2]);
      const wSource = item.weatherData.source || "Weather Grid";
      const tempLabel = t.temp || "Temperature";
      const humidityLabel = t.humidity || "Humidity";
      const rainLabel = t.rain || "Rain";
      const weatherText = `${p.lblWeatherTelemetry} (${wSource}): ${p.region}: ${item.weatherData.locationName || item.location} | ${tempLabel}: ${item.weatherData.temp}°C | ${humidityLabel}: ${item.weatherData.humidity}% | ${rainLabel}: ${item.weatherData.rain}mm`;
      doc.text(weatherText, 18, y + 6.5);
    }

    // --- Section 3: Explainable AI Diagnoses ---
    y += (item.weatherData ? 16 : 30);
    doc.setTextColor(rInk[0], rInk[1], rInk[2]);
    doc.setFontSize(10.5);
    doc.setFillColor(31, 61, 43); // forest green accent bar
    doc.rect(15, y - 3.8, 2, 4.5, "F");
    doc.text(p.secXAI, 19, y);
    doc.line(15, y + 2, 195, y + 2);

    y += 8;
    doc.setFontSize(8);
    finalResult.reasons.forEach((reason) => {
      if (reason.ok) {
        doc.setTextColor(59, 122, 87);
        doc.text(p.lblPass, 15, y);
      } else {
        doc.setTextColor(201, 138, 43);
        doc.text(p.lblWarn, 15, y);
      }
      doc.setTextColor(rInk[0], rInk[1], rInk[2]);
      
      const cleanText = reason.text;
      const textLines = doc.splitTextToSize(cleanText, 168);
      doc.text(textLines, 29, y);
      y += 5.5 * textLines.length;
    });

    // --- Section 4: Bank Document Verification Checklist ---
    y += 4;
    doc.setFontSize(10.5);
    doc.setFillColor(31, 61, 43); // forest green accent bar
    doc.rect(15, y - 3.8, 2, 4.5, "F");
    doc.text(p.secDocs, 19, y);
    doc.line(15, y + 2, 195, y + 2);

    y += 8;
    doc.setFontSize(8);
    const docsList = [
      { key: "land", label: t.landRecord },
      { key: "id", label: t.idProof },
      { key: "nodues", label: t.noDueCert },
      { key: "soil", label: t.soilCard },
      { key: "bank", label: t.bankAccount }
    ];

    docsList.forEach((docItem) => {
      const isTicked = documents[docItem.key];
      if (isTicked) {
        doc.setTextColor(59, 122, 87);
        doc.text(p.lblVerified, 15, y);
      } else {
        doc.setTextColor(180, 72, 59);
        doc.text(p.lblPending, 15, y);
      }
      doc.setTextColor(rInk[0], rInk[1], rInk[2]);
      doc.text(docItem.label, 36, y);
      y += 5.5;
    });

    // --- Section 5: Improvement Roadmap Suggestions ---
    y += 4;
    doc.setFontSize(10.5);
    doc.setFillColor(31, 61, 43); // forest green accent bar
    doc.rect(15, y - 3.8, 2, 4.5, "F");
    doc.text(p.secRoadmap, 19, y);
    doc.line(15, y + 2, 195, y + 2);

    y += 8;
    doc.setFontSize(8);
    
    const suggestionsToRender = (finalResult.recommendations && finalResult.recommendations.length > 0)
      ? [...finalResult.suggestions, ...finalResult.recommendations]
      : finalResult.suggestions;

    suggestionsToRender.forEach((sug, idx) => {
      const bulletText = `${idx + 1}. ${sug}`;
      const textLines = doc.splitTextToSize(bulletText, 175);
      doc.text(textLines, 15, y);
      y += 5 * textLines.length;
    });

    // --- Footer metadata ---
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 110);
    doc.text(p.disclaimer, 15, 282);
    doc.text(p.footerHackathon, 15, 286);

    // Save report
    const sanitizedCrop = item.crop.replace(/[^a-zA-Z\u0900-\u097F\u0980-\u09FF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0B00-\u0B7F\u09A0-\u09FD\u0600-\u06FF]/g, "");
    doc.save(`AgriScore_Report_${sanitizedCrop}_${lang}.pdf`);
  } catch (err) {
    console.error("PDF generation failed", err);
    alert("Could not generate PDF report. Check browser console logs.");
  }
}
