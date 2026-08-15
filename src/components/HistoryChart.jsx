import React from "react";
import { Download } from "lucide-react";
import { STRINGS, getLocalizedCrop, getLocalizedLocation } from "../services/translationService";
import { downloadReport } from "../services/pdfService";

/**
 * HistoryChart Component rendering the recent evaluations log.
 * Redesigned to remove the sparkline trend graph and expand to use full width.
 */
export default function HistoryChart({ history, user, documents, lang }) {
  const t = STRINGS[lang] || STRINGS.en;
  const forest = "#1F3D2B";
  const ink = "#1B2B20";

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        border: "1px solid #E4E0D4",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        width: "100%"
      }}
    >
      <span style={{ fontSize: 14.5, fontWeight: 700, color: ink, fontFamily: "Space Grotesk, sans-serif", marginBottom: 12 }}>
        {t.recentReports}
      </span>
      {history.length === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8a7c", fontSize: 12.5, minHeight: 60 }}>
          {t.noChecksYet}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", maxHeight: 150 }}>
          {history.slice(0, 3).map((item, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#F7F5EF", borderRadius: 8, border: "1px solid #E4E0D4" }}>
              <div style={{ minWidth: 0, marginRight: 8, overflow: "hidden" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {getLocalizedCrop(item.crop, lang)} · {getLocalizedLocation(item.location, lang)}
                </div>
                <div style={{ fontSize: 10, color: "#8a8a7c", marginTop: 2 }}>
                  {item.date} · {t.scoreLabel || "Score"}: {item.score}
                </div>
              </div>
              <button
                type="button"
                onClick={() => downloadReport(item, documents, lang)}
                title={t.downloadPdf || "Download"}
                style={{ border: "none", background: "transparent", cursor: "pointer", padding: 6, display: "flex", alignItems: "center", color: forest }}
              >
                <Download size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
