import React from "react";
import { Bot, CheckCircle2, AlertTriangle, Sparkles, Clock, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";

/**
 * AIExplanation Component
 * Renders LLM-generated explanation, strengths, areas to improve, recommendations, and priority actions.
 * Never modifies or recalculates the score.
 */
export default function AIExplanation({ aiData, loading, error, onRetry, score, risk, lang }) {
  const forest = "#1F3D2B";
  const lightBg = "#F9F8F3";
  const borderCol = "#E4E0D4";

  if (loading) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          border: `1px solid ${borderCol}`,
          padding: 24,
          boxShadow: "0 2px 8px rgba(31,61,43,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "center",
          justify: "center",
          minHeight: 180
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: forest, fontWeight: 700 }}>
          <Bot className="animate-spin" size={24} style={{ color: "#3B7A57" }} />
          <span>Generating AI explanation & personalized roadmap...</span>
        </div>
        <div style={{ fontSize: 13, color: "#6b6b60" }}>
          Analyzing agronomic telemetry signals and document compliance...
        </div>
      </div>
    );
  }

  if (error || !aiData) {
    return (
      <div
        style={{
          background: "#FFFBF0",
          borderRadius: 16,
          border: "1px solid #FFE0B2",
          padding: 20,
          boxShadow: "0 2px 8px rgba(31,61,43,0.03)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#C98A2B", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
          <AlertTriangle size={20} />
          <span>AI Explanation Temporarily Unavailable</span>
        </div>
        <p style={{ fontSize: 13, color: "#5D4037", margin: 0, lineHeight: 1.5 }}>
          Your original rule-based credit score of <strong>{score}/100</strong> and risk assessment remain fully intact and operational.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginTop: 12,
              background: "#1F3D2B",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <RefreshCw size={14} /> Retry AI Explanation
          </button>
        )}
      </div>
    );
  }

  const { summary, scoreExplanation, strengths = [], areasToImprove = [], recommendations = [], priorityActions = [] } = aiData;

  const priorityColors = {
    Immediate: { bg: "#FFEBEE", text: "#C62828", border: "#FFCDD2" },
    "Medium Term": { bg: "#FFF8E1", text: "#F57F17", border: "#FFE082" },
    "Long Term": { bg: "#E8F5E9", text: "#2E7D32", border: "#C8E6C9" }
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        border: `1px solid ${borderCol}`,
        padding: 24,
        boxShadow: "0 4px 14px rgba(31,61,43,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 20
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${borderCol}`,
          paddingBottom: 14
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              background: "linear-gradient(135deg, #1F3D2B 0%, #3B7A57 100%)",
              color: "#FFFFFF",
              padding: 8,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Bot size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1B2B20", fontFamily: "Space Grotesk, sans-serif" }}>
              🤖 AI Assessment Explanation & Guidance
            </h3>
            <span style={{ fontSize: 12, color: "#6b6b60" }}>
              Powered by LLM Assistance Layer · Based strictly on verified score context
            </span>
          </div>
        </div>
        <div
          style={{
            background: "#EAF2EC",
            color: forest,
            padding: "4px 10px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 4
          }}
        >
          <ShieldCheck size={14} /> Rule-Based Score Verified: {score}/100
        </div>
      </div>

      {/* Farmer Summary Box */}
      {summary && (
        <div
          style={{
            background: lightBg,
            borderRadius: 12,
            borderLeft: `4px solid ${forest}`,
            padding: 16
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: forest, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={14} color="#D4A017" /> Farmer-Friendly Summary
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#2C3E35", lineHeight: 1.6, fontWeight: 500 }}>
            {summary}
          </p>
        </div>
      )}

      {/* Score Explanation */}
      {scoreExplanation && (
        <div>
          <h4 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 700, color: "#1B2B20" }}>
            Why this score?
          </h4>
          <p style={{ margin: 0, fontSize: 13.5, color: "#4A4A40", lineHeight: 1.6 }}>
            {scoreExplanation}
          </p>
        </div>
      )}

      {/* Strengths & Areas to Improve Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Strengths */}
        <div style={{ background: "#F4F8F5", borderRadius: 12, padding: 16, border: "1px solid #D2E3D6" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2E7D32", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={16} /> Your Key Strengths
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#2C3E35", display: "flex", flexDirection: "column", gap: 6 }}>
            {strengths.length > 0 ? (
              strengths.map((item, idx) => <li key={idx}>{item}</li>)
            ) : (
              <li>Good baseline land compliance recorded.</li>
            )}
          </ul>
        </div>

        {/* Areas to Improve */}
        <div style={{ background: "#FFFBF0", borderRadius: 12, padding: 16, border: "1px solid #FFE0B2" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#E65100", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={16} /> Areas Requiring Attention
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#4E342E", display: "flex", flexDirection: "column", gap: 6 }}>
            {areasToImprove.length > 0 ? (
              areasToImprove.map((item, idx) => <li key={idx}>{item}</li>)
            ) : (
              <li>No critical default flags identified.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700, color: "#1B2B20" }}>
            Personalized Actionable Recommendations
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 13,
                  color: "#33332D",
                  lineHeight: 1.5,
                  background: "#FFFFFF",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${borderCol}`
                }}
              >
                <ArrowRight size={16} style={{ color: forest, flexShrink: 0, marginTop: 2 }} />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Action Plan */}
      {priorityActions.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700, color: "#1B2B20", display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={16} style={{ color: forest }} /> Recommended Priority Roadmap
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {priorityActions.map((act, idx) => {
              const theme = priorityColors[act.priority] || priorityColors["Medium Term"];
              return (
                <div
                  key={idx}
                  style={{
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: theme.text,
                      textTransform: "uppercase",
                      letterSpacing: 0.5
                    }}
                  >
                    [{act.priority || "Action"}]
                  </span>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#263238", lineHeight: 1.4, fontWeight: 500 }}>
                    {act.action}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
