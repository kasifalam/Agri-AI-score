import { useState, useRef, useEffect } from "react";
import { STRINGS } from "./translationService";

/**
 * Text to Speech Synthesis
 */
export function speak(text, lang) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    
    // Map languages to TTS locales
    const langLocales = {
      en: "en-IN", hi: "hi-IN", bn: "bn-IN", ta: "ta-IN", te: "te-IN",
      mr: "mr-IN", gu: "gu-IN", pa: "pa-IN", kn: "kn-IN", ml: "ml-IN",
      or: "or-IN", as: "as-IN", ur: "ur-IN"
    };
    
    u.lang = langLocales[lang] || "en-IN";
    u.rate = 0.90;
    window.speechSynthesis.speak(u);
  } catch (e) {
    console.error("Text to speech failed", e);
  }
}

/**
 * Utility to parse spoken text for a single input field (numbers, currency, text)
 */
export function parseSpokenFieldValue(spokenText, fieldType = "text") {
  if (!spokenText || typeof spokenText !== "string") return "";
  const text = spokenText.trim();
  const textLower = text.toLowerCase();

  if (fieldType === "number" || fieldType === "currency") {
    // 1. Check for Lakh / Crore / Thousand patterns
    const lakhMatch = textLower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|लाख|লাখ|லட்சம்|లక్షలు|लाख|લાખ|ਲੱਖ|ಲಕ್ಷ|ലക്ഷം|ଲକ୍ଷ|লাখ)/i);
    if (lakhMatch) {
      const num = parseFloat(lakhMatch[1]);
      if (!isNaN(num)) return Math.round(num * 100000).toString();
    }

    const croreMatch = textLower.match(/(\d+(?:\.\d+)?)\s*(?:crore|crores|करोड़|কোটি|கோடி|కోట్లు|करोड|કરોડ|ਕਰੋੜ|ಕೋಟಿ|കോടി|କୋଟି|কোটি)/i);
    if (croreMatch) {
      const num = parseFloat(croreMatch[1]);
      if (!isNaN(num)) return Math.round(num * 10000000).toString();
    }

    const thousandMatch = textLower.match(/(\d+(?:\.\d+)?)\s*(?:thousand|thousands|हजार|হাজার|ஆயிரம்|వేలు|हजार|હજાર|ਹਜ਼ਾਰ|ಸಾfram|ആയിരം|ହଜାର|হেজাৰ)/i);
    if (thousandMatch) {
      const num = parseFloat(thousandMatch[1]);
      if (!isNaN(num)) return Math.round(num * 1000).toString();
    }

    // 2. Extract digits or floating point
    const digitMatch = textLower.match(/(\d+(?:\.\d+)?)/);
    if (digitMatch) {
      return digitMatch[1];
    }

    // 3. Word numbers (1 to 10)
    const numberWords = {
      one: "1", ek: "1", एक: "1", এক: "1",
      two: "2", do: "2", दो: "2", দুই: "2",
      three: "3", teen: "3", तीन: "3", তিন: "3",
      four: "4", char: "4", चार: "4", চার: "4",
      five: "5", paanch: "5", पांच: "5", পাঁচ: "5",
      six: "6", chhe: "6", छह: "6", ছয়: "6",
      seven: "7", saat: "7", सात: "7", সাত: "7",
      eight: "8", aath: "8", आठ: "8", আট: "8",
      nine: "9", nau: "9", नौ: "9", নয়: "9",
      ten: "10", das: "10", दस: "10", দশ: "10"
    };

    for (const [w, val] of Object.entries(numberWords)) {
      if (textLower.includes(w)) {
        return val;
      }
    }
  }

  // Text cleanup
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Speech Recognition Hook (Web Speech API)
 */
export function useSpeechInput(lang, onResult) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const retriesRef = useRef(0);

  const t = STRINGS[lang] || STRINGS.en;

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setIsSupported(false);
    }
    return () => {
      if (recRef.current) {
        try {
          recRef.current.abort();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const start = async () => {
    setErrorMessage("");
    retriesRef.current = 0;
    
    if (!window.isSecureContext) {
      const secureMsg = lang === "hi"
        ? "सुरक्षा अलर्ट: ऐप असुरक्षित कनेक्शन (HTTP) पर है। कृपया 'https://' या 'localhost' का उपयोग करें।"
        : "Security Alert: App is running in insecure HTTP context. Please use HTTPS or localhost.";
      setErrorMessage(secureMsg);
      setListening(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setErrorMessage(t.errGeneric || "Speech recognition is not supported in this browser.");
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Microphone Permission Timeout")), 2500)
        );
        const getUserMediaPromise = navigator.mediaDevices.getUserMedia({ audio: true });
        const stream = await Promise.race([getUserMediaPromise, timeoutPromise]);
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error("Microphone permission denied:", err);
      const permMsg = lang === "hi"
        ? "अनुमति अस्वीकृत: माइक्रोफ़ोन एक्सेस ब्लॉक है। एड्रेस बार में ताले के निशान पर क्लिक करें।"
        : "Permission Denied: Microphone access is blocked. Click the lock icon in address bar.";
      setErrorMessage(permMsg);
      setListening(false);
      return;
    }

    initializeAndStart(SR);
  };

  const initializeAndStart = (SR) => {
    try {
      if (recRef.current) {
        try { recRef.current.abort(); } catch (err) {}
      }

      const rec = new SR();
      const langLocales = {
        en: "en-IN", hi: "hi-IN", bn: "bn-IN", ta: "ta-IN", te: "te-IN",
        mr: "mr-IN", gu: "gu-IN", pa: "pa-IN", kn: "kn-IN", ml: "ml-IN",
        or: "or-IN", as: "as-IN", ur: "ur-IN"
      };
      
      rec.lang = langLocales[lang] || "en-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;

      rec.onstart = () => setListening(true);

      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        if (onResult) {
          onResult(text);
        }
        setListening(false);
      };

      rec.onerror = (e) => {
        console.error("Speech Recognition Error:", e.error, e);
        if (e.error === "no-speech") {
          setErrorMessage(lang === "hi" ? "आवाज़ नहीं सुनाई दी। दोबारा बोलें।" : "No speech detected. Please speak closer.");
        } else if (e.error === "not-allowed") {
          setErrorMessage(lang === "hi" ? "माइक्रोफ़ोन ब्लॉक है।" : "Microphone access blocked.");
        } else if (e.error !== "aborted") {
          setErrorMessage(`Speech error: ${e.error}`);
        }
        setListening(false);
      };

      rec.onend = () => setListening(false);

      recRef.current = rec;
      rec.start();
    } catch (e) {
      console.error("SpeechRecognition init error:", e);
      setErrorMessage(t.errGeneric || "Failed to start speech recognition.");
      setListening(false);
    }
  };

  const stop = () => {
    if (recRef.current) {
      try { recRef.current.abort(); } catch (e) {}
      setListening(false);
    }
  };

  return { start, stop, listening, errorMessage, isSupported };
}
