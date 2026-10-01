import React, { useState, useMemo } from "react";
import { FileText, Wheat, Cloud, Droplets, ExternalLink, Search, ShieldAlert, Sparkles, ChevronDown, ChevronUp, Bot } from "lucide-react";
import { matchGovernmentSchemes } from "../utils/schemeMatcher";
import { STRINGS } from "../services/translationService";
import axios from "axios";

/**
 * Enhanced GovernmentSchemes Component
 * Provides personalized scheme matching with relevance % scores, category filters, search, official sources, and AI guidance explanations.
 */
export default function GovernmentSchemes({ result, lang, API_BASE = "http://localhost:5000/api" }) {
  const t = STRINGS[lang] || STRINGS.en;
  const forest = "#1F3D2B";
  const borderCol = "#E4E0D4";

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSchemeId, setExpandedSchemeId] = useState(null);
  const [aiSchemeExplanations, setAiSchemeExplanations] = useState({});
  const [aiLoadingSchemeId, setAiLoadingSchemeId] = useState(null);

  // Compute matched schemes using farm profile signals
  const matchedSchemes = useMemo(() => {
    return matchGovernmentSchemes(result);
  }, [result]);

  // Filter schemes based on selected category tab and search query
  const filteredSchemes = useMemo(() => {
    return matchedSchemes.filter((scheme) => {
      const matchesCategory =
        activeCategory === "all" ||
        scheme.categoryKey === activeCategory ||
        (activeCategory === "state" && scheme.categoryKey === "state");

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        scheme.name.toLowerCase().includes(query) ||
        scheme.shortDescription.toLowerCase().includes(query) ||
        scheme.category.toLowerCase().includes(query) ||
        (scheme.relevantCrops && scheme.relevantCrops.some((c) => c.toLowerCase().includes(query)));

      return matchesCategory && matchesSearch;
    });
  }, [matchedSchemes, activeCategory, searchQuery]);

  // Handle requesting AI explanation for why a specific scheme is relevant
  const handleAskAI = async (scheme) => {
    setAiLoadingSchemeId(scheme.id);
    try {
      const res = await axios.post(`${API_BASE}/ai/scheme-explanation`, {
        scheme: { name: scheme.name, category: scheme.category, benefits: scheme.benefits },
        farmProfile: { crop: result.crop, land: result.land, location: result.location, state: result.state },
        language: lang === "hi" ? "Hindi" : lang === "bn" ? "Bengali" : "English"
      });
      if (res.data && res.data.explanation) {
        setAiSchemeExplanations((prev) => ({
          ...prev,
          [scheme.id]: res.data.explanation
        }));
      }
    } catch (err) {
      console.warn("AI Scheme explanation error:", err);
      setAiSchemeExplanations((prev) => ({
        ...prev,
        [scheme.id]: `This scheme directly supports your cultivated crop (${result.crop || "agriculture"}) and landholding scale.`
      }));
    } finally {
      setAiLoadingSchemeId(null);
    }
  };

  const categories = [
    { key: "all", label: "All Schemes" },
    { key: "loans", label: "Credit & Loans" },
    { key: "insurance", label: "Crop Insurance" },
    { key: "irrigation", label: "Irrigation & Solar" },
    { key: "income", label: "Income Support" },
    { key: "equipment", label: "Mechanization" },
    { key: "soil", label: "Soil Health" },
    { key: "state", label: "State Schemes" }
  ];

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
        gap: 16
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${borderCol}`, paddingBottom: 12 }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1B2B20", fontFamily: "Space Grotesk, sans-serif", display: "block" }}>
            🌾 Personalized Government Scheme Recommendations
          </span>
          <span style={{ fontSize: 12, color: "#6b6b60" }}>
            {matchedSchemes.length} official schemes matched for your farm profile & state location
          </span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "#8a8a7c" }} />
        <input
          type="text"
          placeholder="Search schemes by name, crop, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "9px 12px 9px 36px",
            borderRadius: 10,
            border: `1px solid ${borderCol}`,
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
            background: "#FAF9F5"
          }}
        />
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "thin" }}>
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            style={{
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: activeCategory === cat.key ? 700 : 500,
              border: activeCategory === cat.key ? `1px solid ${forest}` : `1px solid ${borderCol}`,
              background: activeCategory === cat.key ? forest : "#FFFFFF",
              color: activeCategory === cat.key ? "#FFFFFF" : "#55554A",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease-in-out"
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Scheme Cards Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
        {filteredSchemes.length > 0 ? (
          filteredSchemes.map((scheme) => {
            const isExpanded = expandedSchemeId === scheme.id;
            const relColor = scheme.relevancePercent >= 80 ? "#2E7D32" : scheme.relevancePercent >= 65 ? "#C98A2B" : "#D84315";
            const relBg = scheme.relevancePercent >= 80 ? "#E8F5E9" : scheme.relevancePercent >= 65 ? "#FFF8E1" : "#FBE9E7";

            return (
              <div
                key={scheme.id}
                style={{
                  background: "#FAF9F6",
                  borderRadius: 12,
                  border: `1px solid ${borderCol}`,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "box-shadow 0.2s"
                }}
              >
                {/* Scheme Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: forest, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {scheme.category}
                    </span>
                    <h4 style={{ margin: "2px 0 4px 0", fontSize: 14.5, fontWeight: 700, color: "#1B2B20", fontFamily: "Space Grotesk, sans-serif" }}>
                      {scheme.name}
                    </h4>
                  </div>
                  <div
                    style={{
                      background: relBg,
                      color: relColor,
                      padding: "4px 10px",
                      borderRadius: 16,
                      fontSize: 11.5,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <Sparkles size={12} /> Potentially Relevant: {scheme.relevancePercent}%
                  </div>
                </div>

                {/* Short Description */}
                <p style={{ margin: 0, fontSize: 12.5, color: "#4A4A40", lineHeight: 1.5 }}>
                  {scheme.shortDescription}
                </p>

                {/* Match Justification Reasons */}
                {scheme.matchReasons && scheme.matchReasons.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                    {scheme.matchReasons.map((reason, rIdx) => (
                      <span
                        key={rIdx}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #D2E3D6",
                          color: "#2C3E35",
                          borderRadius: 6,
                          padding: "3px 8px",
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}

                {/* Collapsible Details */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 12,
                      borderTop: `1px dashed ${borderCol}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      fontSize: 12.5
                    }}
                  >
                    <div>
                      <strong style={{ color: forest }}>Key Benefits:</strong>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: 18, color: "#33332D" }}>
                        {scheme.benefits.map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <strong style={{ color: forest }}>Eligibility Criteria:</strong>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: 18, color: "#33332D" }}>
                        {scheme.eligibility.map((e, idx) => (
                          <li key={idx}>{e}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <strong style={{ color: forest }}>Documents Required:</strong>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                        {scheme.documentsRequired.map((docItem, idx) => (
                          <span key={idx} style={{ background: "#EAF2EC", color: forest, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            📄 {docItem}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI Guidance Box */}
                    {aiSchemeExplanations[scheme.id] ? (
                      <div style={{ background: "#F4F8F5", borderLeft: `3px solid ${forest}`, padding: 10, borderRadius: 6, fontSize: 12, color: "#2E5A3E" }}>
                        <strong>🤖 AI Guidance:</strong> {aiSchemeExplanations[scheme.id]}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAskAI(scheme)}
                        disabled={aiLoadingSchemeId === scheme.id}
                        style={{
                          alignSelf: "flex-start",
                          background: "#EAF2EC",
                          color: forest,
                          border: `1px solid ${forest}`,
                          borderRadius: 6,
                          padding: "4px 10px",
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <Bot size={13} /> {aiLoadingSchemeId === scheme.id ? "Analyzing..." : "Ask AI Why This Scheme Benefits You"}
                      </button>
                    )}
                  </div>
                )}

                {/* Footer Controls: Official Portal Link & Expand Toggle */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  {scheme.officialSource ? (
                    <a
                      href={scheme.officialSource}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: forest,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      View Official Portal <ExternalLink size={12} />
                    </a>
                  ) : <span />}

                  <button
                    type="button"
                    onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#6b6b60",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    {isExpanded ? (
                      <>Hide Details <ChevronUp size={14} /></>
                    ) : (
                      <>View Details <ChevronDown size={14} /></>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: 20, textAlign: "center", color: "#6b6b60", fontSize: 13 }}>
            No schemes found matching "{searchQuery}" under {activeCategory} category.
          </div>
        )}
      </div>

      {/* Disclaimer Notice */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#8a8a7c", borderTop: `1px solid ${borderCol}`, paddingTop: 10 }}>
        <ShieldAlert size={14} style={{ color: "#C98A2B", flexShrink: 0 }} />
        <span>⚠ Final eligibility and sanctioning should be verified through the official scheme portal or regional bank branch.</span>
      </div>
    </div>
  );
}
