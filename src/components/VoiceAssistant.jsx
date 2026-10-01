import React, { useState, useEffect } from "react";
import { Mic, AlertCircle, RefreshCw, CheckCircle2, Edit3, ArrowRight } from "lucide-react";
import { useSpeechInput } from "../services/voiceService";
import { STRINGS, CROPS_I18N, IRRIGATION_I18N } from "../services/translationService";
import axios from "axios";

/**
 * VoiceAssistant Component
 * Form filling assistant parsing spoken text with a Confirmation Step ("Please review before continuing").
 */
export default function VoiceAssistant({ lang, onVoiceUpdate, API_BASE = "http://localhost:5000/api" }) {
  const t = STRINGS[lang] || STRINGS.en;
  const [voiceConsole, setVoiceConsole] = useState("");
  const [assistantLogs, setAssistantLogs] = useState("");
  const [pendingExtraction, setPendingExtraction] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleSpeechResult = async (spokenText) => {
    setVoiceConsole(spokenText);
    setIsExtracting(true);
    const textLower = spokenText.toLowerCase();
    const payload = {};

    // 1. Dynamic Crop Matching
    Object.keys(CROPS_I18N).forEach((langCode) => {
      const cropsList = CROPS_I18N[langCode];
      cropsList.forEach((c, idx) => {
        if (textLower.includes(c.toLowerCase())) {
          const currentCrops = CROPS_I18N[lang] || CROPS_I18N.en;
          payload.crop = currentCrops[idx];
        }
      });
    });

    // 2. Dynamic Irrigation System Matching
    Object.keys(IRRIGATION_I18N).forEach((langCode) => {
      const irrList = IRRIGATION_I18N[langCode];
      irrList.forEach((irrItem) => {
        if (textLower.includes(irrItem.label.toLowerCase())) {
          payload.irrigation = irrItem.id;
        }
      });
    });

    // 3. Multi-language Land Sizing Matcher
    const landKeywords = ["acres", "acre", "एकड़", "एकड़", "একর", "ஏக்கர்", "ఎకరాలు", "एकर", "વીઘા", "ਏਕੜ", "<ctrl42><ctrl42><ctrl42>", "ഏക്കർ", "ଏକର", "একৰ", "ایکڑ"];
    const landRegex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${landKeywords.join("|")})`, "i");
    const landMatch = textLower.match(landRegex);
    if (landMatch) {
      payload.land = landMatch[1];
    }

    // 4. Multi-language Harvest Quantity Matcher
    const harvestKeywords = ["quintals", "quintal", "क्विंटल", "কুইন্টাল", "குவிண்டால்", "క్వింటాళ్లు", "क्विंटल", "ક્વિન્ટલ", "ਕੁਇੰਟਲ", "ਕੁਇੰਟਾਲ", "ക്വിന്റൽ", "କ୍ଵିଣ୍ଟାଲ୍", "কুইন্টল", "کوئنٹل"];
    const harvestRegex = new RegExp(`(\\d+)\\s*(?:${harvestKeywords.join("|")})`, "i");
    const harvestMatch = textLower.match(harvestRegex);
    if (harvestMatch) {
      payload.harvest = harvestMatch[1];
    }

    // 5. Multi-language Location Matcher
    const locMatch = textLower.match(/(?:village|district|location|town|गांव|स्थान|ग्राम|கிராமம்|గ్రామం|गाव|ગામ|ਪਿੰਡ|ਹಳ್ಳಿ|ഗ്രാമം|ଗାଁ|গাঁও|گاؤں)\s*(?:is)?\s*([a-zA-Z\u0900-\u097F\u0980-\u09FF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0B00-\u0B7F\u09A0-\u09FD\u0600-\u06FF\s]+)/);
    if (locMatch) {
      const lVal = locMatch[1].trim();
      if (lVal) {
        payload.location = lVal;
      }
    }

    // Try calling LLM voice extraction API for deeper natural speech parsing if needed
    try {
      const res = await axios.post(`${API_BASE}/voice/extract`, { spokenText, language: lang });
      if (res.data && res.data.extracted) {
        const ext = res.data.extracted;
        if (ext.village && !payload.location) payload.location = ext.village;
        if (ext.farmSize && !payload.land) payload.land = ext.farmSize;
        if (ext.cropType && !payload.crop) payload.crop = ext.cropType;
        if (ext.harvest && !payload.harvest) payload.harvest = ext.harvest;
        if (ext.annualIncome && !payload.annualIncome) payload.annualIncome = ext.annualIncome;
        if (ext.existingLoans && !payload.existingLoans) payload.existingLoans = ext.existingLoans;
        if (ext.irrigation && !payload.irrigation) payload.irrigation = ext.irrigation;
      }
    } catch (err) {
      console.warn("Backend LLM voice extraction fallback to regex.");
    } finally {
      setIsExtracting(false);
    }

    if (Object.keys(payload).length > 0) {
      setPendingExtraction(payload);
    } else {
      setAssistantLogs(t.voiceFallback || "Could not parse multiple details. Please enter manually or try speaking again.");
    }
  };

  const { start, stop, listening, errorMessage, isSupported } = useSpeechInput(lang, handleSpeechResult);

  const confirmApplyVoiceData = () => {
    if (pendingExtraction) {
      onVoiceUpdate(pendingExtraction);
      setAssistantLogs("✓ Voice details applied to farm assessment form.");
      setPendingExtraction(null);

      // Smooth scroll to form
      const formEl = document.querySelector("form");
      if (formEl) {
        formEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleManualEntry = () => {
    setPendingExtraction(null);
    const formEl = document.querySelector("form");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth" });
      const firstInput = formEl.querySelector("input");
      if (firstInput) firstInput.focus();
    }
  };

  const forest = "#1F3D2B";
  const hasFailed = !isSupported || !!errorMessage;

  return (
    <div
      style={{
        background: "#EAF2EC",
        borderRadius: 16,
        border: "1px solid #C5DBD0",
        padding: 24,
        boxShadow: "0 2px 8px rgba(31,61,43,0.02)",
        position: "relative"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 16, color: forest }}>
          <Mic size={18} /> {t.voiceAssistantTitle || "🎤 Voice Form Assistant"}
        </div>
        {listening && (
          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#B4483B", animation: "pulse 1.2s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#B4483B" }}>Listening...</span>
          </span>
        )}
      </div>

      {!hasFailed ? (
        <>
          <p style={{ fontSize: 13, color: "#2E5A3E", lineHeight: 1.5, marginBottom: 16 }}>
            {t.voiceAssistantSub || "Speak naturally in your language. State your crop, land size, location, or harvest."}
            <br />
            <strong style={{ display: "inline-block", marginTop: 4 }}>{t.voiceExample}</strong>
          </p>

          <button
            type="button"
            onClick={listening ? stop : start}
            disabled={isExtracting}
            style={{
              background: listening ? "#B4483B" : forest,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 20px",
              fontFamily: "Space Grotesk, sans-serif",
              fontWeight: 600,
              fontSize: 14.5,
              cursor: isExtracting ? "wait" : "pointer",
              display: "inline-flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.2s"
            }}
          >
            {isExtracting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Processing Voice Entities...</span>
              </>
            ) : listening ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Listening... Speak Now</span>
              </>
            ) : (
              <>
                <Mic size={16} />
                <span>{t.voiceStart}</span>
              </>
            )}
          </button>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              padding: "10px 14px",
              background: "#FEF7F7",
              border: "1px solid #FADAD6",
              borderRadius: 10,
              color: "#9B1C1C",
              fontSize: 12.5,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              lineHeight: 1.4
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2, color: "#B4483B" }} />
            <span>
              {errorMessage || "Voice input is not supported in this browser. Please enter the information manually."}
            </span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              disabled={!isSupported}
              onClick={start}
              style={{
                flex: 1,
                padding: "10px 14px",
                background: isSupported ? forest : "#E4E0D4",
                color: isSupported ? "#fff" : "#8a8a7c",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: isSupported ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              🔄 Retry
            </button>
            <button
              type="button"
              onClick={handleManualEntry}
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "#FFFFFF",
                color: forest,
                border: `1px solid ${forest}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              📝 Manual Entry
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal Card for Extracted Multi-field Entities */}
      {pendingExtraction && (
        <div
          style={{
            marginTop: 16,
            background: "#FFFFFF",
            padding: 16,
            borderRadius: 12,
            border: "1.5px solid #3B7A57",
            boxShadow: "0 4px 12px rgba(31,61,43,0.08)"
          }}
        >
          <div style={{ fontSize: 13.5, fontWeight: 700, color: forest, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={16} color="#3B7A57" /> Please review the information before continuing:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#2C3E35", marginBottom: 14 }}>
            {pendingExtraction.location && (
              <div>✓ <strong>Village / Location:</strong> {pendingExtraction.location}</div>
            )}
            {pendingExtraction.crop && (
              <div>✓ <strong>Crop Type:</strong> {pendingExtraction.crop}</div>
            )}
            {pendingExtraction.land && (
              <div>✓ <strong>Land Size:</strong> {pendingExtraction.land} acres</div>
            )}
            {pendingExtraction.harvest && (
              <div>✓ <strong>Recent Harvest:</strong> {pendingExtraction.harvest} quintals</div>
            )}
            {pendingExtraction.irrigation && (
              <div>✓ <strong>Irrigation:</strong> {pendingExtraction.irrigation}</div>
            )}
            {pendingExtraction.annualIncome && (
              <div>✓ <strong>Annual Income:</strong> ₹{pendingExtraction.annualIncome}</div>
            )}
            {pendingExtraction.existingLoans && (
              <div>✓ <strong>Existing Debt:</strong> ₹{pendingExtraction.existingLoans}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={confirmApplyVoiceData}
              style={{
                flex: 1.2,
                background: forest,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <CheckCircle2 size={14} /> Apply to Form
            </button>
            <button
              type="button"
              onClick={handleManualEntry}
              style={{
                flex: 1,
                background: "#F5F5F0",
                color: "#55554A",
                border: "1px solid #E4E0D4",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4
              }}
            >
              <Edit3 size={14} /> Edit Fields
            </button>
          </div>
        </div>
      )}

      {voiceConsole && !pendingExtraction && !hasFailed && (
        <div style={{ marginTop: 14, background: "#FFFFFF", padding: 12, borderRadius: 8, border: "1px solid #C5DBD0", fontSize: 12.5 }}>
          <div style={{ color: "#7a7a6c", fontWeight: 600, fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>{t.speechRecognized}</div>
          <div style={{ color: "#1B2B20", fontWeight: 500 }}>"{voiceConsole}"</div>
          {assistantLogs && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #E4E0D4", color: forest, fontWeight: 600 }}>
              {assistantLogs}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
