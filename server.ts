import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import { connectDB, User } from "./server/mongodb";

dotenv.config();

const PORT = 3000;

export const app = express();
app.use(express.json({ limit: "15mb" }));

// Establish standard database connection safely without crashing development server
connectDB().catch((err) => {
  console.error("Critical warning: Initial MongoDB Atlas connection failed.", err);
});

// Middleware to secure all database transactions by ensuring the connection is active
app.use("/api", async (req, res, next) => {
  if (req.path === "/health") {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (err: any) {
    console.error("Critical: Database connection pending or failed in route guard:", err);
    const msg = (err.message || "").toLowerCase();
    if (msg.includes("mongodb_uri environment variable is not defined")) {
      return res.status(503).json({
        error: "MongoDB configuration is missing. Please define MONGODB_URI in your Settings > Secrets panel."
      });
    }
    if (msg.includes("bad auth") || msg.includes("authentication failed")) {
      return res.status(503).json({
        error: "MongoDB authentication failed. Please verify the username and password in your database connection string."
      });
    }
    res.status(503).json({
      error: `Database connection error: ${err.message || "The database service is temporarily offline."}`
    });
  }
});

  // Dynamic redirect URI helper for Google OAuth 2.0
  const getRedirectUri = (req: express.Request) => {
    const host = req.headers.host || "localhost:3000";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const protocol = !isLocal && (req.secure || req.headers["x-forwarded-proto"] === "https") ? "https" : "http";
    return `${protocol}://${host}/api/auth/google/callback`;
  };

  // Endpoint 1: Retrieve Google Consent screen URL
  app.get("/api/auth/google/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(404).json({ 
        error: "Google Client ID is not configured. Please add GOOGLE_CLIENT_ID in Settings > Secrets." 
      });
    }

    const redirectUri = getRedirectUri(req);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
      access_type: "offline",
      prompt: "consent"
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ url: googleAuthUrl });
  });

  // Endpoint 2: Google OAuth callback code exchanger
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: "OAUTH_AUTH_FAILURE", error: "No authorization code returned." }, "*");
              window.close();
            </script>
          </body>
        </html>
      `);
    }

    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = getRedirectUri(req);

      // Exchange authorize code for token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId || "",
          client_secret: clientSecret || "",
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || tokenData.error || "Failed to exchange token");
      }

      // Fetch user profile from Google Profile APIs
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { "Authorization": `Bearer ${tokenData.access_token}` }
      });

      const profileData = await userResponse.json();
      if (!userResponse.ok) {
        throw new Error("Failed to retrieve Google userinfo.");
      }

      // Find or create candidate document in MongoDB Atlas
      const email = profileData.email.toLowerCase();
      const sessionToken = `session-${crypto.randomUUID()}`;

      let userDoc = await User.findOne({ email });
      if (!userDoc) {
        userDoc = new User({
          email,
          googleId: profileData.sub,
          name: profileData.name || email.split("@")[0],
          picture: profileData.picture || ""
        });
      } else {
        userDoc.name = profileData.name || userDoc.name;
        userDoc.picture = profileData.picture || userDoc.picture;
        userDoc.googleId = profileData.sub || userDoc.googleId;
      }

      // Generate/update active authentication token
      userDoc.sessionToken = sessionToken;
      // Also write directly as custom MongoDB field
      userDoc.set("sessionToken", sessionToken);
      await userDoc.save();

      // Return communication page sending success payload directly to the parent preview iframe
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: "OAUTH_AUTH_SUCCESS", 
                  data: {
                    token: "${sessionToken}",
                    user: {
                      email: "${userDoc.email}",
                      name: "${userDoc.name.replace(/"/g, '\\"')}",
                      picture: "${userDoc.picture}"
                    }
                  } 
                }, "*");
                window.close();
              } else {
                window.location.href = "/";
              }
            </script>
            <p style="font-family: sans-serif; text-align: center; margin-top: 50px;">
              Auth details verified! This browser window will now close dynamically.
            </p>
          </body>
        </html>
      `);

    } catch (err: any) {
      console.error("Google Auth OAuth exchange crash:", err);
      return res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: "OAUTH_AUTH_FAILURE", error: "${err.message || 'System verification error.'}" }, "*");
              window.close();
            </script>
            <p style="font-family: sans-serif; color: red; text-align: center;">Error: ${err.message || 'System verification error.'}</p>
          </body>
        </html>
      `);
    }
  });

  // Helper function for password hashing using pbkdf2 and Node's built-in crypto
  const hashPassword = (password: string, salt: string): string => {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  };

  // Endpoint 3: Native user registration with email and password
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(405).json({ error: "Email and password are required." });
      }

      const cleanEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ error: "An account with this email already exists." });
      }

      // Generate secure salt and hash the password
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = hashPassword(password, salt);
      const sessionToken = `session-${crypto.randomUUID()}`;

      // Create new user document
      const userDoc = new User({
        email: cleanEmail,
        name: name ? name.trim() : cleanEmail.split("@")[0],
        picture: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanEmail}`,
        salt,
        passwordHash,
        sessionToken
      });

      await userDoc.save();

      res.json({
        success: true,
        token: sessionToken,
        user: {
          email: userDoc.email,
          name: userDoc.name,
          picture: userDoc.picture
        }
      });
    } catch (err: any) {
      console.error("Native registration crash:", err);
      res.status(500).json({ error: "Internal server error during registration." });
    }
  });

  // Endpoint 3.5: Native user login with email and password
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(405).json({ error: "Email and password are required." });
      }

      const cleanEmail = email.trim().toLowerCase();
      const userDoc = await User.findOne({ email: cleanEmail });
      if (!userDoc || !userDoc.passwordHash || !userDoc.salt) {
        return res.status(400).json({ error: "Invalid email or password." });
      }

      // Verify password match
      const checkHash = hashPassword(password, userDoc.salt);
      if (checkHash !== userDoc.passwordHash) {
        return res.status(400).json({ error: "Invalid email or password." });
      }

      // Generate or update session token
      const sessionToken = `session-${crypto.randomUUID()}`;
      userDoc.sessionToken = sessionToken;
      await userDoc.save();

      res.json({
        success: true,
        token: sessionToken,
        user: {
          email: userDoc.email,
          name: userDoc.name,
          picture: userDoc.picture
        }
      });
    } catch (errValue: any) {
      console.error("Native login crash:", errValue);
      res.status(500).json({ error: "Internal server error during login." });
    }
  });

  // Endpoint 3.8: Verify Clerk user session database existence prior to granting access
  app.post("/api/auth/verify-clerk", async (req, res) => {
    try {
      const { clerkId, email, name, picture, action } = req.body;
      if (!clerkId) {
        return res.status(400).json({ error: "Missing Clerk User Identifier." });
      }

      const cleanEmail = (email || "").trim().toLowerCase();
      // Look up user by clerkId or by email
      let userDoc = await User.findOne({ clerkId });
      if (!userDoc && cleanEmail) {
        userDoc = await User.findOne({ email: cleanEmail });
      }

      if (action === "login") {
        if (!userDoc) {
          return res.status(400).json({ error: "Account does not exist. Please register first." });
        }
        // If user document was found but Clerk ID is not linked, link it now
        if (!userDoc.clerkId) {
          userDoc.clerkId = clerkId;
        }
        if (name && !userDoc.name) userDoc.name = name;
        if (picture && !userDoc.picture) userDoc.picture = picture;
        await userDoc.save();
      } else if (action === "register") {
        if (userDoc) {
          return res.status(400).json({ error: "Account already exists. Please sign in instead." });
        }
        // If user does not exist, create a new record
        userDoc = new User({
          clerkId,
          email: cleanEmail,
          name: name ? name.trim() : cleanEmail.split("@")[0],
          picture: picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanEmail}`
        });
        await userDoc.save();
      }

      res.json({
        success: true,
        user: {
          email: userDoc.email,
          name: userDoc.name,
          picture: userDoc.picture
        }
      });
    } catch (err: any) {
      console.error("Clerk pre-verification error:", err);
      res.status(500).json({ error: "Failed to verify workspace credentials." });
    }
  });

  // Middleware to fetch user session from Clerk token header
  const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized session credentials." });
      }

      const token = authHeader.split(" ")[1];
      let user = null;

      if (token && (token.startsWith("user_") || req.headers["x-clerk-email"])) {
        // Clerk authentication
        const email = (req.headers["x-clerk-email"] as string || "").toLowerCase();
        const name = req.headers["x-clerk-name"] as string || "";
        const picture = req.headers["x-clerk-picture"] as string || "";
        
        // Find by clerkId first
        user = await User.findOne({ clerkId: token });
        if (!user && email) {
          // Fallback to finding by email to link existing account
          user = await User.findOne({ email });
          if (user) {
            user.clerkId = token;
            if (name && !user.name) user.name = name;
            if (picture && !user.picture) user.picture = picture;
            await user.save();
          }
        }

        if (!user && email) {
          // Create new user for Clerk
          user = new User({
            clerkId: token,
            email,
            name: name || email.split("@")[0],
            picture: picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${email}`
          });
          await user.save();
        }
      }

      if (!user && token) {
        // Native Email/Password or Dynamic OAuth session fallback
        user = await User.findOne({ sessionToken: token });
      }

      if (!user) {
        return res.status(401).json({ error: "Expired or invalid session token." });
      }

      // Attach user document directly to the request
      (req as any).user = user;
      next();
    } catch (err) {
      console.error("Auth middleware error:", err);
      res.status(500).json({ error: "Server authentication error." });
    }
  };

  // Endpoint 4: Fetch user's saved resume state from MongoDB Atlas
  app.get("/api/resume", authMiddleware, async (req: any, res) => {
    try {
      // Find specific user from request document
      const userDoc = req.user;
      res.json({
        resumeData: userDoc.resumeData,
        settings: userDoc.settings
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to load backup data from MongoDB Atlas." });
    }
  });

  // Endpoint 5: Save/Write user resume state to MongoDB Atlas
  app.post("/api/resume", authMiddleware, async (req: any, res) => {
    try {
      const { resumeData, settings } = req.body;
      const userDoc = req.user;

      userDoc.resumeData = resumeData;
      userDoc.settings = settings;
      await userDoc.save();

      res.json({ success: true, message: "Resume saved to MongoDB successfully." });
    } catch (err) {
      console.error("Save state error:", err);
      res.status(500).json({ error: "Failed to save data. Please check MongoDB logs." });
    }
  });

  // API Endpoint to check resume matching against a JD (original)
  app.post("/api/score", async (req, res) => {
    try {
      const { resumeData, jd } = req.body;
      if (!jd || !jd.trim()) {
        return res.status(400).json({ error: "Job Description is required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY environment variable is missing on the server. Please configure it in your Settings > Secrets panel." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Format current active resume and career archive nicely for the prompt
      const activeResumeText = JSON.stringify({
        personalInfo: resumeData.personalInfo,
        education: resumeData.education,
        experience: resumeData.experience,
        projects: resumeData.projects,
        skills: resumeData.skills,
      }, null, 2);

      const careerVaultText = JSON.stringify(resumeData.careerVault || [], null, 2);

      const prompt = `You are an elite, professional ATS Resume Architect and Career Consultant. 
Your objective is to compare an Active Resume against a targeted Job Description (JD), and evaluate any extras in the user's "Comprehensive Career Vault" (which contains achievements, projects, certifications, or tech they have worked on but aren't currently showcasing on this active resume).

Analyze the two carefully and output a JSON object obeying the schema instructions.

CRITICAL MENTORSHIP AND IMPROVEMENT GUIDELINES:
1. Evaluation Score: Range 0-100. Be honest and strict like high-end automated screeners. A perfect 90+ matching resume needs clear overlap in technologies, methodology, and senior/junior depth.

2. Identify missing technical/domain skills and general keywords (like action words, methodologies, or capabilities) present in the JD but not found or weak in the Active Resume.

3. SMART PLACEMENT DECISION ENGINE (Tailoring is NOT limited to a single approach):
   - You MUST intelligently decide where a missing skill, capability, or keyphrase is best integrated into the resume based on the JD's requirements.
   - SKILL-ONLY GAPS: If the JD lists a language, tool, or framework (e.g., "TypeScript", "Next.js", "Docker"), suggest appending it to the relevant category in the "skills" section (using the "append_skills" action).
   - COMPLEX CAPABILITIES / SYSTEM REQUIREMENTS: If the JD highlights complex design competencies (e.g., "highly scalable app", "real-time synchronization", "microservices"), do NOT just bury it in skills. Instead, intelligently formulate a specific enhancement targeting either an existing project (by replacing/inserting a bullet or modifying project titles) OR create a new dedicated project or experience entry (using the "add_item" action) showcasing this achievement.
   - SOURCING FROM VAULT: Always cross-reference the Comprehensive Career Vault. If an achievement or project related to the JD requirements exists in the vault, suggest importing/applying that vault item directly (e.g. action "add_item" in "projects" or "experience").
   - AI CRAFTED TAILORING: If the skill, concept, or feature is completely absent from both the Active Resume and Career Vault, you may still suggest adding it to the skills or projects, but note it as "AI Crafted Tailoring".
   - SMART REWRITES: Suggest rewriting existing experience role bullets or project bullets to incorporate the missing keywords from the JD where they fit contextually.

4. ALWAYS ENFORCE STRUCTURED METRIC OPTIMIZATION: Convert loose, descriptive bullet points into quantified output-driven impact statements. Every suggested experience or project bullet MUST use numbers, percentages, dollar amounts, time saved, or efficiency improvements where possible (e.g. "Designed a highly scalable app optimizing API latency by 35% using Redis caching", "Slashed developer onboarding time by 4 hours under Playwright suite").
   
Active Resume Details:
${activeResumeText}

Job Description (JD) to match:
${jd}

Comprehensive Career Vault Sourced Sinks:
${careerVaultText}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.INTEGER,
                description: "Match score out of 100 based on keyword match, tech stacks, and metrics alignment."
              },
              summary: {
                type: Type.STRING,
                description: "Brief, high-value 2-3 sentence overview analyzing the match depth and recommendations."
              },
              missingSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key technical skills, frameworks, or tools present in the JD but not in active resume."
              },
              missingKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Missing industry-standard terms, action verbs, or systems phrases."
              },
              suggestedModifications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    section: {
                      type: Type.STRING,
                      description: "The section target: 'skills', 'projects', 'experience', 'education' or 'personal'"
                    },
                    itemId: {
                      type: Type.STRING,
                      description: "The unique ID (e.g. 'exp-1', 'proj-2') of the active item to change. Sinks an empty string if creating blank/new items."
                    },
                    action: {
                      type: Type.STRING,
                      description: "The action to perform: 'modify_item' (replace/mod fields of item), 'add_item' (insert complete entry), 'replace_bullet' (replace a single bullet), 'append_skills' (add new list item to skills), 'insert_bullet' (add a bullet point)"
                    },
                    bulletIndex: {
                      type: Type.INTEGER,
                      description: "The 0-based index of the bullet to replace or modify, if action is 'replace_bullet'."
                    },
                    explanation: {
                      type: Type.STRING,
                      description: "Clear explanation highlighting why this bridges the JD gap, and how it correlates with the Career Vault."
                    },
                    originalContent: {
                      type: Type.STRING,
                      description: "The previous bullet point, skill, or title that is being customized."
                    },
                    suggestedContent: {
                      type: Type.STRING,
                      description: "The target modification written out in full (e.g. the full tailored bullet point, complete project stack, or full skill subhead). Use quantified numeric metrics (%, $, hrs) for maximum ATS impact."
                    },
                    itemDetails: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING, description: "Short, clean 2-4 word project title or role/title (e.g., 'Scalable Storage System', 'Lead Software Engineer'). NEVER a long sentence or bullet description." },
                        subtitle: { type: Type.STRING, description: "Relevant company, organization or subtitle (e.g. 'Stripe')." },
                        dates: { type: Type.STRING, description: "Relevant timeframe or date (e.g. '2026', '2024 - Present')." },
                        technologies: { type: Type.STRING, description: "Technologies used as comma-separated list (e.g. 'Go, Redis, Kubernetes'). Only for relevant projects." },
                        bullets: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "List of highly detailed, metric-optimized (using %, $, hrs etc) impact-driven bullet points for this project or role to prevent page overflows."
                        }
                      }
                    },
                    archiveItemSource: {
                      type: Type.STRING,
                      description: "Source mapping information, e.g. 'Adapted from Career Vault: ScaleStore' or 'AI Crafted tailoring using numerical metric standard'."
                    }
                  },
                  required: ["section", "action", "explanation", "suggestedContent", "archiveItemSource"]
                },
                description: "Specific actionable suggestions to tailormake this resume for the JD, emphasizing quantified metrics."
              }
            },
            required: ["score", "summary", "missingSkills", "missingKeywords", "suggestedModifications"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        return res.status(500).json({ error: "Empty response received from Gemini" });
      }

      const parsedJSON = JSON.parse(resultText);
      res.json(parsedJSON);

    } catch (err: any) {
      console.error("Gemini Scoring Error:", err);
      res.status(500).json({ error: err.message || "An unexpected error occurred during resume evaluation." });
    }
  });

  // Express API healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy" });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
    }).catch((err) => {
      console.error("Vite Dev Server creation error:", err);
    });
  } else {
    if (!process.env.VERCEL) {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server launched and listening coordinates: http://localhost:${PORT}`);
    });
  }

export default app;
