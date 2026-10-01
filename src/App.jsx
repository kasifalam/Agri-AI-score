import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Sprout, Cloud, Droplets, TrendingUp, LogOut, User as UserIcon,
  History as HistoryIcon, LayoutDashboard, CheckCircle2, AlertTriangle,
  XCircle, ArrowRight, MapPin, Wheat, Lock, Mail, Plus,
  Volume2, Mic, FileText, Download, CheckSquare, Sparkles, Thermometer, Info, Menu, X, Trash2, ClipboardCheck
} from "lucide-react";
import axios from "axios";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";

// Services & Utils
import { STRINGS, CROPS_I18N, IRRIGATION_I18N, getLocalizedCrop, getLocalizedLocation } from "./services/translationService";
import { fetchWeatherData } from "./services/weatherService";
import { speak } from "./services/voiceService";
import { downloadReport } from "./services/pdfService";
import { computeScore } from "./utils/loanCalculator";

// Components
import LoanScoreCard from "./components/LoanScoreCard";
import LoanCoach from "./components/LoanCoach";
import GovernmentSchemes from "./components/GovernmentSchemes";
import ScoreDial from "./components/ScoreDial";
import AIExplanation from "./components/AIExplanation";
import VoiceFieldButton from "./components/VoiceFieldButton";

const API_BASE = "http://localhost:5000/api";

// ---------- Reusable Card & Button components ----------
function Card({ children, style, className = "" }) {
  const lineCol = "#E4E0D4";
  return (
    <div
      className={className}
      style={{
        background: "#FFFFFF", borderRadius: 16, border: `1px solid ${lineCol}`,
        padding: 24, boxShadow: "0 2px 8px rgba(31,61,43,0.03)", transition: "all 0.2s ease-in-out", ...style
      }}
    >
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, style, type = "button", disabled = false }) {
  const forest = "#1F3D2B";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#A8B8AD" : forest, color: "#fff", border: "none", borderRadius: 12,
        padding: "14px 24px", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700,
        fontSize: 15, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex",
        alignItems: "center", justifyContent: "center", gap: 8, transition: "transform 0.1s ease, opacity 0.2s",
        boxShadow: "0 2px 4px rgba(31,61,43,0.1)", ...style,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = 0.9; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.opacity = 1; }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}

function IconButton({ onClick, title, active, children, style }) {
  const lineCol = "#E4E0D4";
  const forest = "#1F3D2B";
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 48, height: 48, borderRadius: 10, border: `1px solid ${lineCol}`,
        background: active ? "#EAF2EC" : "#fff", color: active ? forest : "#6b6b60",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", flexShrink: 0, ...style
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, icon, children }) {
  return (
    <label style={{ display: "block", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "#3B4E41", marginBottom: 8, fontFamily: "Inter, sans-serif", letterSpacing: 0.3 }}>
        {icon}{label}
      </div>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: 10,
  border: "2px solid #E4E0D4", fontSize: 15, fontFamily: "Inter, sans-serif",
  background: "#FCFBF8", color: "#1B2B20", outline: "none", transition: "all 0.2s",
};

// ---------- Language Switcher (Select Dropdown) ----------
function LanguageToggle({ lang, setLang }) {
  const forest = "#1F3D2B";
  const card = "#FFFFFF";
  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी (Hindi)" },
    { code: "bn", label: "বাংলা (Bengali)" },
    { code: "ta", label: "தமிழ் (Tamil)" },
    { code: "te", label: "తెలుగు (Telugu)" },
    { code: "mr", label: "मराठी (Marathi)" },
    { code: "gu", label: "ગુજરાતી (Gujarati)" },
    { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
    { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
    { code: "ml", label: "മലയാളം (Malayalam)" },
    { code: "or", label: "ଓଡ଼ିଆ (Odia)" },
    { code: "as", label: "অসমীয়া (Assamese)" },
    { code: "ur", label: "اردو (Urdu)" }
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", background: "#F1EFE6", borderRadius: 8, padding: "2px 8px", border: "1px solid #E4E0D4" }}>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 12,
          color: forest, outline: "none", padding: "4px 0", width: "100%"
        }}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code} style={{ background: card, color: "#1B2B20" }}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------- Auth Screen ----------
function AuthScreen({ onAuth, lang, setLang, fontScale }) {
  const t = STRINGS[lang] || STRINGS.en;
  const forest = "#1F3D2B";
  const gold = "#D4A017";
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password || (mode === "register" && !name)) {
      setError(lang === "hi" ? "कृपया सभी फ़ील्ड भरें।" : lang === "bn" ? "দয়া করে সব ঘর পূরণ করুন।" : "Please fill all fields.");
      return;
    }
    setError("");
    try {
      await onAuth({ name, email, password, mode });
    } catch (err) {
      let msg = err.message;
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        msg = lang === "hi" ? "अमान्य ईमेल या पासवर्ड।" : "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = lang === "hi" ? "यह ईमेल पहले से उपयोग में है।" : "Email is already registered.";
      } else if (err.code === "auth/weak-password") {
        msg = lang === "hi" ? "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।" : "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        msg = lang === "hi" ? "अमान्य ईमेल प्रारूप।" : "Invalid email format.";
      }
      setError(msg);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: forest, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", padding: 20, position: "relative", zoom: fontScale, fontSize: `${14 * fontScale}px`, transition: "all 0.2s ease" }}>
      <div style={{ position: "absolute", top: 20, right: 20, zoom: 1 / fontScale }}>
        <LanguageToggle lang={lang} setLang={setLang} />
      </div>
      <div style={{ width: "100%", maxWidth: 390, transform: "translateY(-10px)", transition: "all 0.3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 16, background: gold, marginBottom: 12, boxShadow: "0 4px 12px rgba(212,160,23,0.3)" }}>
            <Sprout color={forest} size={30} />
          </div>
          <div style={{ color: "#fff", fontFamily: "Space Grotesk, sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>{t.appName}</div>
          <div style={{ color: "#BFD3C4", fontSize: 13.5, marginTop: 4, fontFamily: "Inter, sans-serif" }}>{t.tagline}</div>
        </div>
        <Card style={{ padding: 28, borderRadius: 20 }}>
          <div style={{ display: "flex", marginBottom: 20, background: "#F1EFE6", borderRadius: 10, padding: 4 }}>
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 13.5,
                  background: mode === m ? "#FFFFFF" : "transparent",
                  color: mode === m ? forest : "#8a8a7c",
                  boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s"
                }}
              >
                {m === "login" ? t.login : t.register}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            {mode === "register" && (
              <Field label={t.fullName} icon={<UserIcon size={14} />}>
                <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Divya Sharma" />
              </Field>
            )}
            <Field label={t.email} icon={<Mail size={14} />}>
              <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="farmer@village.com" />
            </Field>
            <Field label={t.password} icon={<Lock size={14} />}>
              <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            {error && <div style={{ color: "#B4483B", fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{error}</div>}
            <PrimaryButton type="submit" style={{ width: "100%", justifyContent: "center" }}>
              {mode === "login" ? t.login : t.createAccount} <ArrowRight size={16} />
            </PrimaryButton>
          </form>
        </Card>
      </div>
    </div>
  );
}

// ---------- Sidebar ----------
function Sidebar({ page, setPage, user, onLogout, lang, setLang, fontScale, setFontScale, mobileOpen }) {
  const t = STRINGS[lang] || STRINGS.en;
  const forest = "#1F3D2B";
  const gold = "#D4A017";
  const items = [
    { id: "dashboard", label: t.dashboard, icon: <LayoutDashboard size={17} /> },
    { id: "check", label: t.checkScore, icon: <TrendingUp size={17} /> },
    { id: "history", label: t.historyNav, icon: <HistoryIcon size={17} /> },
  ];

  return (
    <div className={`app-sidebar ${mobileOpen ? "active" : ""}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, padding: "0 8px" }}>
        <Sprout color={gold} size={24} />
        <span style={{ color: "#fff", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 17.5, letterSpacing: -0.3 }}>{t.appName}</span>
      </div>
      
      <div style={{ padding: "0 8px", marginBottom: 20 }}>
        <LanguageToggle lang={lang} setLang={setLang} />
      </div>

      {/* Accessibility Controller */}
      <div style={{ padding: "0 8px", marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 16 }}>
        <div style={{ color: "#8FA898", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
          {t.fontSize}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(() => {
            const fontLabels = {
              en: { s: "Small", m: "Medium", l: "Large" },
              hi: { s: "छोटा", m: "मध्यम", l: "बड़ा" },
              bn: { s: "ছোট", m: "মাঝারি", l: "বড়" },
              ta: { s: "சிறிய", m: "நடுத்தரம்", l: "பெரிய" },
              te: { s: "చిన్న", m: "మధ్యస్థం", l: "పెద్ద" },
              mr: { s: "लहान", m: "मध्यम", l: "मोठा" },
              gu: { s: "નાનું", m: "મધ્યમ", l: "મોટું" },
              pa: { s: "ਛੋਟਾ", m: "ਦਰਮਿਆਨਾ", l: "ਵੱਡਾ" },
              kn: { s: "ಸಣ್ಣ", m: "ಮಧ್ಯಮ", l: "ದೊಡ್ಡ" },
              ml: { s: "ചെറുത്", m: "മിതം", l: "വലുത്" },
              or: { s: "ଛୋଟ", m: "ମଧ୍ୟମ", l: "ବଡ଼" },
              as: { s: "সৰু", m: "মধ্যমীয়া", l: "ডাঙৰ" },
              ur: { s: "چھوٹا", m: "درمیانہ", l: "بڑا" }
            };
            const fl = fontLabels[lang] || fontLabels.en;
            return [
              { label: fl.s, scale: 0.9 },
              { label: fl.m, scale: 1.0 },
              { label: fl.l, scale: 1.2 }
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setFontScale(item.scale)}
                style={{
                  flex: 1, padding: "6px 0", borderRadius: 6, border: "none", cursor: "pointer",
                  fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 11,
                  background: fontScale === item.scale ? gold : "rgba(255,255,255,0.08)",
                  color: fontScale === item.scale ? forest : "#CBD9CF",
                  transition: "all 0.2s"
                }}
              >
                {item.label}
              </button>
            ));
          })()}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {items.map((it) => (
          <button
            type="button"
            key={it.id}
            onClick={() => setPage(it.id)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 12px",
              borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 6,
              background: page === it.id ? "rgba(212,160,23,0.14)" : "transparent",
              color: page === it.id ? gold : "#CBD9CF",
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 13.5, textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            {it.icon} {it.label}
          </button>
        ))}
      </div>


      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 8px" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: gold, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, color: forest, fontSize: 14 }}>
            {(user.name || "F")[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ color: "#8FA898", fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#CBD9CF", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 13, transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "#CBD9CF"}>
          <LogOut size={15} /> {t.logout}
        </button>
      </div>
    </div>
  );
}

// ---------- Dashboard ----------
function Dashboard({ user, history, goCheck, lang, documents, setDocuments, apiKey, onSaveApiKey }) {
  const t = STRINGS[lang] || STRINGS.en;
  const last = history[0];
  const ink = "#1B2B20";
  const forest = "#1F3D2B";
  const gold = "#D4A017";

  const riskLabel = (r) => (r === "Low" ? t.low : r === "Medium" ? t.medium : t.high);
  
  // Calculate Document Readiness
  const tickedDocs = Object.values(documents).filter(Boolean).length;
  const docPercentage = Math.round((tickedDocs / 5) * 100);

  // Dynamic farmer-friendly AI Summary
  const aiSummary = useMemo(() => {
    if (!last) return [];
    const summary = [];
    
    // Weather signal
    const rainVal = last.weatherData?.rain || 0;
    if (rainVal > 2) {
      summary.push(lang === "hi" ? "समय पर अनुकूल वर्षा संकेत" : lang === "bn" ? "অনুকূল বৃষ্টিপাতের সংকেত" : "Favorable rainfall signs");
    } else {
      summary.push(lang === "hi" ? "कम वर्षा संकेत (सिंचाई आवश्यक)" : lang === "bn" ? "কম বৃষ্টি (সেচ প্রয়োজন)" : "Needs water management");
    }
    
    // Soil or Crop status (using score ranges as proxy for vegetative health)
    if (last.score >= 71) {
      summary.push(lang === "hi" ? "स्वस्थ फसल हरियाली (NDVI)" : lang === "bn" ? "ফসলের স্বাস্থ্য ভালো (NDVI)" : "Healthy crop greenness");
    } else {
      summary.push(lang === "hi" ? "फसल को अतिरिक्त पोषक तत्व चाहिए" : lang === "bn" ? "ফসলে অতিরিক্ত পুষ্টি প্রয়োজন" : "Weak crop greenness");
    }
    
    // Documents completeness
    const tickedCount = Object.values(documents).filter(Boolean).length;
    const pendingCount = 5 - tickedCount;
    if (pendingCount === 0) {
      summary.push(lang === "hi" ? "सभी आवश्यक बैंक कागजात तैयार हैं" : lang === "bn" ? "সব প্রয়োজনীয় নথি প্রস্তুত আছে" : "All bank documents ready");
    } else {
      summary.push(lang === "hi" ? `${pendingCount} दस्तावेज़ तैयार करना बाकी है` : lang === "bn" ? `${pendingCount}টি নথি অসম্পূর্ণ রয়েছে` : `${pendingCount} documents pending`);
    }
    
    return summary;
  }, [last, lang, documents]);

  // Toggle checklist status
  const toggleDoc = (key) => {
    setDocuments(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="app-content">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 28, fontWeight: 700, color: ink, letterSpacing: -0.5 }}>
          {t.welcome}, {user.name.split(" ")[0]}
        </div>
        <div style={{ color: "#6b6b60", fontSize: 14.5, marginTop: 4 }}>
          {t.welcomeSub}
        </div>
      </div>

      <div className="grid-2col" style={{ marginBottom: 24 }}>
        <Card style={{ padding: 24 }}>
          {last ? (
            <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 24 }}>
              {/* Left Column: Farmer info & AI summary & chips */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  {/* Card Title */}
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 17, color: ink, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <Wheat size={18} color={forest} />
                    <span>{t.latestScore}</span>
                  </div>

                  {/* Profile info fields */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#4a4a40", marginBottom: 16 }}>
                    <div>📅 <span style={{ fontWeight: 600 }}>{t.checkedOn}:</span> {last.date}</div>
                    <div>🌾 <span style={{ fontWeight: 600 }}>{t.forCrop}:</span> {getLocalizedCrop(last.crop, lang)} · {last.land} {t.acres}</div>
                    <div>📦 <span style={{ fontWeight: 600 }}>{t.lastHarvest || "Last Harvest"}:</span> {last.harvest} {t.quintals}</div>
                    <div>💧 <span style={{ fontWeight: 600 }}>{t.irrigationMethod || "Irrigation"}:</span> {
                      IRRIGATION_I18N[lang]?.find(i => i.id === last.irrigation)?.label || last.irrigation
                    }</div>
                  </div>

                  {/* Divider line */}
                  <div style={{ height: 1, background: "#E4E0D4", margin: "12px 0" }} />

                  {/* Compact AI Summary */}
                  <div style={{ fontSize: 12.5, color: "#3B4E41" }}>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, color: forest }}>
                      ✨ AI {lang === "hi" ? "संक्षिप्त रिपोर्ट" : "Summary"}
                    </div>
                    <ul style={{ paddingLeft: 16, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                      {aiSummary.map((item, idx) => (
                        <li key={idx} style={{ listStyleType: "disc" }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Small weather, soil and docs status cards (chips) */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#EAF2EC", border: "1px solid #C4DBC8", borderRadius: 8, padding: "5px 8px", fontSize: 11, color: forest, fontWeight: 700 }}>
                    <Cloud size={12} />
                    <span>{last.weatherData?.temp}°C · {last.weatherData?.rain}mm</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: documents.soil ? "#EAF2EC" : "#FDF2F0", border: documents.soil ? "1px solid #C4DBC8" : "1px solid #F9D5D0", borderRadius: 8, padding: "5px 8px", fontSize: 11, color: documents.soil ? forest : "#B4483B", fontWeight: 700 }}>
                    <Sprout size={12} />
                    <span>{documents.soil ? (lang === "hi" ? "मिट्टी ओके" : "Soil OK") : (lang === "hi" ? "मिट्टी लंबित" : "Soil Pending")}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: tickedDocs === 5 ? "#EAF2EC" : "#FBF1DD", border: tickedDocs === 5 ? "1px solid #C4DBC8" : "1px solid #F5DEB3", borderRadius: 8, padding: "5px 8px", fontSize: 11, color: tickedDocs === 5 ? forest : gold, fontWeight: 700 }}>
                    <FileText size={12} />
                    <span>{tickedDocs}/5 {lang === "hi" ? "दस्तावेज़" : "Docs"}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Score Dial & Button aligned right below the score dial */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", borderLeft: "1px solid #E4E0D4", paddingLeft: 16 }}>
                <ScoreDial score={last.score} risk={last.risk} lang={lang} />
                <PrimaryButton onClick={goCheck} style={{ width: "100%", marginTop: 12 }}>
                  <Plus size={16} /> {t.runNewCheck}
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 20px", textAlign: "center" }}>
              <Sprout size={40} color={forest} style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 700, fontSize: 16, color: ink, marginBottom: 8 }}>{t.noScoreYet}</div>
              <div style={{ fontSize: 13, color: "#6b6b60", maxWidth: 360, marginBottom: 16, lineHeight: 1.5 }}>
                {t.runFirstCheck}
              </div>
              <PrimaryButton onClick={goCheck}>
                <Plus size={16} /> {t.checkMyScore}
              </PrimaryButton>
            </div>
          )}
        </Card>

        {/* Dashboard Stat Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="grid-2col-equal">
            <Card style={{ padding: 18, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "#EAF2EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <HistoryIcon size={20} color={forest} />
              </div>
              <div>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 22, color: ink, lineHeight: 1 }}>{history.length}</div>
                <div style={{ color: "#6b6b60", fontSize: 12.5, marginTop: 4 }}>{t.totalChecks}</div>
              </div>
            </Card>

            <Card style={{ padding: 18, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "#FBF1DD", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wheat size={20} color={gold} />
              </div>
              <div>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 19, color: ink, lineHeight: 1 }}>
                  {last ? `${riskLabel(last.risk)} ${t.risk}` : "—"}
                </div>
                <div style={{ color: "#6b6b60", fontSize: 12.5, marginTop: 4 }}>{t.currentRisk}</div>
              </div>
            </Card>
          </div>

          {/* Compliance meter card */}
          <Card style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: ink, fontFamily: "Space Grotesk, sans-serif" }}>{t.progressTitle}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: forest }}>{docPercentage}%</span>
            </div>
            <div style={{ width: "100%", height: 8, background: "#EAF0EC", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ width: `${docPercentage}%`, height: "100%", background: forest, borderRadius: 4, transition: "width 0.4s ease" }} />
            </div>
            <div style={{ fontSize: 11.5, color: "#7a7a6c" }}>
              {t.docChecklistStatus ? t.docChecklistStatus.replace("{count}", tickedDocs) : `${tickedDocs} of 5 bank criteria satisfied. Update checklist below to sync.`}
            </div>
          </Card>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        {/* Prerequisite checklist */}
        <Card>
          <div style={{ borderBottom: "1px solid #E4E0D4", paddingBottom: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 16, color: ink }}>
              <CheckSquare size={18} color={forest} /> {t.docChecklist}
            </div>
            <div style={{ color: "#6b6b60", fontSize: 12.5, marginTop: 4 }}>{t.docChecklistSub}</div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {[
              { key: "land", label: t.landRecord },
              { key: "id", label: t.idProof },
              { key: "nodues", label: t.noDueCert },
              { key: "soil", label: t.soilCard },
              { key: "bank", label: t.bankAccount }
            ].map((item) => (
              <label key={item.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13.5, color: "#3d3d34", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={documents[item.key]}
                  onChange={() => toggleDoc(item.key)}
                  style={{ marginTop: 3, cursor: "pointer", accentColor: forest }}
                />
                <span style={{ fontWeight: documents[item.key] ? 600 : 400 }}>{item.label}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// New fields localization helper
const NEW_FIELDS_I18N = {
  en: {
    phoneNumber: "Phone Number",
    district: "District",
    state: "State",
    annualIncome: "Annual Income (₹ / Year)",
    existingLoans: "Outstanding Existing Loans (₹)",
    creditHistory: "Credit Repayment History",
    requiredLoanAmount: "Required Loan Amount (₹)",
    creditGood: "Good (No defaults, regular repayments)",
    creditMedium: "Medium (Occasional delay, no defaults)",
    creditPoor: "Poor (Past default / Write-off / High risk)",
    phonePlaceholder: "e.g. 9876543210",
    districtPlaceholder: "e.g. Ludhiana",
    statePlaceholder: "e.g. Punjab",
    incomePlaceholder: "e.g. 350000",
    loansPlaceholder: "e.g. 50000",
    requiredPlaceholder: "e.g. 150000",
    deleteConfirm: "Are you sure you want to delete this assessment?",
    deleteFailed: "Could not delete history record.",
    saving: "Saving record...",
    saveSuccess: "Saved to secure database."
  },
  hi: {
    phoneNumber: "फ़ोन नंबर",
    district: "जिला",
    state: "राज्य",
    annualIncome: "वार्षिक आय (₹ / वर्ष)",
    existingLoans: "वर्तमान पुराना कर्ज (₹)",
    creditHistory: "पिछला लोन रिकॉर्ड (क्रेडिट इतिहास)",
    requiredLoanAmount: "लोन की आवश्यकता (₹)",
    creditGood: "अच्छा (समय पर भुगतान, कोई बकाया नहीं)",
    creditMedium: "मध्यम (देरी से भुगतान, कोई चूक नहीं)",
    creditPoor: "खराब (बकाया राशि / डिफॉल्ट / उच्च जोखिम)",
    phonePlaceholder: "जैसे: 9876543210",
    districtPlaceholder: "जैसे: लुधियाना",
    statePlaceholder: "जैसे: पंजाब",
    incomePlaceholder: "जैसे: 350000",
    loansPlaceholder: "जैसे: 50000",
    requiredPlaceholder: "जैसे: 150000",
    deleteConfirm: "क्या आप इस रिकॉर्ड को हटाना चाहते हैं?",
    deleteFailed: "रिकॉर्ड हटाने में त्रुटि हुई।",
    saving: "रिकॉर्ड सहेज रहे हैं...",
    saveSuccess: "सुरक्षित डेटाबेस में सहेजा गया।"
  },
  bn: {
    phoneNumber: "ফোন নম্বর",
    district: "জেলা",
    state: "রাজ্য",
    annualIncome: "বার্ষিক আয় (₹ / বছর)",
    existingLoans: "বর্তমান বকেয়া ঋণ (₹)",
    creditHistory: "ক্রেডিট হিস্ট্রি (ঋণ পরিশোধের রেকর্ড)",
    requiredLoanAmount: "প্রয়োজনীয় ঋণের পরিমাণ (₹)",
    creditGood: "ভালো (সময়মতো পরিশোধ, কোনো বকেয়া নেই)",
    creditMedium: "মাঝারি (মাঝে মাঝে দেরি, কোনো খেলাপি নেই)",
    creditPoor: "খারাপ (পূর্ববর্তী খেলাপি / উচ্চ ঝুঁকি)",
    phonePlaceholder: "যেমন: 9876543210",
    districtPlaceholder: "যেমন: লুধিয়ানা",
    statePlaceholder: "যেমন: পাঞ্জাব",
    incomePlaceholder: "যেমন: 350000",
    loansPlaceholder: "যেমন: 50000",
    requiredPlaceholder: "যেমন: 150000",
    deleteConfirm: "আপনি কি এই মূল্যায়ন রেকর্ডটি মুছে ফেলতে চান?",
    deleteFailed: "রেকর্ডটি মোছা যায়নি।",
    saving: "সংরক্ষণ করা হচ্ছে...",
    saveSuccess: "ডাটাবেসে সফলভাবে সংরক্ষিত।"
  }
};

// ---------- Assessment Form (Inputs + Voice Parsing) ----------
function CheckForm({ onSubmit, lang, documents, apiKey, API_BASE = "http://localhost:5000/api" }) {
  const t = STRINGS[lang] || STRINGS.en;
  const f = NEW_FIELDS_I18N[lang] || NEW_FIELDS_I18N.en;
  const crops = CROPS_I18N[lang] || CROPS_I18N.en;
  const irrigationList = IRRIGATION_I18N[lang] || IRRIGATION_I18N.en;
  const ink = "#1B2B20";
  const forest = "#1F3D2B";
  const gold = "#D4A017";

  const [phoneNumber, setPhoneNumber] = useState("9876543210");
  const [location, setLocation] = useState("Ludhiana");
  const [district, setDistrict] = useState("Ludhiana");
  const [state, setState] = useState("Punjab");
  const [crop, setCrop] = useState(crops[0]);
  const [land, setLand] = useState("3");
  const [harvest, setHarvest] = useState("75");
  const [irrigation, setIrrigation] = useState(irrigationList[2].id);
  const [annualIncome, setAnnualIncome] = useState("350000");
  const [existingLoans, setExistingLoans] = useState("0");
  const [creditHistory, setCreditHistory] = useState("Good");
  const [requiredLoanAmount, setRequiredLoanAmount] = useState("150000");

  const phoneRegex = /^[0-9]{10}$/;
  const isPhoneValid = phoneRegex.test(phoneNumber);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(value);
  };

  // Weather Geocode & Fetch Loading States
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  // Sync crop value if language updates crop lists
  useEffect(() => {
    setCrop(crops[0]);
  }, [lang]);

  const submit = async (e) => {
    e.preventDefault();
    
    if (!phoneRegex.test(phoneNumber)) {
      return;
    }

    const finalLoc = location.trim() || "Ludhiana";
    const finalLand = land || "3";
    const finalHarvest = harvest || "75";
    const finalPhone = phoneNumber;
    const finalDistrict = district.trim() || "Ludhiana";
    const finalState = state.trim() || "Punjab";
    const finalIncome = annualIncome || "350000";
    const finalRequired = requiredLoanAmount || "150000";
    const finalExisting = existingLoans || "0";

    setWeatherLoading(true);
    setLoadingText(t.fetchingWeather);

    let weatherResult = { success: false };
    try {
      setLoadingText(t.linkedToRegion.replace("{region}", finalLoc));
      weatherResult = await fetchWeatherData(finalLoc, apiKey);
      // Simulate delay to display premium credit analysis telemetry
      await new Promise(resolve => setTimeout(resolve, 1200));
    } catch (err) {
      console.warn("Weather integration failed", err);
    }

    setWeatherLoading(false);
    onSubmit({
      location: finalLoc,
      crop,
      land: finalLand,
      harvest: finalHarvest,
      irrigation,
      phoneNumber: finalPhone,
      district: finalDistrict,
      state: finalState,
      annualIncome: finalIncome,
      existingLoans: finalExisting,
      creditHistory,
      requiredLoanAmount: finalRequired,
      weather: weatherResult
    });
  };

  if (weatherLoading) {
    return (
      <div className="app-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", fontFamily: "Inter, sans-serif" }}>
        <div style={{ position: "relative", width: 80, height: 80, marginBottom: 24 }}>
          <div className="animate-spin" style={{ position: "absolute", width: "100%", height: "100%", border: `4px solid #EAF0EC`, borderTop: `4px solid ${forest}`, borderRadius: "50%" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            <Sprout color={gold} size={28} />
          </div>
        </div>
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 700, color: ink, marginBottom: 8, textAlign: "center" }}>
          Analyzing Agricultural Credit Readiness...
        </div>
        <div style={{ color: "#7a7a6c", fontSize: 13.5, maxWidth: 380, textAlign: "center", lineHeight: 1.6 }}>
          {loadingText}
        </div>
        
        {/* Loading Skeleton */}
        <div style={{ width: "100%", maxWidth: 440, marginTop: 24, padding: 16, border: "1px solid #E4E0D4", borderRadius: 12, background: "#FFFFFF" }}>
          <div style={{ height: 12, background: "#F1EFE6", borderRadius: 4, width: "70%", marginBottom: 12 }} className="animate-pulse" />
          <div style={{ height: 10, background: "#F1EFE6", borderRadius: 4, width: "90%", marginBottom: 8 }} className="animate-pulse" />
          <div style={{ height: 10, background: "#F1EFE6", borderRadius: 4, width: "50%" }} className="animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-content">
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 26, fontWeight: 700, color: ink, marginBottom: 4, letterSpacing: -0.5 }}>
        {t.checkTitle}
      </div>
      <div style={{ color: "#6b6b60", fontSize: 14, marginBottom: 24, maxWidth: 640 }}>
        {t.checkSub}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Card>
          <form onSubmit={submit}>
            {/* Personal & Farm Location */}
            <div style={{ fontWeight: 700, fontSize: 15, color: forest, marginBottom: 16, borderBottom: "2px solid #E4E0D4", paddingBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>
              1. Personal & Location Details
            </div>
            
            <div className="grid-2col-equal">
              <Field label={f.phoneNumber} icon={<UserIcon size={13} />}>
                <input
                  style={{
                    ...inputStyle,
                    borderColor: !isPhoneValid ? "#B4483B" : "#E4E0D4"
                  }}
                  required
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder={f.phonePlaceholder}
                />
                {!isPhoneValid && (
                  <div style={{ color: "#B4483B", fontSize: 13, marginTop: 6, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                    <span>⚠</span> Phone number must be exactly 10 digits.
                  </div>
                )}
              </Field>
              <Field label={t.village} icon={<MapPin size={13} />}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input style={inputStyle} required value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t.villagePlaceholder || "e.g. Ludhiana, Punjab"} />
                  <VoiceFieldButton lang={lang} fieldType="text" fieldName={t.village} onValueCaptured={(val) => setLocation(val)} />
                </div>
              </Field>
            </div>

            <div className="grid-2col-equal">
              <Field label={f.district} icon={<MapPin size={13} />}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input style={inputStyle} required value={district} onChange={(e) => setDistrict(e.target.value)} placeholder={f.districtPlaceholder} />
                  <VoiceFieldButton lang={lang} fieldType="text" fieldName={f.district} onValueCaptured={(val) => setDistrict(val)} />
                </div>
              </Field>
              <Field label={f.state} icon={<MapPin size={13} />}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input style={inputStyle} required value={state} onChange={(e) => setState(e.target.value)} placeholder={f.statePlaceholder} />
                  <VoiceFieldButton lang={lang} fieldType="text" fieldName={f.state} onValueCaptured={(val) => setState(val)} />
                </div>
              </Field>
            </div>

            {/* Farm Diagnostics */}
            <div style={{ fontWeight: 700, fontSize: 15, color: forest, marginTop: 12, marginBottom: 16, borderBottom: "2px solid #E4E0D4", paddingBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>
              2. Agricultural Telemetries
            </div>

            <Field label={t.cropType} icon={<Sprout size={13} />}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select style={inputStyle} value={crop} onChange={(e) => setCrop(e.target.value)}>
                  {crops.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <VoiceFieldButton lang={lang} fieldType="text" fieldName={t.cropType} onValueCaptured={(val) => {
                  const matched = crops.find(c => c.toLowerCase().includes(val.toLowerCase()) || val.toLowerCase().includes(c.toLowerCase()));
                  if (matched) setCrop(matched);
                }} />
              </div>
            </Field>

            <div className="grid-2col-equal">
              <Field label={t.landSize} icon={<Wheat size={13} />}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input style={inputStyle} required type="number" step="any" min="0.1" value={land} onChange={(e) => setLand(e.target.value)} placeholder="3" />
                  <VoiceFieldButton lang={lang} fieldType="number" fieldName={t.landSize} onValueCaptured={(val) => setLand(val)} />
                </div>
              </Field>
              <Field label={t.lastHarvest} icon={<TrendingUp size={13} />}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input style={inputStyle} required type="number" min="0" value={harvest} onChange={(e) => setHarvest(e.target.value)} placeholder="75" />
                  <VoiceFieldButton lang={lang} fieldType="number" fieldName={t.lastHarvest} onValueCaptured={(val) => setHarvest(val)} />
                </div>
              </Field>
            </div>

            <Field label={t.irrigationMethod} icon={<Droplets size={13} />}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select style={inputStyle} value={irrigation} onChange={(e) => setIrrigation(e.target.value)}>
                  {irrigationList.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
                </select>
                <VoiceFieldButton lang={lang} fieldType="text" fieldName={t.irrigationMethod} onValueCaptured={(val) => {
                  const v = val.toLowerCase();
                  if (v.includes("drip")) setIrrigation("drip");
                  else if (v.includes("sprinkler")) setIrrigation("sprinkler");
                  else if (v.includes("rain")) setIrrigation("rainfed");
                  else setIrrigation("canal");
                }} />
              </div>
            </Field>

            {/* Financial Parameters */}
            <div style={{ fontWeight: 700, fontSize: 15, color: forest, marginTop: 12, marginBottom: 16, borderBottom: "2px solid #E4E0D4", paddingBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>
              3. Financial & Debt Profiling
            </div>

            <div className="grid-2col-equal">
              <Field label={f.annualIncome} icon={<TrendingUp size={13} />}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input style={inputStyle} required type="number" min="0" value={annualIncome} onChange={(e) => setAnnualIncome(e.target.value)} placeholder={f.incomePlaceholder} />
                  <VoiceFieldButton lang={lang} fieldType="currency" fieldName={f.annualIncome} onValueCaptured={(val) => setAnnualIncome(val)} />
                </div>
              </Field>
              <Field label={f.requiredLoanAmount} icon={<TrendingUp size={13} />}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input style={inputStyle} required type="number" min="1" value={requiredLoanAmount} onChange={(e) => setRequiredLoanAmount(e.target.value)} placeholder={f.requiredPlaceholder} />
                  <VoiceFieldButton lang={lang} fieldType="currency" fieldName={f.requiredLoanAmount} onValueCaptured={(val) => setRequiredLoanAmount(val)} />
                </div>
              </Field>
            </div>

            <div className="grid-2col-equal">
              <Field label={f.existingLoans} icon={<TrendingUp size={13} />}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input style={inputStyle} required type="number" min="0" value={existingLoans} onChange={(e) => setExistingLoans(e.target.value)} placeholder={f.loansPlaceholder} />
                  <VoiceFieldButton lang={lang} fieldType="currency" fieldName={f.existingLoans} onValueCaptured={(val) => setExistingLoans(val)} />
                </div>
              </Field>
              <Field label={f.creditHistory} icon={<ClipboardCheck size={13} />}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <select style={inputStyle} value={creditHistory} onChange={(e) => setCreditHistory(e.target.value)}>
                    <option value="Good">{f.creditGood}</option>
                    <option value="Medium">{f.creditMedium}</option>
                    <option value="Poor">{f.creditPoor}</option>
                  </select>
                  <VoiceFieldButton lang={lang} fieldType="text" fieldName={f.creditHistory} onValueCaptured={(val) => {
                    const v = val.toLowerCase();
                    if (v.includes("poor") || v.includes("bad") || v.includes("कमजोर")) setCreditHistory("Poor");
                    else if (v.includes("medium") || v.includes("मध्यम")) setCreditHistory("Medium");
                    else setCreditHistory("Good");
                  }} />
                </div>
              </Field>
            </div>

            <PrimaryButton type="submit" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
              <Cloud size={16} /> {t.fetchGenerate}
            </PrimaryButton>
          </form>
        </Card>

        {/* Compliance notice */}
        <Card style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Info size={20} color={gold} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: ink, display: "block" }}>{t.complianceSyncActive}</span>
            <span style={{ fontSize: 12.5, color: "#6b6b60", display: "block", marginTop: 4, lineHeight: 1.5 }}>
              {t.complianceSyncSub.replace("{count}", Object.values(documents).filter(Boolean).length)}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- Results Display (XAI Breakdown + AI Coach Simulator) ----------
function ResultView({ result, onBack, onSave, lang, documents, API_BASE = "http://localhost:5000/api" }) {
  const t = STRINGS[lang] || STRINGS.en;
  const ink = "#1B2B20";
  const forest = "#1F3D2B";

  const [potentialScore, setPotentialScore] = useState(result.score);
  const [aiData, setAiData] = useState(result.aiExplanation || null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  const fetchAIExplanation = async () => {
    setAiLoading(true);
    setAiError(false);
    try {
      const payload = {
        score: result.score,
        riskCategory: result.risk,
        eligibility: result.eligibility,
        reasons: result.reasons || [],
        suggestions: result.suggestions || [],
        recommendations: result.recommendations || [],
        farmData: {
          location: result.location,
          crop: result.crop,
          land: result.land,
          harvest: result.harvest,
          irrigation: result.irrigation,
          annualIncome: result.annualIncome,
          existingLoans: result.existingLoans,
          creditHistory: result.creditHistory,
          requiredLoanAmount: result.requiredLoanAmount
        },
        documents: documents || {},
        language: lang === "hi" ? "Hindi" : lang === "bn" ? "Bengali" : "English"
      };

      const res = await axios.post(`${API_BASE}/ai/explanation`, payload);
      if (res.data && res.data.success && res.data.data) {
        setAiData(res.data.data);
        result.aiExplanation = res.data.data;
        result.aiLanguage = lang;
      } else {
        setAiError(true);
      }
    } catch (err) {
      console.warn("AI Explanation call warning:", err.message);
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!aiData && !aiLoading) {
      fetchAIExplanation();
    }
  }, [result.score, result.risk, lang]);

  // TTS Readout Trigger
  const speakAll = () => {
    let text = "";
    if (lang === "en") {
      text = `Your credit readiness score is ${result.score} out of 100, indicating a ${result.risk} risk profile. Data confidence is high. Key analysis: ${result.reasons.map(r => r.text).join(". ")}. Key suggestions: ${result.suggestions.join(". ")}`;
    } else if (lang === "hi") {
      const rLabel = result.risk === "Low" ? "कम" : result.risk === "Medium" ? "मध्यम" : "अधिक";
      text = `आपका ऋण तैयारी स्कोर 100 में से ${result.score} है, जो ${rLabel} ऋण जोखिम श्रेणी दिखाता है। मुख्य विश्लेषण: ${result.reasons.map(r => r.text).join(". ")}. मुख्य सुझाव: ${result.suggestions.join(". ")}`;
    } else if (lang === "bn") {
      const rLabel = result.risk === "Low" ? "কম" : result.risk === "Medium" ? "মাঝারি" : "উচ্চ";
      text = `আপনার কৃষি ঋণ যোগ্যতা স্কোর ১০০ এর মধ্যে ${result.score}, যা একটি ${rLabel} ঋণ ঝুঁকি নির্দেশ করে। মূল কারণসমূহ: ${result.reasons.map(r => r.text).join(". ")}. মূল সুপারিশ: ${result.suggestions.join(". ")}`;
    }
    speak(text, lang);
  };

  return (
    <div className="app-content">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 26, fontWeight: 700, color: ink, letterSpacing: -0.5 }}>
          {t.resultTitle}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <IconButton onClick={speakAll} title={t.listen}>
            <Volume2 size={16} />
          </IconButton>
          <PrimaryButton onClick={() => downloadReport(result, documents, lang)} style={{ background: "transparent", color: forest, border: `1px solid #E4E0D4` }}>
            <Download size={16} /> {t.downloadPdf}
          </PrimaryButton>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
        <LoanScoreCard result={result} potentialScore={potentialScore} lang={lang} />

        <AIExplanation
          aiData={aiData}
          loading={aiLoading}
          error={aiError}
          onRetry={fetchAIExplanation}
          score={result.score}
          risk={result.risk}
          lang={lang}
        />

        <div className="grid-2col">
          <LoanCoach
            result={result}
            documents={documents}
            lang={lang}
            onChangePotentialScore={setPotentialScore}
          />
          <GovernmentSchemes result={result} lang={lang} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <PrimaryButton onClick={onSave}>{t.saveHistory}</PrimaryButton>
        <PrimaryButton onClick={onBack} style={{ background: "transparent", color: forest, border: `1px solid #E4E0D4` }}>
          {t.backDashboard}
        </PrimaryButton>
      </div>
    </div>
  );
}


// ---------- Assessment History ----------
function HistoryView({ history, goCheck, lang, documents, onDeleteHistory, user }) {
  const t = STRINGS[lang] || STRINGS.en;
  const ink = "#1B2B20";
  const forest = "#1F3D2B";

  const riskLabel = (r) => (r === "Low" ? t.low : r === "Medium" ? t.medium : r === "High" ? t.high : t.high);

  return (
    <div className="app-content">
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 26, fontWeight: 700, color: ink, marginBottom: 4, letterSpacing: -0.5 }}>
        {t.historyTitle}
      </div>
      <div style={{ color: "#6b6b60", fontSize: 14, marginBottom: 24 }}>
        {t.historySub}
      </div>

      {history.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ color: "#6b6b60", fontSize: 14, marginBottom: 16 }}>{t.noChecksYet}</div>
          <PrimaryButton onClick={goCheck} style={{ margin: "0 auto" }}>
            <Plus size={16} /> {t.checkMyScore}
          </PrimaryButton>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {history.map((h, i) => {
            const riskColor = h.risk === "Low" ? "#3B7A57" : h.risk === "Medium" ? "#C98A2B" : "#B4483B";
            return (
              <Card key={h.id || i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 18, transition: "transform 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 10, background: "#F7F5EF", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, color: forest, fontSize: 16, border: "1px solid #E4E0D4" }}>
                    {h.score}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: ink, fontFamily: "Space Grotesk, sans-serif" }}>
                      {getLocalizedCrop(h.crop || h.cropType, lang)} · {getLocalizedLocation(h.location || h.village, lang)}
                    </div>
                    <div style={{ color: "#8a8a7c", fontSize: 12, marginTop: 2 }}>
                      {h.date || new Date(h.timestamp).toLocaleDateString()} · {h.land || h.farmSize} {t.acres} · {h.harvest} {t.quintals || "quintals"}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ color: riskColor, fontWeight: 700, fontSize: 13, fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {riskLabel(h.risk)} {t.risk}
                  </div>
                  <IconButton
                    onClick={() => downloadReport(h, user, documents, lang)}
                    title={t.downloadPdf || "Download PDF"}
                    style={{ border: "1px solid #E4E0D4" }}
                  >
                    <Download size={15} />
                  </IconButton>
                  <IconButton
                    onClick={() => onDeleteHistory && onDeleteHistory(h.id, i)}
                    title="Delete Record"
                    style={{ border: "1px solid #F0C4C4", color: "#B4483B" }}
                  >
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Main App Wrapper ----------
export default function App() {
  const [lang, setLang] = useState("hi");
  const [user, setUser] = useState(null);

  // URL Hash Sync for robust navigation & page refresh retention
  const getPageFromHash = () => {
    const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase();
    if (["dashboard", "check", "history", "result"].includes(hash)) {
      return hash;
    }
    return "dashboard";
  };

  const [page, setPageState] = useState(getPageFromHash);

  const setPage = (newPage) => {
    setPageState(newPage);
    try {
      window.location.hash = newPage;
    } catch (e) {
      // ignore hash write errors if restricted
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = getPageFromHash();
      setPageState(currentHash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Mobile responsive sidebar toggle
  const [mobileOpen, setMobileOpen] = useState(false);

  // OpenWeather API key
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("agriscore_openweather_key") || import.meta.env.VITE_OPENWEATHER_API_KEY || "";
  });


  // Global Compliance checklist state loaded from localstorage
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem("agriscore_documents");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      land: true,
      id: true,
      nodues: false,
      soil: false,
      bank: true
    };
  });

  const API_BASE = "http://localhost:5000/api";
  const [firebaseAuth, setFirebaseAuth] = useState(null);

  // Previous checks loaded from localstorage / backend
  const [history, setHistory] = useState([]);
  const [pendingResult, setPendingResult] = useState(null);

  // Global Accessibility Font Scale
  const [fontScale, setFontScale] = useState(() => {
    const saved = localStorage.getItem("agriscore_font_scale");
    return saved ? parseFloat(saved) : 1.0;
  });



  // Sync state modifications to localstorage
  useEffect(() => {
    localStorage.setItem("agriscore_documents", JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem("agriscore_font_scale", fontScale.toString());
  }, [fontScale]);

  // Initialize Firebase Auth dynamically from backend config
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const res = await axios.get(`${API_BASE}/config/firebase`);
        const { config } = res.data;
        if (config && config.apiKey) {
          const app = initializeApp(config);
          const auth = getAuth(app);
          setFirebaseAuth(auth);
          
          // Setup auth state change listener to sync user session
          onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
              setUser({
                name: currentUser.displayName || currentUser.email.split("@")[0],
                email: currentUser.email,
                uid: currentUser.uid
              });
            } else {
              setUser(null);
              setHistory([]);
            }
          });
        } else {
          console.warn("⚠️ Firebase Web API Key is missing. Live authentication is disabled.");
        }
      } catch (err) {
        console.error("Failed to fetch Firebase config or initialize auth:", err);
      }
    };
    initFirebase();
  }, []);

  const getAuthHeaders = async () => {
    if (firebaseAuth && firebaseAuth.currentUser) {
      const token = await firebaseAuth.currentUser.getIdToken(true);
      return { headers: { Authorization: `Bearer ${token}` } };
    }
    return {};
  };

  // Load history from Firestore backend when user is logged in
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const headers = await getAuthHeaders();
        const res = await axios.get(`${API_BASE}/farmers`, headers);
        if (res.data && res.data.success && res.data.data.length > 0) {
          setHistory(res.data.data);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.warn("Failed to fetch history from backend.", err);
        setHistory([]);
      }
    };
    fetchHistory();
  }, [user, firebaseAuth, lang]);

  const handleCheckSubmit = async (form) => {
    const tickedCount = Object.values(documents).filter(Boolean).length;
    
    try {
      const payload = {
        ...form,
        tickedCount,
        lang,
        farmerName: user?.name || "",
        farmerEmail: user?.email || ""
      };

      const res = await axios.post(`${API_BASE}/score`, payload);
      
      if (res.data && res.data.success) {
        setPendingResult({
          ...res.data,
          ...form,
          farmerName: user?.name || "",
          farmerEmail: user?.email || "",
          weatherData: form.weather && form.weather.success ? form.weather : null,
          date: new Date().toLocaleDateString()
        });
        setPage("result");
      } else {
        throw new Error("Backend did not return success status");
      }
    } catch (err) {
      console.error("API score calculation failed. Falling back to local calculator.", err);
      // Fallback to local calculation so the app never breaks
      const scoreResult = computeScore({ ...form, tickedCount, lang });
      setPendingResult({
        ...scoreResult,
        ...form,
        farmerName: user?.name || "",
        farmerEmail: user?.email || "",
        weatherData: form.weather && form.weather.success ? form.weather : null,
        date: new Date().toLocaleDateString()
      });
      setPage("result");
    }
  };

  const saveToHistory = async () => {
    if (pendingResult) {
      try {
        const tickedDocsList = Object.keys(documents).filter(key => documents[key]);
        const payload = {
          farmerName: pendingResult.farmerName || user?.name || "Unknown Farmer",
          phoneNumber: pendingResult.phoneNumber || "",
          village: pendingResult.location || "",
          district: pendingResult.district || "",
          state: pendingResult.state || "",
          farmSize: parseFloat(pendingResult.land) || 0,
          cropType: pendingResult.crop || "",
          annualIncome: parseFloat(pendingResult.annualIncome) || 0,
          existingLoans: parseFloat(pendingResult.existingLoans) || 0,
          creditHistory: pendingResult.creditHistory || "Good",
          requiredLoanAmount: parseFloat(pendingResult.requiredLoanAmount) || 0,
          uploadedDocuments: tickedDocsList,
          score: pendingResult.score,
          risk: pendingResult.risk,
          eligibility: pendingResult.eligibility,
          recommendations: pendingResult.recommendations || [],
          reasons: pendingResult.reasons || [],
          suggestions: pendingResult.suggestions || [],
          harvest: parseFloat(pendingResult.harvest) || 0,
          irrigation: pendingResult.irrigation || "canal",
          weather: pendingResult.weatherData || null,
          date: pendingResult.date
        };

        const headers = await getAuthHeaders();
        const res = await axios.post(`${API_BASE}/farmers`, payload, headers);
        if (res.data && res.data.success) {
          setHistory((h) => [res.data.data, ...h]);
        }
      } catch (err) {
        console.error("Failed to save record to backend. Saving locally instead.", err);
        setHistory((h) => [pendingResult, ...h]);
      }
    }
    setPage("dashboard");
  };

  const deleteHistory = async (id, index) => {
    const fDict = NEW_FIELDS_I18N[lang] || NEW_FIELDS_I18N.en;
    if (!window.confirm(fDict.deleteConfirm)) return;

    if (id && typeof id === "string" && id.length > 5) {
      try {
        const headers = await getAuthHeaders();
        const res = await axios.delete(`${API_BASE}/farmers/${id}`, headers);
        if (res.data && res.data.success) {
          setHistory((h) => h.filter((item) => item.id !== id));
        }
      } catch (err) {
        console.error("Failed to delete from backend.", err);
        alert(fDict.deleteFailed);
      }
    } else {
      setHistory((h) => h.filter((_, idx) => idx !== index));
    }
  };

  const handleAuth = async ({ name, email, password, mode }) => {
    if (!firebaseAuth) {
      setUser({
        name: name || (email ? email.split("@")[0] : "Farmer"),
        email: email || "farmer@village.com",
        uid: "guest-user-id"
      });
      return;
    }
    if (mode === "login") {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } else {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      setUser({
        name: name,
        email: email,
        uid: userCredential.user.uid
      });
    }
  };

  const handleLogout = async () => {
    if (firebaseAuth) {
      await signOut(firebaseAuth);
    }
    setUser(null);
    setHistory([]);
    setPage("dashboard");
  };

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem("agriscore_openweather_key", key);
  };

  if (!user) {
    return <AuthScreen onAuth={handleAuth} lang={lang} setLang={setLang} fontScale={fontScale} />;
  }

  const bg = "#F7F5EF";

  return (
    <div className="app-layout" style={{ background: bg, fontSize: `${14 * fontScale}px`, zoom: fontScale, transition: "all 0.2s ease" }}>
      
      {/* Mobile Header */}
      <div className="mobile-header">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sprout color="#D4A017" size={20} />
          <span style={{ color: "#fff", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 16.5 }}>{STRINGS[lang]?.appName || "AgriScore AI"}</span>
        </div>
        <div style={{ width: 24 }} /> {/* Spacer */}
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} style={{ display: "none" }} />
      )}

      <Sidebar
        page={page === "result" ? "check" : page}
        setPage={(p) => { setPage(p); setMobileOpen(false); }}
        user={user}
        onLogout={handleLogout}
        lang={lang}
        setLang={setLang}
        fontScale={fontScale}
        setFontScale={setFontScale}
        mobileOpen={mobileOpen}
      />
      {page === "dashboard" && (
        <Dashboard
          user={user}
          history={history}
          goCheck={() => setPage("check")}
          lang={lang}
          documents={documents}
          setDocuments={setDocuments}
          apiKey={apiKey}
          onSaveApiKey={handleSaveApiKey}
        />
      )}
      {page === "check" && (
        <CheckForm
          onSubmit={handleCheckSubmit}
          lang={lang}
          documents={documents}
          apiKey={apiKey}
          API_BASE={API_BASE}
        />
      )}
      {page === "result" && pendingResult && (
        <ResultView
          result={pendingResult}
          onBack={() => setPage("dashboard")}
          onSave={saveToHistory}
          lang={lang}
          documents={documents}
          API_BASE={API_BASE}
        />
      )}
      {page === "history" && (
        <HistoryView
          history={history}
          goCheck={() => setPage("check")}
          lang={lang}
          documents={documents}
          onDeleteHistory={deleteHistory}
          user={user}
        />
      )}
    </div>
  );
}
