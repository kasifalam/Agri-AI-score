import React, { useState } from "react";
import { Mic, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { useSpeechInput, parseSpokenFieldValue } from "../services/voiceService";

/**
 * VoiceFieldButton Component
 * Renders a small microphone button beside individual form fields.
 * Supports intelligent speech-to-text/number parsing, clear visual states, and browser fallbacks.
 */
export default function VoiceFieldButton({ lang, fieldType = "text", fieldName = "Field", onValueCaptured }) {
  const [status, setStatus] = useState("idle"); // 'idle' | 'listening' | 'success' | 'error'
  const [capturedText, setCapturedText] = useState("");

  const handleSpeechResult = (spokenText) => {
    if (!spokenText) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
      return;
    }

    setCapturedText(spokenText);
    const parsed = parseSpokenFieldValue(spokenText, fieldType);
    
    if (parsed) {
      setStatus("success");
      onValueCaptured(parsed);
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  const { start, stop, listening, errorMessage, isSupported } = useSpeechInput(lang, handleSpeechResult);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported) {
      alert("Voice input is not supported in this browser. Please enter the information manually.");
      return;
    }

    if (listening) {
      stop();
      setStatus("idle");
    } else {
      setStatus("listening");
      start();
    }
  };

  const forest = "#1F3D2B";

  if (!isSupported) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title="Voice input not supported in this browser. Manual input available."
        style={{
          background: "#F5F5F0",
          color: "#A0A090",
          border: "1px solid #E4E0D4",
          borderRadius: 8,
          padding: "6px 8px",
          cursor: "not-allowed",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12
        }}
      >
        <Mic size={14} />
      </button>
    );
  }

  if (listening || status === "listening") {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={`Listening for ${fieldName}... Click to stop.`}
        style={{
          background: "#B4483B",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 8,
          padding: "5px 10px",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11.5,
          fontWeight: 700,
          boxShadow: "0 0 8px rgba(180, 72, 59, 0.4)",
          animation: "pulse 1.2s infinite"
        }}
      >
        <RefreshCw size={12} className="animate-spin" />
        <span>Listening...</span>
      </button>
    );
  }

  if (status === "success") {
    return (
      <span
        style={{
          background: "#EAF2EC",
          color: "#2E7D32",
          border: "1px solid #C8E6C9",
          borderRadius: 8,
          padding: "5px 8px",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11.5,
          fontWeight: 700
        }}
      >
        <CheckCircle2 size={13} /> Added
      </span>
    );
  }

  if (status === "error" || errorMessage) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={errorMessage || "Could not understand. Click to try again."}
        style={{
          background: "#FFFBF0",
          color: "#D84315",
          border: "1px solid #FFCC80",
          borderRadius: 8,
          padding: "5px 8px",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11.5,
          fontWeight: 600
        }}
      >
        <AlertTriangle size={13} /> Try again
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Speak ${fieldName}`}
      style={{
        background: "#F0F4F1",
        color: forest,
        border: "1px solid #C5DBD0",
        borderRadius: 8,
        padding: "6px 9px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        fontSize: 12,
        fontWeight: 600,
        transition: "all 0.15s ease-in-out"
      }}
    >
      <Mic size={14} />
    </button>
  );
}
