import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();
const PORT = 3000;
const HOST = "0.0.0.0";
const JWT_SECRET = process.env.SECRET_KEY || "afrisafe_secret_key_development_mode";

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// In-Memory Data Store
// ---------------------------------------------------------------------------

interface User {
  id: number;
  email: string;
  passwordHash: string;
  full_name: string;
  age?: number;
  gender?: string;
  state?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface PredictionRecord {
  id: number;
  user_id: number;
  prediction: string;
  confidence: number;
  risk: string;
  recommendation: string;
  advice: string[];
  symptoms: any;
  ai_insights: string;
  created_at: string;
}

const users: User[] = [];
let nextUserId = 1;

const predictions: PredictionRecord[] = [];
let nextPredictionId = 1;

const refreshTokens = new Set<string>();

// Seed default admin user for testing
(async () => {
  const hash = await bcrypt.hash("AdminPass123!", 10);
  users.push({
    id: nextUserId++,
    email: "admin@afrisafe.ai",
    passwordHash: hash,
    full_name: "System Admin",
    age: 35,
    gender: "Male",
    state: "FCT",
    role: "admin",
    is_active: true,
    created_at: new Date().toISOString(),
  });
})();

// ---------------------------------------------------------------------------
// Helper Functions & Middleware
// ---------------------------------------------------------------------------

function generateAccessToken(user: User): string {
  return jwt.sign(
    { sub: user.email, user_id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "60m" }
  );
}

function generateRefreshToken(user: User): string {
  const token = jwt.sign(
    { sub: user.email, user_id: user.id, type: "refresh" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  refreshTokens.add(token);
  return token;
}

interface AuthenticatedRequest extends Request {
  user?: User;
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Could not validate credentials" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = users.find((u) => u.email === payload.sub);
    if (!user || !user.is_active) {
      return res.status(401).json({ detail: "User not found or inactive" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ detail: "Could not validate credentials" });
  }
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ detail: "The user does not have enough privileges" });
  }
  next();
}

function formatUserOut(user: User) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    age: user.age || null,
    gender: user.gender || null,
    state: user.state || null,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
  };
}

// ---------------------------------------------------------------------------
// ML Triage Logic
// ---------------------------------------------------------------------------

function calculateRisk(symptomsPayload: any) {
  const symptoms: string[] = Array.isArray(symptomsPayload.symptoms) ? symptomsPayload.symptoms : [];
  const lowerSymptoms = symptoms.map((s) => String(s).toLowerCase().trim());
  const duration = Number(symptomsPayload.duration) || 1;
  const mosquito = Boolean(symptomsPayload.mosquito_exposure);
  const travel = Boolean(symptomsPayload.travel_history);
  const standingWater = Boolean(symptomsPayload.standing_water);
  const bedNetUsed = Boolean(symptomsPayload.bed_net_used);

  let z = -2.2;
  if (lowerSymptoms.includes("high fever")) {
    z += 2.1;
  } else if (lowerSymptoms.includes("fever")) {
    z += 1.4;
  }
  if (lowerSymptoms.includes("chills")) z += 1.2;
  if (lowerSymptoms.includes("vomiting")) z += 1.0;
  if (lowerSymptoms.includes("headache")) z += 0.7;
  if (lowerSymptoms.includes("bitter taste") || lowerSymptoms.includes("loss of appetite")) z += 0.4;
  if (lowerSymptoms.includes("dizziness")) z += 0.4;
  if (mosquito) z += 0.5;
  if (standingWater) z += 0.4;
  if (travel) z += 0.4;
  if (bedNetUsed) z -= 0.3; // Protective factor
  z += Math.min(duration * 0.1, 0.8);

  const probability = 1 / (1 + Math.exp(-z));
  const prediction = probability >= 0.5 ? "Malaria" : "No Malaria";
  const confidence = Math.round(
    (probability >= 0.5 ? probability : 1 - probability) * 10000
  ) / 100;

  let risk = "Low";
  if (probability >= 0.75) {
    risk = "High";
  } else if (probability >= 0.45 || lowerSymptoms.includes("high fever")) {
    risk = "Medium";
  }

  let recommendation = "";
  let advice: string[] = [];

  if (risk === "High") {
    recommendation =
      "High risk detected. Visit the nearest health facility for malaria testing immediately. Severe symptoms require urgent clinical evaluation.";
    advice = [
      "Take a Rapid Diagnostic Test (RDT) or blood smear at a clinic.",
      "Begin prescribed antimalarial treatment (ACT) only after confirmation.",
      "Drink plenty of fluids and rest.",
      "Avoid self-medication or leftover antimalarials.",
      "Seek emergency care if confusion, seizures, or difficulty breathing occur.",
    ];
  } else if (risk === "Medium") {
    recommendation =
      "Moderate risk detected. Visit a clinic within 24-48 hours for a malaria test.";
    advice = [
      "Get a Rapid Diagnostic Test (RDT) to confirm malaria.",
      "Stay hydrated and monitor your temperature.",
      "Use insecticide-treated bed nets.",
      "Do not self-medicate; wait for test results.",
    ];
  } else {
    recommendation =
      "Low risk indicators. Monitor symptoms and rest. Seek care if symptoms worsen.";
    advice = [
      "Rest and maintain hydration.",
      "Continue monitoring for fever or new symptoms.",
      "Use preventive measures (bed nets, repellents).",
      "Visit a clinic if symptoms persist beyond 48 hours.",
    ];
  }

  const symptomText = symptoms.length > 0 ? symptoms.join(", ") : "no significant symptoms";
  const pct = Math.round(probability * 1000) / 10;
  let lead = "";
  if (prediction === "Malaria") {
    lead = `The model estimates a ${pct}% probability of malaria based on the reported symptom profile (${symptomText}).`;
  } else {
    lead = `The model estimates a low (${pct}%) probability of malaria. Reported symptoms (${symptomText}) do not strongly match the malaria profile.`;
  }

  const notes: string[] = [];
  if (symptomsPayload.mosquito_exposure) {
    notes.push("Recent mosquito bites increase epidemiological likelihood.");
  }
  if (symptomsPayload.standing_water) {
    notes.push("Presence of standing/stagnant water near residence creates mosquito breeding vectors.");
  }
  if (symptomsPayload.bed_net_used) {
    notes.push("Regular use of insecticide-treated bed nets serves as a valuable protective barrier.");
  }
  if (symptomsPayload.travel_history) {
    notes.push("Recent travel to endemic areas is a supporting risk factor.");
  }
  if (symptomsPayload.drug_history) {
    notes.push("Recent antimalarial use may suppress test results; inform your clinician.");
  }

  const ai_insights = `${lead} ${notes.join(" ")}`.trim();

  return {
    prediction,
    confidence,
    probability,
    risk,
    recommendation,
    advice,
    ai_insights,
  };
}

// ---------------------------------------------------------------------------
// API Routes (/api/v1)
// ---------------------------------------------------------------------------

// --- Health Check ---
app.get("/api/v1/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    database_status: "connected",
    model_loaded: true,
    feature_names_count: 17,
    version: "1.0.0",
  });
});

// --- Auth Routes ---
app.post("/api/v1/auth/register", async (req: Request, res: Response) => {
  const { email, password, full_name, age, gender, state } = req.body;

  if (!email || !password || !full_name) {
    return res.status(422).json({ detail: "email, password, and full_name are required" });
  }

  const existing = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) {
    return res.status(400).json({ detail: "Email is already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: nextUserId++,
    email: email.toLowerCase(),
    passwordHash,
    full_name,
    age: age ? Number(age) : undefined,
    gender,
    state,
    role: "user",
    is_active: true,
    created_at: new Date().toISOString(),
  };

  users.push(newUser);

  const accessToken = generateAccessToken(newUser);
  const refreshToken = generateRefreshToken(newUser);

  return res.status(201).json({
    access_token: accessToken,
    refresh_token: refreshToken,
    user: formatUserOut(newUser),
  });
});

app.post("/api/v1/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ detail: "email and password are required" });
  }

  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) {
    return res.status(401).json({ detail: "Incorrect email or password" });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ detail: "Incorrect email or password" });
  }

  if (!user.is_active) {
    return res.status(400).json({ detail: "Inactive user account" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return res.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    user: formatUserOut(user),
  });
});

app.post("/api/v1/auth/refresh", (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token || !refreshTokens.has(refresh_token)) {
    return res.status(401).json({ detail: "Invalid refresh token" });
  }

  try {
    const payload = jwt.verify(refresh_token, JWT_SECRET) as any;
    const user = users.find((u) => u.email === payload.sub);
    if (!user || !user.is_active) {
      return res.status(401).json({ detail: "User not found or inactive" });
    }

    const accessToken = generateAccessToken(user);
    return res.json({ access_token: accessToken });
  } catch (err) {
    refreshTokens.delete(refresh_token);
    return res.status(401).json({ detail: "Invalid or expired refresh token" });
  }
});

app.post("/api/v1/auth/logout", (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (refresh_token) {
    refreshTokens.delete(refresh_token);
  }
  return res.json({ message: "Logged out successfully" });
});

app.get("/api/v1/auth/me", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json(formatUserOut(req.user!));
});

app.get("/api/v1/auth/me/active", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json(formatUserOut(req.user!));
});

// --- Prediction Routes ---
app.post("/api/v1/prediction/predict", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const payload = req.body || {};
  const result = calculateRisk(payload);

  const record: PredictionRecord = {
    id: nextPredictionId++,
    user_id: req.user!.id,
    prediction: result.prediction,
    confidence: result.confidence,
    risk: result.risk,
    recommendation: result.recommendation,
    advice: result.advice,
    symptoms: payload,
    ai_insights: result.ai_insights,
    created_at: new Date().toISOString(),
  };

  predictions.push(record);

  return res.json({
    prediction: record.prediction,
    confidence: record.confidence,
    risk: record.risk,
    recommendation: record.recommendation,
    advice: record.advice,
    symptoms: record.symptoms,
    ai_insights: record.ai_insights,
    timestamp: record.created_at,
  });
});

app.get("/api/v1/prediction/history", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userPredictions = predictions
    .filter((p) => p.user_id === req.user!.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const skip = Number(req.query.skip) || 0;
  const limit = Number(req.query.limit) || 50;
  const paginated = userPredictions.slice(skip, skip + limit);

  return res.json({
    total: userPredictions.length,
    items: paginated.map((p) => ({
      id: p.id,
      prediction: p.prediction,
      confidence: p.confidence,
      risk: p.risk,
      recommendation: p.recommendation,
      advice: p.advice,
      symptoms: p.symptoms,
      ai_insights: p.ai_insights,
      created_at: p.created_at,
    })),
  });
});

app.delete("/api/v1/prediction/history/:prediction_id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.prediction_id);
  const index = predictions.findIndex((p) => p.id === id && p.user_id === req.user!.id);

  if (index === -1) {
    return res.status(404).json({ detail: "Prediction record not found" });
  }

  predictions.splice(index, 1);
  return res.status(204).send();
});

// --- Public Health & Prevention Guidelines ---
app.get("/api/v1/prevention-guidelines", (req: Request, res: Response) => {
  const query = String(req.query.query || "").toLowerCase().trim();
  const categoryFilter = String(req.query.category || "").toLowerCase().trim();

  const allGuidelines = [
    {
      id: "vector_control",
      category: "vector",
      title: "Vector Control & Household Protection",
      badge: "Essential Prevention",
      icon: "shield",
      summary: "Primary line of defense against Anopheles mosquitoes carrying Plasmodium falciparum in Nigeria.",
      tips: [
        "Sleep under Long-Lasting Insecticidal Nets (LLINs) or Insecticide-Treated Nets (ITNs) every night.",
        "Ensure window and door mosquito netting/screens are intact without tears.",
        "Apply indoor residual spraying (IRS) with WHO-approved insecticides where recommended.",
        "Wear long-sleeved clothing and light-colored attire during dusk and night hours.",
        "Use DEET or Picaridin-based mosquito repellents on exposed skin when outdoors at night."
      ],
      key_recommendations: "Consistently using ITNs reduces malaria transmission by up to 50% in endemic regions.",
      source: "NMEP / WHO Nigeria Vector Control Strategy"
    },
    {
      id: "environmental_management",
      category: "community",
      title: "Environmental Sanitation & Breeding Site Reduction",
      badge: "Community Action",
      icon: "droplet",
      summary: "Eliminating stagnant water sources near homes to disrupt mosquito breeding lifecycles.",
      tips: [
        "Drain or fill puddles, discarded tires, cans, and open containers around the home.",
        "Keep drainage gutters clear and flowing to prevent standing water accumulation.",
        "Cover domestic water storage containers tightly with secure lids or mosquito-proof mesh.",
        "Clear tall grasses and overgrown vegetation within 10–15 meters of residential buildings.",
        "Support local larviciding in urban standing water reservoirs during rainy seasons."
      ],
      key_recommendations: "Anopheles mosquitoes lay eggs in clean stagnant water. Community sanitation reduces local mosquito density.",
      source: "Nigeria Federal Ministry of Health & Environmental Sanitation Guidelines"
    },
    {
      id: "vaccines_chemoprevention",
      category: "vaccine",
      title: "Malaria Vaccines & Chemoprevention (R21 / SMC / IPTp)",
      badge: "Medical Breakthrough",
      icon: "syringe",
      summary: "Latest immunization rollouts and seasonal chemoprevention policies in high-burden states.",
      tips: [
        "Ensure eligible infants (5 to 36 months) receive the R21/Matrix-M malaria vaccine doses according to state health timelines.",
        "Seasonal Malaria Chemoprevention (SMC): Administer monthly SPAQ treatments to children aged 3–59 months in northern seasonal states during rainy months.",
        "Intermittent Preventive Treatment in Pregnancy (IPTp-SP): Pregnant women should receive Sulfadoxine-Pyrimethamine starting at 13+ weeks gestational age at ANC clinics.",
        "Consult local primary healthcare centers (PHCs) for official vaccine schedules."
      ],
      key_recommendations: "Nigeria's roll-out of R21/Matrix-M vaccine combined with SMC drastically lowers childhood malaria mortality.",
      source: "NMEP National Immunization & Chemoprevention Guidelines"
    },
    {
      id: "diagnosis_testing",
      category: "treatment",
      title: "Testing Before Treatment ('Test Before ACT')",
      badge: "NMEP Policy Mandate",
      icon: "activity",
      summary: "Strict policy requiring parasite confirmation prior to antimalarial drug administration.",
      tips: [
        "Request a Rapid Diagnostic Test (RDT) or blood microscopy at a clinic before taking antimalarials.",
        "Do NOT self-medicate with leftover drugs or unverified monotherapy without test confirmation.",
        "Fever is caused by many conditions; negative malaria RDT requires investigating non-malarial causes (e.g., typhoid, viral fever).",
        "Seek care within 24 hours of fever onset, especially for young children and pregnant women."
      ],
      key_recommendations: "Testing avoids misuse of Artemisinin Combination Therapies (ACTs) and prevents drug resistance.",
      source: "NMEP Diagnosis and Treatment Guidelines for Malaria in Nigeria"
    },
    {
      id: "treatment_act",
      category: "treatment",
      title: "Artemisinin Combination Therapy (ACT) Guidelines",
      badge: "First-Line Treatment",
      icon: "pill",
      summary: "Approved first-line treatment regimens for confirmed uncomplicated malaria.",
      tips: [
        "First-line treatments: Artemether-Lumefantrine (AL) or Artesunate-Amodiaquine (AA).",
        "Complete the full 3-day course as prescribed, even if fever subsides after day 1.",
        "Take Artemether-Lumefantrine with fatty food or milk to ensure maximum drug absorption.",
        "Purchase medications only from registered pharmacies bearing NAFDAC verification numbers.",
        "Never use oral artemisinin monotherapy, as it increases treatment failure and resistance."
      ],
      key_recommendations: "Always complete full treatment cycles to prevent parasite recrudescence and drug resistance.",
      source: "NAFDAC & NMEP Antimalarial Drug Policy"
    },
    {
      id: "severe_malaria_warning",
      category: "emergency",
      title: "Early Warning Signs & Severe Malaria Emergency",
      badge: "Urgent Warning",
      icon: "alert",
      summary: "Recognizing life-threatening complications requiring immediate hospital admission.",
      tips: [
        "Inability to eat or drink, persistent severe vomiting.",
        "Extreme fatigue, prostration, or inability to sit/stand unaided.",
        "Convulsions, seizures, confusion, or altered consciousness (Cerebral Malaria).",
        "Deep rapid breathing, respiratory distress, or severe jaundice (yellow eyes/skin).",
        "Dark/coca-cola colored urine or acute severe anemia (extreme pale palms/gums)."
      ],
      key_recommendations: "Severe malaria requires intravenous Artesunate in a clinical hospital setting immediately.",
      source: "WHO / NCDC Severe Malaria Management Protocol"
    }
  ];

  let filtered = allGuidelines;

  if (categoryFilter && categoryFilter !== "all") {
    filtered = filtered.filter((g) => g.category === categoryFilter);
  }

  if (query) {
    filtered = filtered.filter(
      (g) =>
        g.title.toLowerCase().includes(query) ||
        g.summary.toLowerCase().includes(query) ||
        g.badge.toLowerCase().includes(query) ||
        g.tips.some((t) => t.toLowerCase().includes(query)) ||
        g.key_recommendations.toLowerCase().includes(query)
    );
  }

  res.json({
    sources: [
      "National Malaria Elimination Programme (NMEP Nigeria)",
      "World Health Organization (WHO Africa)",
      "Nigeria Centre for Disease Control (NCDC)"
    ],
    last_updated: "2026 National Health Guidelines",
    total: filtered.length,
    guidelines: filtered
  });
});

// --- Admin Routes ---
app.get("/api/v1/admin/users", authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(users.map(formatUserOut));
});

app.get("/api/v1/admin/predictions", authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(
    predictions.map((p) => ({
      id: p.id,
      user_id: p.user_id,
      prediction: p.prediction,
      confidence: p.confidence,
      risk: p.risk,
      recommendation: p.recommendation,
      created_at: p.created_at,
    }))
  );
});

app.get("/api/v1/admin/statistics", authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const totalUsers = users.length;
  const totalPredictions = predictions.length;
  const malariaCases = predictions.filter((p) => p.prediction === "Malaria").length;
  const avgConfidence =
    totalPredictions > 0
      ? predictions.reduce((acc, p) => acc + p.confidence, 0) / totalPredictions
      : 0;

  res.json({
    total_users: totalUsers,
    total_predictions: totalPredictions,
    malaria_cases: malariaCases,
    avg_confidence: Math.round(avgConfidence * 10) / 10,
  });
});

// ---------------------------------------------------------------------------
// Static Assets & Frontend Routing
// ---------------------------------------------------------------------------

const frontendDir = path.join(process.cwd(), "frontend");
app.use(express.static(frontendDir, { extensions: ["html", "htm"] }));

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

// Catch-all route for unknown frontend routes
app.get("*", (req: Request, res: Response) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ detail: "Endpoint not found" });
  }
  res.status(404).sendFile(path.join(frontendDir, "404.html"));
});

// ---------------------------------------------------------------------------
// Server Start
// ---------------------------------------------------------------------------

app.listen(PORT, HOST, () => {
  console.log(`AfriSafe AI Express server running on http://${HOST}:${PORT}`);
});
