/**
 * Verified Government Agricultural Schemes Dataset
 * Structured official scheme records for AgriScore AI personalized scheme recommendation matching.
 * Data compiled from official portals (pmkisan.gov.in, pmfby.gov.in, pmksy.gov.in, mnre.gov.in, etc.)
 */

export const GOVERNMENT_SCHEMES_DATA = [
  {
    id: "kcc",
    name: "Kisan Credit Card (KCC)",
    shortDescription: "Concessional institutional credit for crop cultivation, post-harvest expenses, and farm maintenance.",
    category: "Agricultural Credit / Loans",
    categoryKey: "loans",
    targetBeneficiaries: ["Individual Farmers", "Tenant Farmers", "Sharecroppers", "SHGs"],
    eligibility: [
      "All farmers - individual/joint borrowers who are owner cultivators",
      "Tenant farmers, oral lessees & sharecroppers cultivating land",
      "Valid land registry or certified cultivation passbook"
    ],
    benefits: [
      "Flexible revolving credit limit up to ₹3 Lakh at effective 4% p.a. interest rate with prompt repayment subvention (3%)",
      "No collateral security required for loans up to ₹1.6 Lakh (extendable to ₹2 Lakh)",
      "Built-in crop insurance coverage under PMFBY"
    ],
    relevantCrops: ["All Crops", "Rice", "Wheat", "Sugarcane", "Cotton", "Maize", "Pulses", "Vegetables"],
    relevantFarmTypes: ["Owner Cultivator", "Tenant Farmer", "Sharecropper", "Small Landholding", "Large Landholding"],
    documentsRequired: ["Aadhaar Card", "Land Registry / Passbook / Khatauni", "No-Dues Certificate from local financial institution"],
    officialSource: "https://pmkisan.gov.in/KCC.aspx",
    lastVerified: "2026-03"
  },
  {
    id: "pmkisan",
    name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    shortDescription: "Direct income support of ₹6,000 per year transferred directly to landholding farmers' bank accounts.",
    category: "Farmer Income Support",
    categoryKey: "income",
    targetBeneficiaries: ["Small Farmers", "Marginal Farmers", "Landholding Farmers"],
    eligibility: [
      "All landholding farmer families with cultivable land in their names",
      "Aadhaar-seeded active bank account",
      "Excludes institutional landholders and high-income taxpaying individuals"
    ],
    benefits: [
      "Direct benefit transfer of ₹6,000 per annum in three equal instalments of ₹2,000 every 4 months",
      "Supplements financial needs for procuring farm inputs and domestic expenses"
    ],
    relevantCrops: ["All Crops"],
    relevantFarmTypes: ["Small Landholding", "Marginal Landholding", "Owner Cultivator"],
    documentsRequired: ["Aadhaar Card", "Landownership Record / Khatian", "Bank Passbook with IFSC"],
    officialSource: "https://pmkisan.gov.in/",
    lastVerified: "2026-03"
  },
  {
    id: "pmfby",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    shortDescription: "Comprehensive crop insurance covering non-preventable natural risks from pre-sowing to post-harvest.",
    category: "Crop Insurance",
    categoryKey: "insurance",
    targetBeneficiaries: ["All Farmers", "Loanee Farmers", "Non-Loanee Farmers", "Rain-fed Farmers"],
    eligibility: [
      "All farmers growing notified crops in notified areas including sharecroppers and tenant farmers",
      "Must enroll prior to specified cut-off dates for Kharif or Rabi seasons"
    ],
    benefits: [
      "Lowest premium rate for farmers: 2% for Kharif crops, 1.5% for Rabi crops, 5% for annual commercial/horticultural crops",
      "Government pays remaining actuarial premium subsidy (no upper cap)",
      "Covers crop loss due to drought, flood, dry spells, pests, diseases, and localized calamities"
    ],
    relevantCrops: ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Pulses", "Oilseeds", "Soybean"],
    relevantFarmTypes: ["Rain-fed", "Canal", "Sprinkler", "Drip", "Tenant Farmer", "Owner Cultivator"],
    documentsRequired: ["Land Ownership Document / Sowing Certificate", "Aadhaar Card", "Bank Account Details"],
    officialSource: "https://pmfby.gov.in/",
    lastVerified: "2026-03"
  },
  {
    id: "pmksy-pdmc",
    name: "Pradhan Mantri Krishi Sinchayee Yojana - Per Drop More Crop (PDMC)",
    shortDescription: "Financial assistance for installing micro-irrigation systems (Drip and Sprinkler) to maximize water efficiency.",
    category: "Micro-Irrigation",
    categoryKey: "irrigation",
    targetBeneficiaries: ["Small Farmers", "Marginal Farmers", "Water-stressed Area Farmers"],
    eligibility: [
      "Farmers having land ownership or assured land lease for at least 7 years",
      "Available for all agricultural crops needing micro-irrigation"
    ],
    benefits: [
      "Up to 55% subsidy for Small & Marginal farmers and 45% subsidy for other farmers for drip and sprinkler installations",
      "Saves up to 40-50% water while increasing yield by 20-30%"
    ],
    relevantCrops: ["Sugarcane", "Cotton", "Vegetables", "Maize", "Wheat", "Fruits", "Pulses"],
    relevantFarmTypes: ["Rain-fed", "Canal", "Tube well"],
    documentsRequired: ["Aadhaar Card", "Land Passbook / Possession Certificate", "Electricity Connection / Water Source proof"],
    officialSource: "https://pmksy.gov.in/",
    lastVerified: "2026-03"
  },
  {
    id: "pmkusum",
    name: "Pradhan Mantri Kisan Urja Suraksha evam Utthan Mahabhiyan (PM-KUSUM)",
    shortDescription: "Subsidy for standalone solar agriculture pumps and solarization of existing grid-connected agriculture pumps.",
    category: "Irrigation & Solar Subsidies",
    categoryKey: "irrigation",
    targetBeneficiaries: ["Farmers without grid power", "Farmers with electric pumpsets", "Water User Associations"],
    eligibility: [
      "Individual farmers, water user associations, cooperatives, and FPOs",
      "Land suitable for solar pump installation or solar plant setup"
    ],
    benefits: [
      "Up to 60% total subsidy (30% Central Govt + 30% State Govt) for solar pumps up to 7.5 HP",
      "Reduces reliance on expensive diesel pumps and provides daytime reliable irrigation",
      "Opportunity to sell excess solar power back to DISCOMs for extra revenue"
    ],
    relevantCrops: ["All Crops", "Rice", "Wheat", "Cotton", "Sugarcane", "Vegetables"],
    relevantFarmTypes: ["Tube well", "Rain-fed", "Owner Cultivator"],
    documentsRequired: ["Aadhaar Card", "Land Registry Certificate", "Bank Account Details", "Discom NOC"],
    officialSource: "https://pmkusum.mnre.gov.in/",
    lastVerified: "2026-03"
  },
  {
    id: "soilhealthcard",
    name: "Soil Health Card Scheme",
    shortDescription: "Free soil testing and customized crop-wise nutrient management recommendations for every farm plot.",
    category: "Soil Health",
    categoryKey: "soil",
    targetBeneficiaries: ["All Farmers"],
    eligibility: [
      "All operational landholders across all Indian states and Union Territories"
    ],
    benefits: [
      "Free soil sample analysis evaluating 12 parameters (N, P, K, S, Zinc, Fe, Cu, Mn, Bo, pH, EC, OC)",
      "Customized dosage guidance for chemical fertilizers and bio-fertilizers to reduce input costs by 15-20%"
    ],
    relevantCrops: ["All Crops"],
    relevantFarmTypes: ["Owner Cultivator", "Tenant Farmer", "Sharecropper"],
    documentsRequired: ["Aadhaar Card", "Farm Khasra / Survey Number"],
    officialSource: "https://soilhealth.dac.gov.in/",
    lastVerified: "2026-03"
  },
  {
    id: "smam",
    name: "Sub-Mission on Agricultural Mechanization (SMAM)",
    shortDescription: "Subsidies for purchasing farm machinery, tractors, power tillers, and establishing Custom Hiring Centres (CHCs).",
    category: "Farm Mechanization / Equipment",
    categoryKey: "equipment",
    targetBeneficiaries: ["Small Farmers", "Women Farmers", "FPOs", "Custom Hiring Operators"],
    eligibility: [
      "Farmers, Self-Help Groups, User Groups, Cooperative Societies, and FPOs"
    ],
    benefits: [
      "40% to 50% direct subsidy on agricultural machinery (tractors, rotavators, seed drills, harvesters)",
      "Up to 80% subsidy for setting up Custom Hiring Centres in villages"
    ],
    relevantCrops: ["Wheat", "Rice", "Sugarcane", "Maize", "Cotton", "Pulses"],
    relevantFarmTypes: ["Owner Cultivator", "Small Landholding", "Large Landholding"],
    documentsRequired: ["Aadhaar Card", "Land Ownership Proof", "Bank Passbook", "Caste Certificate (if applicable)"],
    officialSource: "https://agrimachinery.nic.in/",
    lastVerified: "2026-03"
  },
  {
    id: "aif",
    name: "Agriculture Infrastructure Fund (AIF)",
    shortDescription: "Medium-long term debt financing facility with interest subvention for post-harvest management infrastructure.",
    category: "Agricultural Infrastructure",
    categoryKey: "infrastructure",
    targetBeneficiaries: ["Farmers", "Agri-Entrepreneurs", "FPOs", "Primary Agricultural Credit Societies (PACS)"],
    eligibility: [
      "Primary Agricultural Credit Societies, FPOs, Agri-entrepreneurs, Startups, and Individual Farmers"
    ],
    benefits: [
      "3% interest subvention per annum on loans up to ₹2 Crore for a maximum period of 7 years",
      "Credit guarantee coverage under CGTMSE for loans up to ₹2 Crore",
      "Applicable for warehouses, cold chains, silos, sorting/grading units, and solar-powered cold storages"
    ],
    relevantCrops: ["Fruits", "Vegetables", "Grains", "Pulses", "Oilseeds", "Cotton"],
    relevantFarmTypes: ["Owner Cultivator", "FPO Member", "Agri-entrepreneur"],
    documentsRequired: ["DPR (Detailed Project Report)", "Aadhaar Card", "Land Ownership / Lease Agreement", "Bank KYC"],
    officialSource: "https://agriinfra.dac.gov.in/",
    lastVerified: "2026-03"
  },
  {
    id: "midh",
    name: "Mission for Integrated Development of Horticulture (MIDH)",
    shortDescription: "Financial assistance and technical guidance for holistic growth of the horticulture sector (fruits, vegetables, spices).",
    category: "Horticulture Development",
    categoryKey: "horticulture",
    targetBeneficiaries: ["Horticulture Farmers", "Nurseries", "Greenhouse Operators"],
    eligibility: [
      "Individual farmers, SHGs, FPOs undertaking horticulture crop cultivation or polyhouse construction"
    ],
    benefits: [
      "35% to 50% capital subsidy for establishing polyhouses, shade net houses, drip systems, and high-tech nurseries",
      "Financial assistance for high-density orcharding and micro-irrigation integration"
    ],
    relevantCrops: ["Fruits", "Vegetables", "Spices", "Flowers", "Medicinal Plants"],
    relevantFarmTypes: ["Drip", "Sprinkler", "Owner Cultivator"],
    documentsRequired: ["Aadhaar Card", "Land Registry Record", "Soil & Water Test Reports"],
    officialSource: "https://midh.gov.in/",
    lastVerified: "2026-03"
  },
  {
    id: "pkvy",
    name: "Paramparagat Krishi Vikas Yojana (PKVY)",
    shortDescription: "Promotion of organic farming through cluster approach and Participatory Guarantee System (PGS) certification.",
    category: "Organic / Sustainable Farming",
    categoryKey: "organic",
    targetBeneficiaries: ["Organic Farmers", "Farmer Clusters", "FPOs"],
    eligibility: [
      "Farmers forming clusters of 50 or more farmers with 50 acres of land"
    ],
    benefits: [
      "Financial assistance of ₹50,000 per hectare over 3 years",
      "₹31,000 per hectare allocated directly for organic inputs (seeds, bio-fertilizers, vermicompost)",
      "Free organic certification under PGS-India and assistance in brand building and marketing"
    ],
    relevantCrops: ["Pulses", "Oilseeds", "Spices", "Vegetables", "Rice", "Wheat"],
    relevantFarmTypes: ["Rain-fed", "Owner Cultivator", "Tenant Farmer"],
    documentsRequired: ["Aadhaar Card", "Cluster Member Form", "Land Khatauni"],
    officialSource: "https://pgsindia-ncof.gov.in/pkvy/index.aspx",
    lastVerified: "2026-03"
  },

  // --- State-Specific Agricultural Schemes ---
  {
    id: "punjab-crm",
    name: "Punjab & Haryana Crop Residue Management (CRM) Subsidy",
    shortDescription: "State subsidy for machinery used in in-situ management of paddy straw to prevent stubble burning.",
    category: "State Schemes / Equipment",
    categoryKey: "state",
    targetBeneficiaries: ["Farmers in Punjab & Haryana", "Custom Hiring Centres"],
    eligibility: [
      "Farmers residing and cultivating land in Punjab or Haryana",
      "Purchasing approved stubble management machines (Happy Seeder, Super Seeder, Paddy Straw Chopper)"
    ],
    benefits: [
      "50% subsidy for individual farmers and 80% subsidy for Custom Hiring Centres / Panchayats",
      "Promotes zero-till wheat sowing directly into paddy residue"
    ],
    relevantCrops: ["Rice", "Wheat"],
    relevantStates: ["Punjab", "Haryana"],
    relevantFarmTypes: ["Owner Cultivator", "Tenant Farmer"],
    documentsRequired: ["Aadhaar Card", "Punjab/Haryana Land Record", "Bank Account Details", "Tractor RC"],
    officialSource: "https://agri.punjab.gov.in/",
    lastVerified: "2026-03"
  },
  {
    id: "mh-namo-shetkari",
    name: "Namo Shetkari Maha Samman Nidhi Yojana (Maharashtra)",
    shortDescription: "Additional financial assistance of ₹6,000 per year provided by Government of Maharashtra to PM-KISAN beneficiaries.",
    category: "State Schemes / Income Support",
    categoryKey: "state",
    targetBeneficiaries: ["Maharashtra Farmers", "PM-KISAN Beneficiaries"],
    eligibility: [
      "Registered landholding farmers in Maharashtra enrolled under PM-KISAN",
      "Active Aadhaar-linked bank account in Maharashtra"
    ],
    benefits: [
      "₹6,000 per year additional income transfer (Combined total of ₹12,000/year alongside PM-KISAN)",
      "Transferred directly into bank accounts in 3 instalments of ₹2,000"
    ],
    relevantCrops: ["All Crops", "Sugarcane", "Cotton", "Soybean", "Pomegranate"],
    relevantStates: ["Maharashtra"],
    relevantFarmTypes: ["Owner Cultivator", "Small Landholding", "Marginal Landholding"],
    documentsRequired: ["Aadhaar Card", "Maharashtra 7/12 Extract", "PM-KISAN Registration ID"],
    officialSource: "https://krishi.maharashtra.gov.in/",
    lastVerified: "2026-03"
  },
  {
    id: "up-kisan-uday",
    name: "UP Kisan Uday Yojana (Uttar Pradesh)",
    shortDescription: "Free energy-efficient solar/electric pumpsets for farmers in Uttar Pradesh.",
    category: "State Schemes / Irrigation",
    categoryKey: "state",
    targetBeneficiaries: ["Uttar Pradesh Farmers"],
    eligibility: [
      "Permanent resident farmers of Uttar Pradesh with registered land",
      "Should not have previously availed similar pumpset subsidies"
    ],
    benefits: [
      "Free 5 HP and 7.5 HP energy-efficient pump sets equipped with smart mobile control technology",
      "Saves up to 35% electricity consumption for tube well irrigation"
    ],
    relevantCrops: ["Sugarcane", "Wheat", "Rice", "Potatoes", "Mustard"],
    relevantStates: ["Uttar Pradesh"],
    relevantFarmTypes: ["Tube well", "Canal", "Owner Cultivator"],
    documentsRequired: ["Aadhaar Card", "UP Khatauni Passbook", "Bank Details"],
    officialSource: "https://upagriculture.com/",
    lastVerified: "2026-03"
  },
  {
    id: "wb-krishak-bandhu",
    name: "Krishak Bandhu (Kami) Scheme (West Bengal)",
    shortDescription: "Assured financial assistance and life insurance cover for all farmers in West Bengal.",
    category: "State Schemes / Income Support",
    categoryKey: "state",
    targetBeneficiaries: ["West Bengal Farmers", "Sharecroppers"],
    eligibility: [
      "All farmers and recorded Bhagchasi (sharecroppers) in West Bengal holding land"
    ],
    benefits: [
      "Financial assistance of ₹10,000 per year for farmers with 1 or more acres (in two instalments for Kharif and Rabi)",
      "Pro-rata minimum ₹4,000 per year for landholdings under 1 acre",
      "₹2,000,000 (₹2 Lakh) free death insurance for farmer families in case of natural or accidental death (age 18-60)"
    ],
    relevantCrops: ["Rice", "Jute", "Mustard", "Vegetables", "Potato", "Tea"],
    relevantStates: ["West Bengal"],
    relevantFarmTypes: ["Owner Cultivator", "Sharecropper", "Tenant Farmer"],
    documentsRequired: ["Aadhaar Card", "West Bengal ROR (Parcha)", "Bank Passbook"],
    officialSource: "https://krishakbandhu.wb.gov.in/",
    lastVerified: "2026-03"
  },
  {
    id: "tn-solar-pump",
    name: "Chief Minister’s Solar Powered Pump Sets Scheme (Tamil Nadu)",
    shortDescription: "High-subsidy solar agricultural pumpsets for farmers off the main electrical grid in Tamil Nadu.",
    category: "State Schemes / Irrigation",
    categoryKey: "state",
    targetBeneficiaries: ["Tamil Nadu Farmers"],
    eligibility: [
      "Farmers in Tamil Nadu with functional open wells or borewells",
      "Priority for farmers in non-electrified wells or dryland regions"
    ],
    benefits: [
      "70% subsidy for off-grid solar AC/DC pumpsets up to 10 HP",
      "Guarantees uninterrupted daytime irrigation for paddy, sugarcane, and horti crops"
    ],
    relevantCrops: ["Rice", "Sugarcane", "Coconut", "Banana", "Millets"],
    relevantStates: ["Tamil Nadu"],
    relevantFarmTypes: ["Tube well", "Rain-fed", "Owner Cultivator"],
    documentsRequired: ["Aadhaar Card", "TN Chitta / Adangal", "Well Ownership Certificate"],
    officialSource: "https://www.tntagrisnet.tn.gov.in/",
    lastVerified: "2026-03"
  }
];
