import { GOVERNMENT_SCHEMES_DATA } from "../data/governmentSchemes";

/**
 * Personalized Government Scheme Matcher Algorithm
 * Evaluates farmer telemetry & profile signals against official scheme datasets.
 * Computes transparent "Potentially Relevant" percentage scores and match justification reasons.
 */
export function matchGovernmentSchemes(farmProfile, customSchemesData = GOVERNMENT_SCHEMES_DATA) {
  if (!farmProfile) return [];

  const locationStr = (farmProfile.location || farmProfile.village || farmProfile.district || "").toLowerCase();
  const stateStr = (farmProfile.state || "").toLowerCase();
  const cropStr = (farmProfile.crop || farmProfile.cropType || "").toLowerCase();
  const landNum = parseFloat(farmProfile.land || farmProfile.farmSize) || 1;
  const irrId = (farmProfile.irrObj?.id || farmProfile.irrigation || "").toLowerCase();
  const riskVal = farmProfile.risk || "Medium";
  const tickedCount = farmProfile.tickedCount !== undefined ? farmProfile.tickedCount : 3;

  return customSchemesData
    .map((scheme) => {
      let score = 35; // baseline probability
      const matchReasons = [];

      // 1. State / Location Matcher
      if (scheme.relevantStates && Array.isArray(scheme.relevantStates)) {
        const stateMatch = scheme.relevantStates.some(
          (s) => stateStr.includes(s.toLowerCase()) || locationStr.includes(s.toLowerCase())
        );
        if (stateMatch) {
          score += 30;
          matchReasons.push(`✓ State / Region matches (${scheme.relevantStates.join(", ")})`);
        } else {
          // If state-specific and doesn't match farmer's state, apply minor penalty but don't hard drop
          score -= 15;
        }
      } else {
        score += 15; // Nationwide scheme bonus
        matchReasons.push("✓ Nationwide applicability");
      }

      // 2. Crop Type Matcher
      if (scheme.relevantCrops && Array.isArray(scheme.relevantCrops)) {
        const isAllCrops = scheme.relevantCrops.includes("All Crops");
        const isCropMatch = scheme.relevantCrops.some((c) => cropStr.includes(c.toLowerCase()) || c.toLowerCase().includes(cropStr));

        if (isCropMatch) {
          score += 25;
          matchReasons.push(`✓ Cultivated Crop matches (${farmProfile.crop || "Crop"})`);
        } else if (isAllCrops) {
          score += 15;
          matchReasons.push("✓ Applicable for all crop varieties");
        }
      }

      // 3. Landholding Scale Matcher
      if (landNum <= 5) {
        if (scheme.categoryKey === "income" || scheme.id === "pmksy-pdmc" || scheme.id === "kcc") {
          score += 20;
          matchReasons.push(`✓ Fits Small/Marginal landholding scale (${landNum} acres)`);
        }
      } else {
        if (scheme.id === "smam" || scheme.id === "aif") {
          score += 15;
          matchReasons.push(`✓ Fits medium to large scale farm mechanization (${landNum} acres)`);
        }
      }

      // 4. Irrigation System Matcher
      if (irrId === "rainfed") {
        if (scheme.id === "pmfby" || scheme.id === "pmksy-pdmc" || scheme.id === "pmkusum") {
          score += 20;
          matchReasons.push("✓ Solves rain-fed water risk deficit");
        }
      } else if (irrId === "canal" || irrId === "tube well" || irrId === "sprinkler" || irrId === "drip") {
        if (scheme.id === "pmksy-pdmc" || scheme.id === "pmkusum") {
          score += 15;
          matchReasons.push(`✓ Irrigation infrastructure alignment (${farmProfile.irrigation || irrId})`);
        }
      }

      // 5. Financial & Diagnostic Signal Alignment
      if (riskVal === "High" && scheme.id === "pmfby") {
        score += 15;
        matchReasons.push("✓ Hedging high yield volatility risk");
      }
      if (tickedCount < 5 && scheme.id === "soilhealthcard") {
        score += 15;
        matchReasons.push("✓ Missing soil documentation prerequisite");
      }
      if (scheme.id === "kcc") {
        score += 15;
        matchReasons.push("✓ Core agricultural credit line requirement");
      }

      // Bound relevance percentage between 45% and 98%
      const relevancePercent = Math.min(98, Math.max(45, Math.round(score)));

      return {
        ...scheme,
        relevancePercent,
        matchReasons
      };
    })
    .filter((s) => s.relevancePercent >= 45)
    .sort((a, b) => b.relevancePercent - a.relevancePercent);
}
