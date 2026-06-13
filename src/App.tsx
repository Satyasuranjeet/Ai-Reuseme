import React, { useState, useRef, useMemo, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  FileCode, 
  Check, 
  RefreshCw, 
  Settings, 
  Eye, 
  Copy,
  BookOpen, 
  Briefcase, 
  FolderGit2, 
  Wrench, 
  User, 
  Maximize2, 
  Minimize2, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Scale,
  Sparkles,
  Upload,
  FileDown,
  ExternalLink,
  Undo,
  Redo,
  Cloud,
  Save
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResumeData, PageSettings, EducationEntry, ExperienceEntry, ProjectEntry, TechnicalSkill, VaultItem } from "./types";
import { initialResumeData, defaultSettings } from "./initialState";
import { generateLatex } from "./latexGenerator";
import LandingPage from "./components/LandingPage";

import { useUser, useAuth } from "@clerk/clerk-react";

export default function App() {
  // State for resume data and settings
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [settings, setSettings] = useState<PageSettings>(defaultSettings);
  
  // Clerk Hook Integrations
  const { isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useAuth();

  // User Authentication and MongoDB states
  const [user, setUser] = useState<{ email: string; name: string; picture: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [cloudSaveStatus, setCloudSaveStatus] = useState<"synced" | "saving" | "error" | "unsaved" | "none">("none");
  const [clerkError, setClerkError] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const isInitialLoadDone = useRef<boolean>(false);

  // Synchronize Clerk state with local application authentication context and perform pre-verification
  useEffect(() => {
    if (isClerkLoaded) {
      if (isClerkSignedIn && clerkUser) {
        const verifyUser = async () => {
          setIsVerifying(true);
          try {
            const email = clerkUser.primaryEmailAddress?.emailAddress || "";
            const name = clerkUser.fullName || clerkUser.username || email.split("@")[0] || "";
            const picture = clerkUser.imageUrl || "";
            const action = localStorage.getItem("clerk_auth_action") || "login";

            const res = await fetch("/api/auth/verify-clerk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clerkId: clerkUser.id,
                email,
                name,
                picture,
                action
              })
            });

            const data = await res.json();
            if (res.ok) {
              setUser({ email, name, picture });
              setToken(clerkUser.id);
              setShowLanding(false);
              setClerkError("");
            } else {
              setClerkError(data.error || "Verification failed.");
              setUser(null);
              setToken(null);
              setShowLanding(true);
              try {
                await clerkSignOut();
              } catch (errSig) {
                console.error("Clerk pre-verification sign out error:", errSig);
              }
            }
          } catch (err) {
            console.error("Clerk pre-verification check failed:", err);
            setClerkError("Failed to check database credentials. Please try again.");
            setUser(null);
            setToken(null);
            setShowLanding(true);
            try {
              await clerkSignOut();
            } catch (errSig) {}
          } finally {
            setIsVerifying(false);
          }
        };

        verifyUser();
      } else {
        setUser(null);
        setToken(null);
        setShowLanding(true);
      }
    }
  }, [isClerkLoaded, isClerkSignedIn, clerkUser]);

  // General auth headers provider that dynamically passes Clerk identifiers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
    if (token && token.startsWith("user_") && user) {
      headers["x-clerk-email"] = user.email;
      headers["x-clerk-name"] = user.name;
      headers["x-clerk-picture"] = user.picture;
    }
    return headers;
  };

  // Fetch initial profile/resume data from MongoDB Atlas on cold start
  useEffect(() => {
    if (!token) {
      isInitialLoadDone.current = false;
      return;
    }
    const fetchCloudData = async () => {
      try {
        setCloudSaveStatus("saving");
        const res = await fetch("/api/resume", {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (data.resumeData) {
            setResumeData(data.resumeData);
          }
          if (data.settings) {
            setSettings(data.settings);
          }
          setCloudSaveStatus("synced");
        } else {
          // If session expired (e.g. server restarted and removed document), log out
          if (res.status === 401) {
            handleLogout();
          } else {
            setCloudSaveStatus("error");
          }
        }
      } catch (err) {
        console.error("Cold start fetch error:", err);
        setCloudSaveStatus("error");
      } finally {
        setTimeout(() => {
          isInitialLoadDone.current = true;
        }, 400);
      }
    };
    fetchCloudData();
  }, [token]);

  // Track any resume or settings modifications after initial load and flag them as unsaved
  useEffect(() => {
    if (!token || !isInitialLoadDone.current) return;
    setCloudSaveStatus("unsaved");
  }, [resumeData, settings, token]);

  // Manual Cloud Save to MongoDB Atlas on action
  const handleCloudSave = async () => {
    if (!token) return;
    setCloudSaveStatus("saving");
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ resumeData, settings })
      });
      if (res.ok) {
        setCloudSaveStatus("synced");
      } else {
        setCloudSaveStatus("error");
      }
    } catch (err) {
      console.error("Cloud manual save error:", err);
      setCloudSaveStatus("error");
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S integration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (token) {
          handleCloudSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [token, resumeData, settings]);

  const handleLoginSuccess = async (newToken: string, newUser: { email: string; name: string; picture: string }) => {
    localStorage.setItem("satya_resume_token", newToken);
    localStorage.setItem("satya_resume_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setShowLanding(false);
  };

  const handleLogout = async () => {
    if (isClerkSignedIn) {
      try {
        await clerkSignOut();
      } catch (e) {
        console.error("Clerk sign-out warning:", e);
      }
    }
    localStorage.removeItem("satya_resume_token");
    localStorage.removeItem("satya_resume_user");
    setToken(null);
    setUser(null);
    setShowLanding(true);
    setCloudSaveStatus("none");
  };

  
  // Undo/Redo history stack
  const [history, setHistory] = useState<ResumeData[]>([initialResumeData]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // AI JD Matching & Scoring states
  const [jd, setJd] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalError, setEvalError] = useState<string>("");
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    summary: string;
    missingSkills: string[];
    missingKeywords: string[];
    suggestedModifications: Array<{
      section: string;
      itemId: string;
      action: string;
      bulletIndex?: number;
      explanation: string;
      originalContent?: string;
      suggestedContent: string;
      archiveItemSource: string;
      applied?: boolean;
      itemDetails?: {
        title?: string;
        subtitle?: string;
        dates?: string;
        technologies?: string;
        bullets?: string[];
      };
    }>;
  } | null>(null);

  // New Career Archive / Vault Form state
  const [vaultFilter, setVaultFilter] = useState<"all" | "project" | "experience" | "skill" | "certification">("all");
  const [showAddVaultForm, setShowAddVaultForm] = useState<boolean>(false);
  const [newVaultItem, setNewVaultItem] = useState<{
    type: "project" | "experience" | "skill" | "certification";
    title: string;
    subtitle: string;
    description: string;
    technologies: string;
    dates: string;
  }>({
    type: "project",
    title: "",
    subtitle: "",
    description: "",
    technologies: "",
    dates: ""
  });

  // UI states
  const [activeTab, setActiveTab] = useState<"preview" | "latex">("preview");
  const [activeSection, setActiveSection] = useState<string>("ai-ats"); // Open AI ATS Tailor section by default
  const [zoom, setZoom] = useState<number>(85); // zoom percent for A4 preview
  const [copied, setCopied] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [importError, setImportError] = useState<string>("");
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  // Hidden file input for uploading profile backup JSON
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History tracking state
  const isNavigatingHistoryRef = useRef(false);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      isNavigatingHistoryRef.current = true;
      setHistoryIndex(nextIdx);
      setResumeData(history[nextIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      isNavigatingHistoryRef.current = true;
      setHistoryIndex(nextIdx);
      setResumeData(history[nextIdx]);
    }
  };

  // Automated history listener
  useEffect(() => {
    if (isNavigatingHistoryRef.current) {
      isNavigatingHistoryRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setHistory(prev => {
        const currentHead = prev[historyIndex];
        // If content is identical to the current snapshot head, ignore
        if (currentHead && JSON.stringify(currentHead) === JSON.stringify(resumeData)) {
          return prev;
        }
        // Truncate future elements on new modification branch
        const truncated = prev.slice(0, historyIndex + 1);
        const updated = [...truncated, resumeData];
        setHistoryIndex(updated.length - 1);
        return updated;
      });
    }, 800); // 800ms debounce
    return () => clearTimeout(timer);
  }, [resumeData]);

  // Evaluate dynamic candidate Resume against Job Description
  const evaluateResume = async () => {
    if (!jd.trim()) {
      setEvalError("Please paste a Valid Job Description first.");
      return;
    }
    
    setIsEvaluating(true);
    setEvalError("");
    setEvaluationResult(null);

    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, jd })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resume.");
      }

      setEvaluationResult(data);
    } catch (err: any) {
      console.error("Evaluation Error Client-side:", err);
      setEvalError(err.message || "Failed to connect to the scoring service.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Splicing modifications suggested by Gemini directly into the resume data
  const applyAiModification = (modIndex: number) => {
    if (!evaluationResult) return;
    const mod = evaluationResult.suggestedModifications[modIndex];
    if (mod.applied) return;

    setResumeData(prev => {
      const updated = JSON.parse(JSON.stringify(prev)) as ResumeData; // Deep clone

      if (mod.section === "experience") {
        updated.experience = updated.experience.map(exp => {
          if (exp.id === mod.itemId) {
            let bullets = [...exp.bullets];
            if (mod.action === "replace_bullet" && typeof mod.bulletIndex === "number") {
              bullets[mod.bulletIndex] = mod.suggestedContent;
            } else if (mod.action === "insert_bullet") {
              bullets.push(mod.suggestedContent);
            } else if (mod.action === "modify_item") {
              const cleanTitle = mod.itemDetails?.title || (mod.suggestedContent.length < 60 ? mod.suggestedContent : undefined);
              if (cleanTitle) {
                exp.role = cleanTitle;
              }
              if (mod.itemDetails?.subtitle) {
                exp.company = mod.itemDetails.subtitle;
              }
              if (mod.itemDetails?.bullets && mod.itemDetails.bullets.length > 0) {
                bullets = mod.itemDetails.bullets;
              } else if (mod.suggestedContent.length >= 60) {
                bullets.push(mod.suggestedContent);
              }
            }
            exp.bullets = bullets;
          }
          return exp;
        });
      } 
      else if (mod.section === "projects") {
        updated.projects = updated.projects.map(proj => {
          if (proj.id === mod.itemId) {
            let bullets = [...proj.bullets];
            if (mod.action === "replace_bullet" && typeof mod.bulletIndex === "number") {
              bullets[mod.bulletIndex] = mod.suggestedContent;
            } else if (mod.action === "insert_bullet") {
              bullets.push(mod.suggestedContent);
            } else if (mod.action === "modify_item") {
              const cleanTitle = mod.itemDetails?.title || (mod.suggestedContent.length < 60 ? mod.suggestedContent : undefined);
              if (cleanTitle) {
                proj.title = cleanTitle;
              }
              if (mod.itemDetails?.technologies) {
                proj.technologies = mod.itemDetails.technologies;
              }
              if (mod.itemDetails?.bullets && mod.itemDetails.bullets.length > 0) {
                bullets = mod.itemDetails.bullets;
              } else if (mod.suggestedContent.length >= 60) {
                bullets.push(mod.suggestedContent);
              }
            }
            proj.bullets = bullets;
          }
          return proj;
        });
      } 
      else if (mod.section === "skills") {
        if (mod.action === "append_skills" || mod.action === "insert_bullet" || mod.action === "add_item") {
          let foundCategory = false;
          updated.skills = updated.skills.map(skill => {
            const matchesCategory = skill.category.toLowerCase().includes(mod.itemId?.toLowerCase() || "") || 
                                    skill.id === mod.itemId ||
                                    skill.category.toLowerCase() === "languages" || 
                                    skill.category.toLowerCase().includes("stack");
            if (matchesCategory && !foundCategory) {
              if (!skill.skills.includes(mod.suggestedContent)) {
                foundCategory = true;
                skill.skills = skill.skills ? `${skill.skills}, ${mod.suggestedContent}` : mod.suggestedContent;
              }
            }
            return skill;
          });
          
          if (!foundCategory) {
            updated.skills.push({
              id: `skill-${Date.now()}`,
              category: "Sourced Tech",
              skills: mod.suggestedContent
            });
          }
        }
      }
      else if (mod.section === "education") {
        if (mod.action === "add_item") {
          updated.education.push({
            id: `edu-${Date.now()}`,
            degree: mod.itemDetails?.title || mod.suggestedContent,
            institution: mod.itemDetails?.subtitle || "Sourced Institution",
            score: "CGPA: 9.0",
            dates: mod.itemDetails?.dates || "2024"
          });
        }
      }

      if (mod.action === "add_item") {
        if (mod.section === "projects") {
          const vaultItem = resumeData.careerVault?.find(v => v.id === mod.itemId || v.title === mod.suggestedContent);
          
          let finalTitle = mod.itemDetails?.title || vaultItem?.title || "AI Enhanced Project";
          let finalBullets = mod.itemDetails?.bullets || (vaultItem?.description ? [vaultItem.description] : [mod.suggestedContent]);
          let finalDesc = vaultItem?.description || "Project demonstrating key engineering patterns.";

          if (finalTitle.length > 60) {
            finalBullets = [finalTitle, ...finalBullets];
            finalDesc = finalTitle;
            finalTitle = "Scaled System & Optimization Project";
          }

          updated.projects.push({
            id: `proj-${Date.now()}`,
            title: finalTitle,
            description: finalDesc,
            dates: mod.itemDetails?.dates || vaultItem?.dates || "2024",
            technologies: mod.itemDetails?.technologies || vaultItem?.technologies || "React, TypeScript, Node.js",
            bullets: finalBullets,
            link: ""
          });
        } else if (mod.section === "experience") {
          const vaultItem = resumeData.careerVault?.find(v => v.id === mod.itemId);
          
          let finalRole = mod.itemDetails?.title || vaultItem?.title || "AI Sourced Specialist";
          let finalBullets = mod.itemDetails?.bullets || (vaultItem?.description ? [vaultItem.description] : [mod.suggestedContent]);

          if (finalRole.length > 60) {
            finalBullets = [finalRole, ...finalBullets];
            finalRole = "Software Engineering Specialist";
          }

          updated.experience.push({
            id: `exp-${Date.now()}`,
            role: finalRole,
            company: mod.itemDetails?.subtitle || vaultItem?.subtitle || "Consultant",
            locationType: "Remote",
            employmentType: "Full-time",
            dates: mod.itemDetails?.dates || vaultItem?.dates || "Start - End",
            bullets: finalBullets
          });
        }
      }

      return updated;
    });

    // Toggle option as applied
    setEvaluationResult(prevResult => {
      if (!prevResult) return null;
      return {
        ...prevResult,
        suggestedModifications: prevResult.suggestedModifications.map((m, idx) => 
          idx === modIndex ? { ...m, applied: true } : m
        )
      };
    });
  };

  const applyAllAiModifications = () => {
    if (!evaluationResult) return;
    
    // We apply each un-applied recommendation sequentially
    evaluationResult.suggestedModifications.forEach((mod, idx) => {
      if (!mod.applied) {
        applyAiModification(idx);
      }
    });
  };

  // Sourcing archive / Vault helpers
  const handleAddVaultItem = () => {
    if (!newVaultItem.title.trim() || !newVaultItem.description.trim()) return;
    
    const item: VaultItem = {
      id: `vault-${Date.now()}`,
      type: newVaultItem.type,
      title: newVaultItem.title,
      subtitle: newVaultItem.subtitle,
      description: newVaultItem.description,
      technologies: newVaultItem.type === "project" ? newVaultItem.technologies : undefined,
      dates: newVaultItem.dates
    };

    setResumeData(prev => {
      const updated = {
        ...prev,
        careerVault: [...(prev.careerVault || []), item]
      };
      return updated;
    });

    // Reset Form
    setNewVaultItem({
      type: "project",
      title: "",
      subtitle: "",
      description: "",
      technologies: "",
      dates: ""
    });
    setShowAddVaultForm(false);
  };

  const handleDeleteVaultItem = (id: string) => {
    setResumeData(prev => {
      const updated = {
        ...prev,
        careerVault: (prev.careerVault || []).filter(item => item.id !== id)
      };
      return updated;
    });
  };

  // Compile LaTeX string from state
  const latexCode = useMemo(() => {
    return generateLatex(resumeData, settings);
  }, [resumeData, settings]);

  // Handle single personal info changes
  const handlePersonalChange = (field: keyof typeof resumeData.personalInfo, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  // Generic helpers to update array items
  const updateEducation = (id: string, field: keyof EducationEntry, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    }));
  };

  const addEducation = () => {
    const newItem: EducationEntry = {
      id: `edu-${Date.now()}`,
      degree: "Degree Name / Certificate",
      institution: "University / Institute Name",
      score: "CGPA: 9.0 or Score%",
      dates: `${new Date().getFullYear() - 4}-${new Date().getFullYear()}`
    };
    setResumeData(prev => ({ ...prev, education: [...prev.education, newItem] }));
    setActiveSection("education");
  };

  const deleteEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const moveEducation = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= resumeData.education.length) return;
    
    setResumeData(prev => {
      const list = [...prev.education];
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return { ...prev, education: list };
    });
  };

  // Experience changes
  const updateExperience = (id: string, field: keyof ExperienceEntry, value: any) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }));
  };

  const addExperience = () => {
    const newItem: ExperienceEntry = {
      id: `exp-${Date.now()}`,
      role: "Job Title / Role Name",
      company: "Company or Organisation Name",
      locationType: "Remote / On-site / Hybrid",
      employmentType: "Full-time / Internship / Contract",
      dates: "Start Month Year - End Month Year",
      bullets: ["Developed a scalable web dashboard boosting metrics by 20%.", "Collaborated with multi-disciplinary engineering teams to ship production features."]
    };
    setResumeData(prev => ({ ...prev, experience: [...prev.experience, newItem] }));
    setActiveSection("experience");
  };

  const deleteExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const moveExperience = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= resumeData.experience.length) return;
    
    setResumeData(prev => {
      const list = [...prev.experience];
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return { ...prev, experience: list };
    });
  };

  const addExperienceBullet = (expId: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => {
        if (exp.id === expId) {
          return { ...exp, bullets: [...exp.bullets, "New achievement bullet point..."] };
        }
        return exp;
      })
    }));
  };

  const updateExperienceBullet = (expId: string, bulletIndex: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => {
        if (exp.id === expId) {
          const newBullets = [...exp.bullets];
          newBullets[bulletIndex] = value;
          return { ...exp, bullets: newBullets };
        }
        return exp;
      })
    }));
  };

  const deleteExperienceBullet = (expId: string, bulletIndex: number) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => {
        if (exp.id === expId) {
          return { ...exp, bullets: exp.bullets.filter((_, idx) => idx !== bulletIndex) };
        }
        return exp;
      })
    }));
  };

  // Projects changes
  const updateProject = (id: string, field: keyof ProjectEntry, value: any) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => proj.id === id ? { ...proj, [field]: value } : proj)
    }));
  };

  const addProject = () => {
    const newItem: ProjectEntry = {
      id: `proj-${Date.now()}`,
      title: "Project Title",
      description: "Brief overview of what this project accomplishes in one sentence.",
      dates: "",
      technologies: "React, Node.js, Express, Tailwind CSS",
      bullets: ["Architected robust local database triggers executing state synchronizations.", "Designed high performance server handlers with low-latency APIs."],
      link: ""
    };
    setResumeData(prev => ({ ...prev, projects: [...prev.projects, newItem] }));
    setActiveSection("projects");
  };

  const deleteProject = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }));
  };

  const moveProject = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= resumeData.projects.length) return;
    
    setResumeData(prev => {
      const list = [...prev.projects];
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return { ...prev, projects: list };
    });
  };

  const addProjectBullet = (projId: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => {
        if (proj.id === projId) {
          return { ...proj, bullets: [...proj.bullets, "New key implementation detail..."] };
        }
        return proj;
      })
    }));
  };

  const updateProjectBullet = (projId: string, bulletIndex: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => {
        if (proj.id === projId) {
          const newBullets = [...proj.bullets];
          newBullets[bulletIndex] = value;
          return { ...proj, bullets: newBullets };
        }
        return proj;
      })
    }));
  };

  const deleteProjectBullet = (projId: string, bulletIndex: number) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => {
        if (proj.id === projId) {
          return { ...proj, bullets: proj.bullets.filter((_, idx) => idx !== bulletIndex) };
        }
        return proj;
      })
    }));
  };

  // Skills changes
  const updateSkill = (id: string, field: keyof TechnicalSkill, value: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.map(skill => skill.id === id ? { ...skill, [field]: value } : skill)
    }));
  };

  const addSkillCategory = () => {
    const newItem: TechnicalSkill = {
      id: `skill-${Date.now()}`,
      category: "Category Name",
      skills: "Skill Item 1, Skill Item 2, Skill Item 3"
    };
    setResumeData(prev => ({ ...prev, skills: [...prev.skills, newItem] }));
    setActiveSection("skills");
  };

  const deleteSkillCategory = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.id !== id)
    }));
  };

  const moveSkill = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= resumeData.skills.length) return;
    
    setResumeData(prev => {
      const list = [...prev.skills];
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return { ...prev, skills: list };
    });
  };

  // Settings helpers
  const handleSettingChange = (field: keyof PageSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset to default template
  const handleReset = () => {
    if (window.confirm("Are you sure you want to restore the default initial template? This will replace your current edits with Satya's template resume.")) {
      setResumeData(initialResumeData);
      setSettings(defaultSettings);
    }
  };

  // Copy LaTeX code to clipboard
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(latexCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Download LaTeX .tex file
  const handleDownloadTex = () => {
    const element = document.createElement("a");
    const file = new Blob([latexCode], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${resumeData.personalInfo.name.replace(/\s+/g, "_")}_Resume.tex`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Open and load LaTeX resume snippet directly in Overleaf via virtual POST form
  const handleOpenInOverleaf = () => {
    const form = document.createElement("form");
    form.action = "https://www.overleaf.com/docs";
    form.method = "POST";
    form.target = "_blank";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "encoded_snip";
    input.value = encodeURIComponent(latexCode);

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  // Export local state JSON
  const handleExportJson = () => {
    const exportObj = {
      version: "1.0",
      settings,
      resumeData
    };
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${resumeData.personalInfo.name.replace(/\s+/g, "_")}_ResumeData.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Dynamic file upload load json
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.resumeData && parsed.settings) {
          setResumeData(parsed.resumeData);
          setSettings(parsed.settings);
          alert("Resume profile loaded successfully!");
        } else {
          alert("Invalid resume backup JSON structure. Must contain settings and resumeData keys.");
        }
      } catch (err) {
        alert("Failed to parse file. Ensure it is a valid JSON backup file of your profile.");
      }
    };
    reader.readAsText(file);
  };

  // Textbox JSON import
  const handleTextboxImport = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (parsed.resumeData && parsed.settings) {
        setResumeData(parsed.resumeData);
        setSettings(parsed.settings);
        setImportSuccess(true);
        setImportError("");
        setTimeout(() => {
          setShowImportModal(false);
          setImportSuccess(false);
          setImportJsonText("");
        }, 1500);
      } else if (parsed.personalInfo && parsed.education && parsed.experience) {
        // Direct resumeData structure without wrapper
        setResumeData(parsed);
        setImportSuccess(true);
        setImportError("");
        setTimeout(() => {
          setShowImportModal(false);
          setImportSuccess(false);
          setImportJsonText("");
        }, 1500);
      } else {
        setImportError("Format mismatch: JSON profile must include personalInfo, education, experience, and projects keys.");
      }
    } catch (e: any) {
      setImportError(`JSON syntax error: ${e.message}`);
    }
  };

  // Simple Accordion toggle
  const toggleSection = (sectionName: string) => {
    setActiveSection(activeSection === sectionName ? "" : sectionName);
  };

  // Estimate physical heights and spacing of A4 page inside the browser simulation
  // Standard A4 is 297mm high.
  // In the simulator we represent standard cm padding.
  const previewPageStyle = {
    paddingLeft: `${settings.leftRightMargin}cm`,
    paddingRight: `${settings.leftRightMargin}cm`,
    paddingTop: `${settings.topBottomMargin}cm`,
    paddingBottom: `${settings.topBottomMargin}cm`,
    fontSize: settings.fontSize === "10pt" ? "14.5px" : settings.fontSize === "11pt" ? "16px" : "18px",
    lineHeight: settings.fitToSinglePage ? "1.3" : "1.45"
  };

  const previewFontClass = settings.fontFamily === "cmr" 
    ? "font-serif tracking-normal" 
    : settings.fontFamily === "eb-garamond" 
      ? "font-serif" 
      : settings.fontFamily === "serif"
        ? "font-lora tracking-tight"
        : "font-sans antialiased";

  if (showLanding) {
    return (
      <LandingPage 
        clerkError={clerkError} 
        setClerkError={clerkError => {
          setClerkError(clerkError);
        }} 
        isVerifying={isVerifying} 
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen md:h-screen bg-[#07080B] text-zinc-200 font-sans md:overflow-hidden overflow-y-auto">
      
      {/* HEADER SECTION */}
      <header className="flex flex-wrap items-center justify-between px-6 py-4 bg-[#0B0C10] border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-none bg-yellow-500/10 font-mono font-bold text-yellow-500 text-sm tracking-widest border border-yellow-500/35 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
            <span>{"L"}</span>
            <span className="text-[10px] transform translate-y-1 -translate-x-0.5">{"T"}</span>
            <span>{"X"}</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-2 font-mono">
              LaTeX Resume Generator
              <span className="text-[9px] font-bold font-mono bg-zinc-900 text-yellow-500 border border-zinc-800 px-2 py-0.5 rounded-none uppercase tracking-wider">
                Satya Template
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5 max-sm:flex-col max-sm:items-start">
              <p className="text-[10px] font-mono text-zinc-400 hidden sm:block tracking-wide uppercase">Automate professional academic resumes with typographic symmetry</p>
              
              {/* MongoDB Cloud Save status indicators */}
              {user && (
                <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider border border-zinc-800/80 bg-zinc-950 px-2 py-0.5 rounded-none text-zinc-400">
                  {cloudSaveStatus === "saving" && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                      Saving...
                    </>
                  )}
                  {cloudSaveStatus === "synced" && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Cloud Synced
                    </>
                  )}
                  {cloudSaveStatus === "unsaved" && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/80 animate-pulse" />
                      Unsaved Changes
                    </>
                  )}
                  {cloudSaveStatus === "error" && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Sync Error
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-wrap">
          {user && (
            <button
              onClick={handleCloudSave}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold rounded-none transition cursor-pointer ${
                cloudSaveStatus === "unsaved"
                  ? "bg-yellow-500 hover:bg-yellow-450 text-black border border-yellow-600 shadow-[0_0_8px_rgba(234,179,8,0.1)]"
                  : "bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-805"
              }`}
              title="Save your progress to MongoDB database (Ctrl + S)"
              disabled={cloudSaveStatus === "saving"}
            >
              <Save className={`w-3.5 h-3.5 ${cloudSaveStatus === "unsaved" ? "text-neutral-900 animate-bounce" : "text-yellow-500"}`} />
              {cloudSaveStatus === "saving" ? "Saving..." : cloudSaveStatus === "unsaved" ? "Save (Ctrl+S)" : "Saved to Cloud"}
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-medium rounded-none bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 transition"
            title="Reset form back to default Satya template data"
          >
            <RefreshCw className="w-3 h-3 text-yellow-500" />
            Reset Data
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-medium rounded-none bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 transition"
            title="Import or load exported resume backup"
          >
            <Upload className="w-3 h-3 text-yellow-500" />
            Import / Backups
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-medium rounded-none bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 transition"
            title="Download JSON backup file to load again later"
          >
            <FileDown className="w-3 h-3 text-yellow-500" />
            Export Config
          </button>

          <button
            onClick={handleDownloadTex}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-mono font-bold rounded-none bg-yellow-500 hover:bg-yellow-450 text-black border border-yellow-600 transition"
            title="Download compilation-ready LaTeX source .tex file"
          >
            <Download className="w-3.5 h-3.5" />
            Download .tex
          </button>

          <button
            onClick={handleOpenInOverleaf}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-mono font-bold rounded-none bg-[#0F5C3B] hover:bg-[#147D50] text-emerald-100 border border-emerald-800 transition"
            title="Open and compile your LaTeX code on Overleaf in one click"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
            Open in Overleaf
          </button>

          {/* User profile capsule and logout button */}
          {user && (
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-zinc-800 shrink-0">
              <img
                src={user.picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`}
                alt={user.name}
                className="w-6 h-6 rounded-none border border-zinc-750"
                referrerPolicy="no-referrer"
              />
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[10px] font-mono font-extrabold text-zinc-200 truncate max-w-[110px]" title={user.name}>
                  {user.name}
                </span>
                <span className="text-[8px] font-mono text-zinc-550 truncate max-w-[110px]" title={user.email}>
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase rounded-none bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition cursor-pointer"
                title="Sign out of current workspace"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden overflow-visible">
        
        {/* LEFT COLUMN: SCROLLABLE FORM CONTROLLER */}
        <section className="w-full md:w-[45%] flex flex-col h-auto md:h-full bg-[#0D0E12] border-b md:border-b-0 md:border-r border-zinc-800 overflow-visible md:overflow-hidden">
          
          {/* SECTION HEADER BAR */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#0B0C10] border-b border-zinc-800 shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E5A93C]">Form Fields & Parameters</span>
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-yellow-500 bg-yellow-500/5 border border-yellow-500/20 px-2.5 py-1 rounded-none">
              <Info className="w-3 h-3 text-yellow-500" />
              <span>Fill detail cards below to sync template</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* AI ATS SCORER & OPTIMIZER HUB */}
            <div className="rounded-none border-2 border-yellow-500/20 bg-[#151620] overflow-hidden shadow-[0_0_15px_rgba(234,179,8,0.03)]">
              <button 
                onClick={() => toggleSection("ai-ats")}
                className="w-full flex items-center justify-between p-4 bg-zinc-950/65 hover:bg-zinc-950 transition-colors text-left font-mono font-bold text-xs uppercase tracking-wider text-zinc-100"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                  <span className="flex items-center gap-1.5">
                    AI ATS Scorer & Optimizer
                    <span className="text-[8px] font-bold py-0.5 px-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-none h-fit">
                      Interactive
                    </span>
                  </span>
                </div>
                {activeSection === "ai-ats" ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              <AnimatePresence initial={false}>
                {activeSection === "ai-ats" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-zinc-805"
                  >
                    <div className="p-4 space-y-4 font-mono text-xs">
                      
                      {/* UNDO / REDO HISTORY CONTROLS */}
                      <div className="flex items-center justify-between bg-zinc-900/60 p-2 text-[10px] border border-zinc-800/80">
                        <div className="flex items-center gap-1 text-zinc-400">
                          <span>Version Tracker:</span>
                          <span className="text-yellow-500 font-bold">#{historyIndex} edits</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleUndo}
                            disabled={historyIndex === 0}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-zinc-950 hover:bg-zinc-900 text-zinc-350 border border-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-950 transition text-[9px] cursor-pointer"
                            title="Undo last modification"
                          >
                            <Undo className="w-3 h-3 text-yellow-500" />
                            Undo
                          </button>
                          <button
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-zinc-950 hover:bg-zinc-900 text-zinc-350 border border-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-950 transition text-[9px] cursor-pointer"
                            title="Redo next modification"
                          >
                            <Redo className="w-3 h-3 text-yellow-500" />
                            Redo
                          </button>
                        </div>
                      </div>

                      {/* JOB DESCRIPTION INPUT AREA */}
                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-400 uppercase">
                          Target Job Description (JD)
                        </label>
                        <p className="text-[10px] text-zinc-550 leading-relaxed font-sans mb-1">Paste your target job’s text below. AI will score your current resume and automatically scan your Standby Sourcing Vault to suggest metric-driven tailoring.</p>
                        <textarea
                          rows={4}
                          value={jd}
                          onChange={(e) => setJd(e.target.value)}
                          className="w-full text-xs font-mono bg-black rounded-none p-2.5 border border-zinc-800 focus:border-yellow-500 focus:outline-none text-white placeholder-zinc-700 font-sans"
                          placeholder="Paste the Job Description (requirements, tech stacks, keywords) here..."
                        />
                      </div>

                      {/* ACTION BUTTON */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={evaluateResume}
                          disabled={isEvaluating}
                          className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold font-mono tracking-wider text-black bg-yellow-500 hover:bg-yellow-450 border border-yellow-600 rounded-none disabled:opacity-50 transition cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          {isEvaluating ? "Analyzing with Gemini..." : "Evaluate & Tailor Resume"}
                        </button>
                      </div>

                      {evalError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-sans rounded-none leading-relaxed">
                          {evalError}
                        </div>
                      )}

                      {/* SCORING OUTPUT */}
                      {evaluationResult && (
                        <div className="space-y-4 pt-2 border-t border-zinc-800/80">
                          
                          {/* VISUAL SCORE TICKER */}
                          <div className="flex items-center gap-3 bg-zinc-950/70 p-3 border border-zinc-800">
                            <div className={`p-4 font-mono font-black text-2xl border text-center flex flex-col justify-center min-w-[75px] h-[75px] rounded-none shadow-sm ${
                              evaluationResult.score >= 75
                                ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/5 animate-pulse"
                                : evaluationResult.score >= 50
                                  ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/40"
                                  : "text-red-500 bg-red-500/10 border-red-500/40"
                            }`}>
                              <span>{evaluationResult.score}</span>
                              <span className="text-[8px] uppercase tracking-widest text-[#E5A93C] font-semibold leading-none mt-1">ATS MATCH</span>
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-[11px] font-bold text-zinc-150 uppercase tracking-wider">AI ATS Scoring Verdict</h4>
                              <p className="text-[10px] text-zinc-400 leading-relaxed font-sans break-words whitespace-pre-wrap">{evaluationResult.summary}</p>
                            </div>
                          </div>

                          {/* MISSING SKILLS & KEYWORDS CHIPS */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-zinc-950/30 p-2.5 border border-zinc-850/85">
                              <span className="block text-[9px] font-bold uppercase text-red-400 tracking-wider mb-1.5 flex items-center gap-1.5 font-sans">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                Missing Core Skills
                              </span>
                              {evaluationResult.missingSkills.length === 0 ? (
                                <p className="text-[10px] text-emerald-400 font-mono">No crucial gaps found!</p>
                              ) : (
                                <div className="flex flex-wrap gap-1 font-mono">
                                  {evaluationResult.missingSkills.map((s, idx) => (
                                    <span key={idx} className="text-[9.5px] px-1.5 py-0.5 bg-red-500/5 border border-red-500/20 text-red-400 rounded-none leading-tight">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="bg-zinc-950/30 p-2.5 border border-zinc-850/85">
                              <span className="block text-[9px] font-bold uppercase text-yellow-500 tracking-wider mb-1.5 flex items-center gap-1.5 font-sans">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                Missing Keywords
                              </span>
                              {evaluationResult.missingKeywords.length === 0 ? (
                                <p className="text-[10px] text-emerald-400 font-mono">Fully saturated!</p>
                              ) : (
                                <div className="flex flex-wrap gap-1 font-mono">
                                  {evaluationResult.missingKeywords.map((k, idx) => (
                                    <span key={idx} className="text-[9.5px] px-1.5 py-0.5 bg-yellow-500/5 border border-yellow-500/20 text-yellow-500 rounded-none leading-tight">
                                      {k}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* SUGGESTED TAILORINGS LIST */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="block text-[9px] font-bold uppercase text-zinc-400 tracking-widest">
                                AI Spliced Enhancements ({evaluationResult.suggestedModifications.filter(m => !m.applied).length} Sinks Ready)
                              </span>
                              {evaluationResult.suggestedModifications.some(m => !m.applied) && (
                                <button
                                  onClick={applyAllAiModifications}
                                  className="text-[9px] font-bold bg-yellow-500/10 border border-yellow-500/35 hover:bg-yellow-500 text-yellow-500 hover:text-black py-0.5 px-2 transition font-mono hover:border-yellow-600 rounded-none cursor-pointer"
                                >
                                  Apply All
                                </button>
                              )}
                            </div>

                            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                              {evaluationResult.suggestedModifications.map((mod, idx) => (
                                <div key={idx} className={`p-3 bg-[#111218] border rounded-none transition-all ${
                                  mod.applied ? "border-emerald-500/30 bg-emerald-500/5 opacity-80" : "border-zinc-800 hover:border-zinc-700"
                                }`}>
                                  <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <div>
                                      <span className="text-[8px] font-bold px-1.5 py-0.2 bg-zinc-900 border border-zinc-805 text-yellow-500 uppercase rounded-none tracking-widest font-mono">
                                        {mod.section}
                                      </span>
                                      <span className="text-[10px] text-zinc-300 ml-1.5 font-bold capitalize">
                                        {mod.action.replace("_", " ")}
                                      </span>
                                    </div>
                                    <span className="text-[8px] font-mono text-zinc-500">
                                      {mod.archiveItemSource}
                                    </span>
                                  </div>

                                  <p className="text-[10.5px] text-zinc-400 leading-relaxed mb-2.5 font-sans italic border-l border-yellow-500/50 pl-2 break-words whitespace-pre-wrap">
                                    {mod.explanation}
                                  </p>

                                  {/* CONTENT CHANGE PREVIEW */}
                                  <div className="space-y-1.5 mb-3 font-mono text-[9px] leading-relaxed">
                                    {mod.originalContent && (
                                      <div className="p-1 px-2 bg-red-500/5 border border-red-500/15 text-zinc-400 rounded-none line-through break-all whitespace-pre-wrap">
                                        <span className="text-[8px] font-bold text-red-500/80 mr-1.5 font-sans">ACTIVE STATE:</span>
                                        {mod.originalContent}
                                      </div>
                                    )}
                                    <div className="p-1.5 px-2 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 rounded-none font-bold break-all whitespace-pre-wrap">
                                      <span className="text-[8px] font-bold text-emerald-500 mr-1.5 font-sans">AI TAILORED (METRIC OPTIMIZED):</span>
                                      {mod.suggestedContent}
                                    </div>
                                  </div>

                                  {/* APPLY BUTTON */}
                                  <button
                                    onClick={() => applyAiModification(idx)}
                                    disabled={mod.applied}
                                    className={`w-full py-1 text-[10px] font-bold tracking-wider rounded-none transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                      mod.applied
                                        ? "bg-emerald-500/25 text-emerald-400 border border-emerald-500/35 font-mono"
                                        : "bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800"
                                    }`}
                                  >
                                    {mod.applied ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        Injected Successfully
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
                                        Apply Splicing Suggestion
                                      </>
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* COMPREHENSIVE EXPERIENCING VAULT */}
            <div className="rounded-none border border-zinc-805 bg-[#121319] overflow-hidden">
              <button 
                onClick={() => toggleSection("career-vault")}
                className="w-full flex items-center justify-between p-4 bg-zinc-950/40 hover:bg-zinc-950/80 transition-colors text-left font-mono font-bold text-xs uppercase tracking-wider text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-yellow-500" />
                  <span className="flex items-center gap-1.5">
                    Standby Sourcing Vault
                    <span className="text-[8.5px] py-0.2 px-1.5 leading-none font-sans font-bold bg-zinc-905 text-zinc-400 border border-zinc-800">
                      {resumeData.careerVault?.length || 0} Assets
                    </span>
                  </span>
                </div>
                {activeSection === "career-vault" ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              <AnimatePresence initial={false}>
                {activeSection === "career-vault" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-zinc-850"
                  >
                    <div className="p-4 bg-zinc-950/10 space-y-4 font-mono">
                      
                      <div className="flex items-center justify-between">
                        <span className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase">
                          Vault Extras Standby Inventory
                        </span>
                        <button
                          onClick={() => setShowAddVaultForm(!showAddVaultForm)}
                          className="flex items-center gap-1 text-[9px] font-bold text-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/15 px-2 py-1 border border-yellow-500/30 transition rounded-none cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          {showAddVaultForm ? "Hide Form" : "Add Sourced Asset"}
                        </button>
                      </div>

                      {/* ADD VAULT ITEM SUB-FORM */}
                      {showAddVaultForm && (
                        <div className="p-3 bg-zinc-950/60 border border-zinc-800 space-y-3 rounded-none">
                          <h4 className="text-[10px] font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-yellow-500" /> Register Standby Sourcing Asset
                          </h4>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Asset Type</label>
                              <select 
                                value={newVaultItem.type}
                                onChange={(e: any) => setNewVaultItem(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full text-[10px] bg-black rounded-none p-1 border border-zinc-800 focus:outline-none focus:border-yellow-500 text-white"
                              >
                                <option value="project">Project Standby</option>
                                <option value="experience">Experience Standby</option>
                                <option value="certification">Certification</option>
                                <option value="skill">Tech Sourced Skill</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Title / Subject</label>
                              <input 
                                type="text"
                                placeholder="e.g. ScaleStore Microservices"
                                value={newVaultItem.title}
                                onChange={(e) => setNewVaultItem(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full text-[10px] bg-black rounded-none p-1 border border-zinc-800 text-white focus:outline-none focus:border-yellow-500 font-sans"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Institution / Company</label>
                              <input 
                                type="text"
                                placeholder="e.g. Upwork Freelancing"
                                value={newVaultItem.subtitle}
                                onChange={(e) => setNewVaultItem(prev => ({ ...prev, subtitle: e.target.value }))}
                                className="w-full text-[10px] bg-black rounded-none p-1 border border-zinc-800 text-white focus:outline-none focus:border-yellow-500 font-sans"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Dates (Sourcing)</label>
                              <input 
                                type="text"
                                placeholder="e.g. Jan 2024 - Present"
                                value={newVaultItem.dates}
                                onChange={(e) => setNewVaultItem(prev => ({ ...prev, dates: e.target.value }))}
                                className="w-full text-[10px] bg-black rounded-none p-1 border border-zinc-800 text-white focus:outline-none focus:border-yellow-500 font-sans"
                              />
                            </div>
                          </div>

                          {newVaultItem.type === "project" && (
                            <div>
                              <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Technologies Sourced</label>
                              <input 
                                type="text"
                                placeholder="e.g. Node.js, NestJS, Go, Kafka"
                                value={newVaultItem.technologies}
                                onChange={(e) => setNewVaultItem(prev => ({ ...prev, technologies: e.target.value }))}
                                className="w-full text-[10px] bg-black rounded-none p-1 border border-zinc-800 text-white focus:outline-none focus:border-yellow-500 font-sans"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-[8px] text-zinc-500 uppercase mb-0.5">Standby Achievement Bullets</label>
                            <textarea 
                              rows={2}
                              value={newVaultItem.description}
                              onChange={(e) => setNewVaultItem(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Describe standout accomplishments, frameworks, or syllabus items..."
                              className="w-full text-[10px] bg-black rounded-none p-1 border border-zinc-805 text-white focus:outline-none focus:border-yellow-500 font-sans"
                            />
                          </div>

                          <button
                            onClick={handleAddVaultItem}
                            className="w-full py-1.5 text-[10px] font-bold text-black bg-yellow-500 hover:bg-yellow-450 rounded-none transition cursor-pointer"
                          >
                            Save Asset Standby
                          </button>
                        </div>
                      )}

                      {/* FILTER PICKER */}
                      <div className="flex gap-1 overflow-x-auto pb-1 text-[8px]">
                        {(["all", "project", "experience", "skill", "certification"] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setVaultFilter(f)}
                            className={`px-2 py-0.5 uppercase border hover:border-zinc-700 transition cursor-pointer ${
                              vaultFilter === f 
                                ? "bg-yellow-500/10 border-yellow-500 text-yellow-500"
                                : "bg-black border-zinc-850 text-zinc-400"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>

                      {/* LIST OF CURRENT VAULT ENTRIES */}
                      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                        {(resumeData.careerVault || [])
                          .filter(item => vaultFilter === "all" || item.type === vaultFilter)
                          .map((item) => (
                            <div key={item.id} className="p-2.5 bg-zinc-950/50 border border-zinc-855 hover:border-zinc-800 text-[10px] relative">
                              <button
                                onClick={() => handleDeleteVaultItem(item.id)}
                                className="absolute right-2 top-2 p-1 text-zinc-500 hover:text-red-400 font-sans transition cursor-pointer"
                                title="Delete vault asset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              
                              <div className="flex items-center gap-1.5 mb-1 text-zinc-350 font-sans">
                                <span className="text-[8px] py-0.2 px-1 border border-zinc-800 bg-zinc-900 text-yellow-500 font-mono">
                                  {item.type}
                                </span>
                                <h5 className="font-bold pr-5 truncate leading-tight">{item.title}</h5>
                              </div>

                              {item.subtitle && (
                                <p className="text-[9px] text-zinc-500 truncate mb-1 font-sans">
                                  {item.subtitle} {item.dates && `| ${item.dates}`}
                                </p>
                              )}

                              <p className="text-[9px] text-zinc-400 leading-relaxed font-sans pr-4">{item.description}</p>
                              {item.technologies && (
                                <p className="text-[8px] text-yellow-500/80 truncate mt-1">Techs: {item.technologies}</p>
                              )}
                            </div>
                        ))}
                        {(resumeData.careerVault || []).filter(item => vaultFilter === "all" || item.type === vaultFilter).length === 0 && (
                          <p className="text-center text-zinc-600 text-[10px] py-4">No standalone sourcing items in this filter category.</p>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 1. PERSONAL DETAILS ACCORDION */}
            <div className="rounded-none border border-zinc-800 bg-[#121319] overflow-hidden">
              <button 
                onClick={() => toggleSection("personal")}
                className="w-full flex items-center justify-between p-4 bg-zinc-950/40 hover:bg-zinc-950/80 transition-colors text-left font-mono font-bold text-xs uppercase tracking-wider text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-yellow-500" />
                  <span>Personal Header</span>
                </div>
                {activeSection === "personal" ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              <AnimatePresence initial={false}>
                {activeSection === "personal" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-zinc-850"
                  >
                    <div className="p-4 bg-zinc-950/20 space-y-3">
                      <div>
                        <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-1">Full Name</label>
                        <input 
                          type="text" 
                          value={resumeData.personalInfo.name} 
                          onChange={(e) => handlePersonalChange("name", e.target.value)}
                          className="w-full text-xs font-mono bg-black rounded-none px-3 py-2 border border-zinc-800 focus:border-yellow-500 focus:outline-none transition-colors text-white"
                          placeholder="e.g. SATYA SURANJEET JENA"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-1">Course / Major Title</label>
                        <input 
                          type="text" 
                          value={resumeData.personalInfo.course} 
                          onChange={(e) => handlePersonalChange("course", e.target.value)}
                          className="w-full text-xs font-mono bg-black rounded-none px-3 py-2 border border-zinc-800 focus:border-yellow-500 focus:outline-none transition-colors text-white"
                          placeholder="e.g. Computer Science and Engineering"
                        />
                        <span className="text-[9px] font-mono text-zinc-500 italic mt-0.5 block">Stored in LaTeX macro but not shown in header by default</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-1">Phone Number</label>
                          <input 
                            type="text" 
                            value={resumeData.personalInfo.phone} 
                            onChange={(e) => handlePersonalChange("phone", e.target.value)}
                            className="w-full text-xs font-mono bg-black rounded-none px-3 py-2 border border-zinc-800 focus:border-yellow-500 focus:outline-none transition-colors text-white"
                            placeholder="e.g. +91 84580 76100"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-1">Email ID</label>
                          <input 
                            type="email" 
                            value={resumeData.personalInfo.email} 
                            onChange={(e) => handlePersonalChange("email", e.target.value)}
                            className="w-full text-xs font-mono bg-black rounded-none px-3 py-2 border border-zinc-800 focus:border-yellow-500 focus:outline-none transition-colors text-white"
                            placeholder="e.g. satyajena911@gmail.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-1">GitHub Account Name</label>
                          <input 
                            type="text" 
                            value={resumeData.personalInfo.github} 
                            onChange={(e) => handlePersonalChange("github", e.target.value)}
                            className="w-full text-xs font-mono bg-black rounded-none px-3 py-2 border border-zinc-800 focus:border-yellow-500 focus:outline-none transition-colors text-white"
                            placeholder="github.com/Satyasuranjeet"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-1">LinkedIn URL Handle</label>
                          <input 
                            type="text" 
                            value={resumeData.personalInfo.linkedin} 
                            onChange={(e) => handlePersonalChange("linkedin", e.target.value)}
                            className="w-full text-xs font-mono bg-black rounded-none px-3 py-2 border border-zinc-800 focus:border-yellow-500 focus:outline-none transition-colors text-white"
                            placeholder="linkedin.com/in/satya-..."
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. EDUCATION SECTION */}
            <div className="rounded-none border border-zinc-800 bg-[#121319] overflow-hidden">
              <button 
                onClick={() => toggleSection("education")}
                className="w-full flex items-center justify-between p-4 bg-zinc-950/40 hover:bg-zinc-950/80 transition-colors text-left font-mono font-bold text-xs uppercase tracking-wider text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-yellow-500" />
                  <span>Education History</span>
                </div>
                {activeSection === "education" ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              <AnimatePresence initial={false}>
                {activeSection === "education" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-zinc-850"
                  >
                    <div className="p-4 bg-zinc-950/10 space-y-4">
                      {resumeData.education.map((edu, idx) => (
                        <div key={edu.id} className="p-3.5 bg-zinc-950/60 rounded-none border border-zinc-850 relative space-y-2.5">
                          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-500">Institution Entry #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => moveEducation(idx, "up")}
                                disabled={idx === 0}
                                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded-none hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
                                title="Move Entry Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => moveEducation(idx, "down")}
                                disabled={idx === resumeData.education.length - 1}
                                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded-none hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
                                title="Move Entry Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => deleteEducation(edu.id)}
                                className="p-1 text-rose-450 hover:text-rose-400 hover:bg-rose-950/20 rounded-none transition ml-1"
                                title="Delete Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5">
                            <div>
                              <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-0.5">Degree / Certification Title</label>
                              <input 
                                type="text"
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                                className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-white"
                                placeholder="Degree Title"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-0.5">University / School Name</label>
                              <input 
                                type="text"
                                value={edu.institution}
                                onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                                className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-white"
                                placeholder="University Name"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-0.5">CGPA or Grade</label>
                                <input 
                                  type="text"
                                  value={edu.score}
                                  onChange={(e) => updateEducation(edu.id, "score", e.target.value)}
                                  className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-white"
                                  placeholder="CGPA: 9.25"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-0.5 font-mono">Session Dates</label>
                                <input 
                                  type="text"
                                  value={edu.dates}
                                  onChange={(e) => updateEducation(edu.id, "dates", e.target.value)}
                                  className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-white"
                                  placeholder="e.g. 2021-25"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button 
                        onClick={addEducation}
                        className="w-full py-2 border border-dashed border-zinc-800 hover:border-yellow-500 text-zinc-400 hover:text-yellow-500 text-xs font-mono font-bold rounded-none bg-zinc-950/40 hover:bg-zinc-950 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Add Education Row
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. EXPERIENCE SECTION */}
            <div className="rounded-none border border-zinc-800 bg-[#121319] overflow-hidden">
              <button 
                onClick={() => toggleSection("experience")}
                className="w-full flex items-center justify-between p-4 bg-zinc-950/40 hover:bg-zinc-950/80 transition-colors text-left font-mono font-bold text-xs uppercase tracking-wider text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-yellow-500" />
                  <span>Work & Internships</span>
                </div>
                {activeSection === "experience" ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              <AnimatePresence initial={false}>
                {activeSection === "experience" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-zinc-850"
                  >
                    <div className="p-4 bg-zinc-950/10 space-y-4 font-mono">
                      {resumeData.experience.map((exp, idx) => (
                        <div key={exp.id} className="p-3.5 bg-zinc-950/60 rounded-none border border-zinc-850 relative space-y-3">
                          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-c850">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-500">Experience #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => moveExperience(idx, "up")}
                                disabled={idx === 0}
                                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded-none hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => moveExperience(idx, "down")}
                                disabled={idx === resumeData.experience.length - 1}
                                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded-none hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => deleteExperience(exp.id)}
                                className="p-1 text-rose-450 hover:text-rose-400 hover:bg-rose-950/20 rounded-none transition ml-1"
                                title="Delete Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-0.5">Role / Position</label>
                              <input 
                                type="text"
                                value={exp.role}
                                onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                                className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-white"
                                placeholder="Specialist Programmer"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-0.5">Company Name</label>
                              <input 
                                type="text"
                                value={exp.company}
                                onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                                className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-white"
                                placeholder="Infosys"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-0.5">Location Type</label>
                              <input 
                                type="text"
                                value={exp.locationType}
                                onChange={(e) => updateExperience(exp.id, "locationType", e.target.value)}
                                className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-white"
                                placeholder="On-site / Hybrid"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-0.5">Employment Type / Date range</label>
                              <input 
                                type="text"
                                value={exp.dates}
                                onChange={(e) => updateExperience(exp.id, "dates", e.target.value)}
                                className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-white"
                                placeholder="October 2025 - Present"
                              />
                            </div>
                          </div>

                          {/* Bullets Sub-section */}
                          <div className="space-y-1.5 pt-1.5 border-t border-zinc-850">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono tracking-wider text-zinc-400 uppercase">Achievements & Contributions</span>
                              <button 
                                onClick={() => addExperienceBullet(exp.id)}
                                className="text-[9px] font-mono bg-zinc-900 hover:bg-zinc-800 text-yellow-500 hover:text-yellow-450 px-2 py-0.5 rounded-none transition border border-zinc-800"
                              >
                                <Plus className="w-2.5 h-2.5" /> Add bullet
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              {exp.bullets.map((b, bIdx) => (
                                <div key={bIdx} className="flex gap-2 items-start group">
                                  <span className="text-zinc-600 text-xs mt-2">•</span>
                                  <textarea
                                    value={b}
                                    onChange={(e) => updateExperienceBullet(exp.id, bIdx, e.target.value)}
                                    rows={2}
                                    className="flex-1 text-xs font-mono bg-black rounded-none px-2 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-zinc-200"
                                    placeholder="Describe your achievement..."
                                  />
                                  <button
                                    onClick={() => deleteExperienceBullet(exp.id, bIdx)}
                                    className="p-1 text-rose-500 hover:text-rose-450 hover:bg-rose-950/20 rounded-none mt-1.5 opacity-40 group-hover:opacity-100 transition"
                                    title="Delete Bullet"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      ))}

                      <button 
                        onClick={addExperience}
                        className="w-full py-2 border border-dashed border-zinc-800 hover:border-yellow-500 text-zinc-400 hover:text-yellow-500 text-xs font-mono font-bold rounded-none bg-zinc-950/40 hover:bg-zinc-950 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Add Experience Item
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
 
            {/* 4. PROJECTS SECTION */}
            <div className="rounded-none border border-zinc-800 bg-[#121319] overflow-hidden">
              <button 
                onClick={() => toggleSection("projects")}
                className="w-full flex items-center justify-between p-4 bg-zinc-950/40 hover:bg-zinc-950/80 transition-colors text-left font-mono font-bold text-xs uppercase tracking-wider text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-yellow-500" />
                  <span>Projects and Research</span>
                </div>
                {activeSection === "projects" ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              <AnimatePresence initial={false}>
                {activeSection === "projects" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-zinc-850"
                  >
                    <div className="p-4 bg-zinc-950/10 space-y-4 font-mono">
                      {resumeData.projects.map((proj, idx) => (
                        <div key={proj.id} className="p-3.5 bg-zinc-950/60 rounded-none border border-zinc-850 relative space-y-3">
                          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-500">Project #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => moveProject(idx, "up")}
                                disabled={idx === 0}
                                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded-none hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => moveProject(idx, "down")}
                                disabled={idx === resumeData.projects.length - 1}
                                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded-none hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => deleteProject(proj.id)}
                                className="p-1 text-rose-450 hover:text-rose-400 hover:bg-rose-950/20 rounded-none transition ml-1"
                                title="Delete Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-0.5">Project Title</label>
                              <input 
                                type="text"
                                value={proj.title}
                                onChange={(e) => updateProject(proj.id, "title", e.target.value)}
                                className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-white"
                                placeholder="Arka AI -- Collaborative Architecture Workspace"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-0.5">Project Link (Embedded in Title)</label>
                              <input 
                                type="text"
                                value={proj.link || ""}
                                onChange={(e) => updateProject(proj.id, "link", e.target.value)}
                                className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-white"
                                placeholder="github.com/Satyasuranjeet/Arka"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-0.5">Technologies Used (Stack)</label>
                              <input 
                                type="text"
                                value={proj.technologies}
                                onChange={(e) => updateProject(proj.id, "technologies", e.target.value)}
                                className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-white"
                                placeholder="React 19, Vite, Tailwind, Groq..."
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-0.5">Dates / Duration (Optional)</label>
                              <input 
                                type="text"
                                value={proj.dates}
                                onChange={(e) => updateProject(proj.id, "dates", e.target.value)}
                                className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-white"
                                placeholder="May 2024 - Present"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-0.5">Short tagline description</label>
                              <input 
                                type="text"
                                value={proj.description}
                                onChange={(e) => updateProject(proj.id, "description", e.target.value)}
                                className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-white"
                                placeholder="Unified realtime platform replacing disconnected tools..."
                              />
                            </div>
                          </div>

                          {/* Project Bullets */}
                          <div className="space-y-1.5 pt-1.5 border-t border-zinc-850">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono tracking-wider text-zinc-400 uppercase">Project Key Bullet Points</span>
                              <button 
                                onClick={() => addProjectBullet(proj.id)}
                                className="text-[9px] font-mono bg-zinc-900 hover:bg-zinc-800 text-yellow-500 hover:text-yellow-450 px-2 py-0.5 rounded-none transition border border-zinc-800"
                              >
                                <Plus className="w-2.5 h-2.5" /> Add bullet
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              {proj.bullets.map((b, bIdx) => (
                                <div key={bIdx} className="flex gap-2 items-start group">
                                  <span className="text-zinc-650 text-xs mt-2">•</span>
                                  <textarea
                                    value={b}
                                    onChange={(e) => updateProjectBullet(proj.id, bIdx, e.target.value)}
                                    rows={2}
                                    className="flex-1 text-xs font-mono bg-black rounded-none px-2 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors text-zinc-200"
                                    placeholder="Describe feature details, impact..."
                                  />
                                  <button
                                    onClick={() => deleteProjectBullet(proj.id, bIdx)}
                                    className="p-1 text-rose-500 hover:text-rose-450 hover:bg-rose-950/20 rounded-none mt-1.5 opacity-40 group-hover:opacity-100 transition"
                                    title="Delete Bullet"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      ))}

                      <button 
                        onClick={addProject}
                        className="w-full py-2 border border-dashed border-zinc-800 hover:border-yellow-500 text-zinc-400 hover:text-yellow-500 text-xs font-mono font-bold rounded-none bg-zinc-950/40 hover:bg-zinc-950 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Add Project Item
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5. TECHNICAL SKILLS SECTION */}
            <div className="rounded-none border border-zinc-800 bg-[#121319] overflow-hidden">
              <button 
                onClick={() => toggleSection("skills")}
                className="w-full flex items-center justify-between p-4 bg-zinc-950/40 hover:bg-zinc-950/80 transition-colors text-left font-mono font-bold text-xs uppercase tracking-wider text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-yellow-500" />
                  <span>Technical Skills</span>
                </div>
                {activeSection === "skills" ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              <AnimatePresence initial={false}>
                {activeSection === "skills" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-zinc-850"
                  >
                    <div className="p-4 bg-zinc-950/10 space-y-4 font-mono">
                      {resumeData.skills.map((skill, idx) => (
                        <div key={skill.id} className="p-3 bg-zinc-950/60 rounded-none border border-zinc-850 relative space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-500">Skill Category #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => moveSkill(idx, "up")}
                                disabled={idx === 0}
                                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded-none hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => moveSkill(idx, "down")}
                                disabled={idx === resumeData.skills.length - 1}
                                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded-none hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => deleteSkillCategory(skill.id)}
                                className="p-1 text-rose-450 hover:text-rose-455 hover:bg-rose-950/20 rounded-none transition ml-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <input 
                                type="text"
                                value={skill.category}
                                onChange={(e) => updateSkill(skill.id, "category", e.target.value)}
                                className="w-full text-xs font-bold font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 text-zinc-300"
                                placeholder="Category Name (e.g. Programming Languages)"
                              />
                            </div>
                            <div>
                              <textarea
                                value={skill.skills}
                                onChange={(e) => updateSkill(skill.id, "skills", e.target.value)}
                                rows={2}
                                className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 text-zinc-200"
                                placeholder="Comma separated items (Item1, Item2, etc.)"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button 
                        onClick={addSkillCategory}
                        className="w-full py-2 border border-dashed border-zinc-800 hover:border-yellow-500 text-zinc-400 hover:text-yellow-500 text-xs font-mono font-bold rounded-none bg-zinc-950/40 hover:bg-zinc-950 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Add Skill Category Row
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 6. PAGE DESIGN SETTINGS ACCORDION */}
            <div className="rounded-none border border-zinc-800 bg-[#121319] overflow-hidden">
              <button 
                onClick={() => toggleSection("settings")}
                className="w-full flex items-center justify-between p-4 bg-zinc-950/40 hover:bg-zinc-950/80 transition-colors text-left font-mono font-bold text-xs uppercase tracking-wider text-zinc-200"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-yellow-500" />
                  <span>Page Setup & Layout Preferences</span>
                </div>
                {activeSection === "settings" ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              <AnimatePresence initial={false}>
                {activeSection === "settings" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-zinc-850"
                  >
                    <div className="p-4 bg-zinc-950/10 space-y-4 font-mono">
                      
                      {/* PAGE FIT TO SINGLE PAGE TOGGLE */}
                      <div className="bg-zinc-950/60 rounded-none p-3 border border-zinc-850">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 font-mono">
                              <Scale className="w-3.5 h-3.5 text-yellow-500" />
                              Fit to Single Page (Auto-Compress)
                            </span>
                            <p className="text-[10px] text-zinc-450 mt-1 font-mono">Smart-compress margins, spacers and lists to force fit exactly onto 1 A4 page</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={settings.fitToSinglePage}
                              onChange={(e) => handleSettingChange("fitToSinglePage", e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-1">Paper Standard</label>
                          <select 
                            value={settings.pageSize}
                            onChange={(e: any) => handleSettingChange("pageSize", e.target.value)}
                            className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 text-white"
                          >
                            <option value="a4paper">A4 Paper Dimensions (210x297mm)</option>
                            <option value="letterpaper">US Letter Standard (8.5x11 inches)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-1">Base Font Scale</label>
                          <select 
                            value={settings.fontSize}
                            onChange={(e: any) => handleSettingChange("fontSize", e.target.value)}
                            className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 text-white"
                          >
                            <option value="10pt">10pt (Tighter academic size)</option>
                            <option value="11pt">11pt (Standard readable size)</option>
                            <option value="12pt">12pt (Generous large text)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-1">Left/Right Margin</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="range"
                              min={0.5}
                              max={2.5}
                              step={0.1}
                              value={settings.leftRightMargin}
                              onChange={(e) => handleSettingChange("leftRightMargin", parseFloat(e.target.value))}
                              className="w-full accent-yellow-500 h-1 bg-zinc-800 rounded-none appearance-none cursor-pointer"
                            />
                            <span className="text-xs font-mono text-zinc-400 shrink-0">{settings.leftRightMargin}cm</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-1">Top/Bottom Margin</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="range"
                              min={0.3}
                              max={2.0}
                              step={0.1}
                              value={settings.topBottomMargin}
                              onChange={(e) => handleSettingChange("topBottomMargin", parseFloat(e.target.value))}
                              className="w-full accent-yellow-500 h-1 bg-zinc-800 rounded-none appearance-none cursor-pointer"
                            />
                            <span className="text-xs font-mono text-zinc-400 shrink-0">{settings.topBottomMargin}cm</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono tracking-widest font-semibold text-zinc-500 uppercase mb-1">Typeface Family Rendering</label>
                        <select 
                          value={settings.fontFamily}
                          onChange={(e: any) => handleSettingChange("fontFamily", e.target.value)}
                          className="w-full text-xs font-mono bg-black rounded-none px-2.5 py-1.5 border border-zinc-800 focus:outline-none focus:border-yellow-500 text-white"
                        >
                          <option value="cmr">Computer Modern Roman (Classic LaTeX serif)</option>
                          <option value="eb-garamond">EB Garamond (Elegant historical serif)</option>
                          <option value="serif">Lora Serif (Cozy screen-optimized reading)</option>
                          <option value="inter">Inter (Modern technical sans-serif)</option>
                        </select>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* RIGHT COLUMN: INTERACTIVE VISUALIZER & CODE DRAWER */}
        <section className="flex-1 flex flex-col bg-[#0B0C10] overflow-visible md:overflow-hidden relative min-h-[650px] md:min-h-0">
          
          {/* TABS SELECTOR & ZOOM PRESETS */}
          <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-zinc-800 bg-[#0B0C10] shrink-0">
            <div className="flex bg-black border border-zinc-850 rounded-none p-0.5">
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-bold uppercase rounded-none transition ${activeTab === "preview" ? "bg-yellow-500 text-black" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"}`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live PDF Simulation
              </button>
              <button
                onClick={() => setActiveTab("latex")}
                className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-bold uppercase rounded-none transition ${activeTab === "latex" ? "bg-yellow-500 text-black" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"}`}
              >
                <FileCode className="w-3.5 h-3.5" />
                Raw LaTeX Source
              </button>
            </div>

            {/* PREVIEW SCALE CONTROLLERS */}
            {activeTab === "preview" && (
              <div className="flex items-center gap-2.5 text-[11px] font-mono text-zinc-400 mt-2 sm:mt-0">
                <span className="hidden sm:inline">Zoom Visualizer: {zoom}%</span>
                <div className="flex items-center gap-1 bg-black border border-zinc-800 rounded-none p-1">
                  <button 
                    onClick={() => setZoom(Math.max(40, zoom - 10))}
                    className="p-1 hover:bg-zinc-900 hover:text-white rounded-none transition text-zinc-400"
                    title="Zoom Out"
                  >
                    <Minimize2 className="w-3 h-3" />
                  </button>
                  <input 
                    type="range"
                    min={40}
                    max={120}
                    value={zoom}
                    onChange={(e) => setZoom(parseInt(e.target.value))}
                    className="w-16 sm:w-24 accent-yellow-500 h-1 bg-zinc-800"
                  />
                  <button 
                    onClick={() => setZoom(Math.min(120, zoom + 10))}
                    className="p-1 hover:bg-zinc-900 hover:text-white rounded-none transition text-zinc-400"
                    title="Zoom In"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "latex" && (
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-bold uppercase rounded-none bg-black border border-zinc-800 hover:bg-zinc-900 text-zinc-200 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy Code"}
                </button>

                <button
                  onClick={handleOpenInOverleaf}
                  className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-bold uppercase rounded-none bg-[#0F5C3B] hover:bg-[#147D50] text-[#D1FAE5] border border-emerald-850 transition"
                  title="Export raw LaTeX code directly to Overleaf for cloud editing"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
                  Open in Overleaf
                </button>
              </div>
            )}
          </div>

          {/* DYNAMIC SCROLLABLE RENDER CHAMBER */}
          <div className="flex-1 overflow-auto bg-slate-950 p-6 flex justify-center items-start">
            
            {activeTab === "preview" ? (
              
              <div 
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
                className="transition-transform duration-100 ease-out flex-shrink-0 mb-20 origin-top"
              >
                {/* Simulated A4 Paper */}
                <div 
                  id="resume-a4-sheet"
                  style={previewPageStyle}
                  className={`a4-page shadow-2xl rounded border border-neutral-300 ${previewFontClass} flex flex-col`}
                >
                  
                  {/* Outer Frame sizing depending on single vs multi page choice */}
                  {/* Standard A4 aspect is 210mm w by 297mm h. If fitToSinglePage is ON we force height: 297mm */}
                  <div className={`w-[210mm] flex flex-col flex-1  ${settings.fitToSinglePage ? "h-[295mm] overflow-hidden justify-between" : "min-h-[295mm] h-auto pb-8"}`}>
                    
                    <div>
                      {/* 1. HEADER PART */}
                      <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-4">
                        <div className="space-y-1">
                          <h2 className="text-3xl font-bold tracking-tight uppercase font-serif text-black">{resumeData.personalInfo.name}</h2>
                          {resumeData.personalInfo.course && (
                            <p className="text-[11px] font-mono font-medium uppercase tracking-wider text-neutral-500">{resumeData.personalInfo.course}</p>
                          )}
                        </div>
                        <div className="text-right text-[11px] text-neutral-600 font-mono space-y-0.5">
                          <p className="font-semibold text-black">Phone: {resumeData.personalInfo.phone}</p>
                          <p className="hover:underline text-indigo-700 font-semibold">{resumeData.personalInfo.email}</p>
                          <p className="hover:underline text-neutral-700">{resumeData.personalInfo.github}</p>
                          <p className="hover:underline text-neutral-700">{resumeData.personalInfo.linkedin}</p>
                        </div>
                      </div>

                      {/* 2. EDUCATION SECTION */}
                      {resumeData.education && resumeData.education.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-sm font-semibold tracking-wide uppercase text-black font-serif">Education</span>
                            <div className="flex-1 h-[1px] bg-black"></div>
                          </div>
                          
                          <div className="space-y-1.5">
                            {resumeData.education.map((edu) => (
                              <div key={edu.id} className="text-[12px] flex flex-col">
                                <div className="flex justify-between items-baseline">
                                  <span className="font-bold text-black">{edu.degree}</span>
                                  <span className="font-mono text-[11px] text-neutral-600">{edu.dates}</span>
                                </div>
                                <div className="flex justify-between items-baseline text-[11px] text-neutral-600">
                                  <span className="italic">{edu.institution}</span>
                                  <span className="font-semibold text-neutral-800">{edu.score}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. EXPERIENCE SECTION */}
                      {resumeData.experience && resumeData.experience.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-sm font-semibold tracking-wide uppercase text-black font-serif">Experience, Training and Internship</span>
                            <div className="flex-1 h-[1px] bg-black"></div>
                          </div>

                          <div className="space-y-2.5">
                            {resumeData.experience.map((exp) => (
                              <div key={exp.id} className="text-[12px]">
                                <div className="flex justify-between items-baseline">
                                  <span className="font-bold text-black">{exp.role}</span>
                                  <span className="font-mono text-[11px] text-neutral-600">{exp.dates}</span>
                                </div>
                                <div className="flex justify-between items-baseline text-[11px] text-neutral-600 mb-0.5">
                                  <span className="italic">{exp.company}</span>
                                  <span className="font-mono">{exp.locationType} • {exp.employmentType}</span>
                                </div>
                                
                                {exp.bullets && exp.bullets.length > 0 && (
                                  <ul className="list-disc pl-4 space-y-0.5 text-neutral-800 font-sans tracking-tight text-[11.5px]">
                                    {exp.bullets.map((b, bIdx) => (
                                      <li key={bIdx} className="leading-snug break-words whitespace-pre-wrap">{b}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. PROJECTS SECTION */}
                      {resumeData.projects && resumeData.projects.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-sm font-semibold tracking-wide uppercase text-black font-serif">Projects</span>
                            <div className="flex-1 h-[1px] bg-black"></div>
                          </div>

                          <div className="space-y-2.5">
                            {resumeData.projects.map((proj) => (
                              <div key={proj.id} className="text-[12px]">
                                <div className="flex justify-between items-baseline">
                                  {proj.link ? (
                                    <a
                                      href={proj.link.match(/^[a-zA-Z]+:\/\//) ? proj.link : `https://${proj.link}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-bold text-black hover:underline cursor-pointer inline-flex items-center gap-0.5"
                                    >
                                      {proj.title}
                                    </a>
                                  ) : (
                                    <span className="font-bold text-black">{proj.title}</span>
                                  )}
                                  <span className="font-mono text-[11px] text-neutral-600">{proj.dates}</span>
                                </div>
                                <p className="text-[11px] text-neutral-600 italic mb-0.5 break-words whitespace-pre-wrap">{proj.description}</p>
                                
                                {proj.technologies && (
                                  <p className="text-[10.5px] font-mono text-indigo-900 mb-1 break-words">
                                    <span className="font-semibold text-neutral-700">Technologies:</span> {proj.technologies}
                                  </p>
                                )}

                                {proj.bullets && proj.bullets.length > 0 && (
                                  <ul className="list-disc pl-4 space-y-0.5 text-neutral-800 font-sans tracking-tight text-[11.5px]">
                                    {proj.bullets.map((b, bIdx) => (
                                      <li key={bIdx} className="leading-snug break-words whitespace-pre-wrap">{b}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 5. TECHNICAL SKILLS SECTION */}
                    {resumeData.skills && resumeData.skills.length > 0 && (
                      <div className="mt-auto">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-sm font-semibold tracking-wide uppercase text-black font-serif">Technical Skills & Core Competencies</span>
                          <div className="flex-1 h-[1px] bg-black"></div>
                        </div>

                        <div className="grid grid-cols-1 gap-[3px] text-[11.5px]">
                          {resumeData.skills.map((s) => (
                            <div key={s.id} className="flex leading-relaxed flex-col sm:flex-row gap-x-1">
                              <span className="font-bold text-black min-w-[150px] shrink-0 break-words">{s.category}:</span>
                              <span className="text-neutral-800 break-words whitespace-pre-wrap flex-1">{s.skills}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                </div>

                {/* SINGLE PAGE HIGHLIGHT WRITER / LIMIT WARNER */}
                {settings.fitToSinglePage && (
                  <div className="mt-2 text-center text-[10px] font-mono uppercase tracking-wider text-zinc-450 bg-black px-3 py-1.5 rounded-none border border-zinc-800 flex items-center justify-center gap-1.5 w-[210mm]">
                    <span className="w-1.5 h-1.5 rounded-none bg-yellow-500"></span>
                    Strict A4 Boundary Active: Any elements past the bottom border will be truncated to fit single-page print specs.
                  </div>
                )}
              </div>

            ) : (
              
              /* RAW SOURCE CODE VIEWER */
              <div className="w-full max-w-4xl h-full flex flex-col bg-black rounded-none border border-zinc-800 overflow-hidden font-mono text-xs">
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-zinc-850 shrink-0 text-zinc-400">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">Generated LaTeX Document (.tex)</span>
                  <span className="text-[9px] font-mono tracking-widest uppercase text-yellow-500 bg-zinc-900 px-2 py-0.5 rounded-none border border-zinc-800">Compile-ready</span>
                </div>
                <div className="flex-1 p-4 overflow-auto text-zinc-300 select-all leading-normal bg-[#07080b] text-xs font-mono">
                  <pre className="whitespace-pre">{latexCode}</pre>
                </div>
              </div>

            )}

          </div>
        </section>

      </div>

      {/* DETAILED DIALOG: IMPORT / BACKUP PANEL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-[#0D0E12] border border-zinc-800 rounded-none shadow-2xl p-6 relative overflow-hidden font-mono"
          >
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider mb-2 font-mono text-yellow-500">Resume Configuration Backup & Imports</h3>
            <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed font-mono">You can back up your current resume edits and load them back here anytime. Upload a previous backup JSON profile or paste the config block directly.</p>
            
            <div className="space-y-4 font-mono">
              
              {/* FILE CHANGER */}
              <div className="p-4 bg-black rounded-none border border-zinc-800">
                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Method 1: Upload JSON File</span>
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".json" 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-mono font-semibold uppercase rounded-none bg-yellow-500 hover:bg-yellow-450 text-black transition shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Select Backup File
                  </button>
                  <span className="text-[10px] text-zinc-500 italic font-mono">Accepts standard resume JSON exports</span>
                </div>
              </div>

              {/* TEXT BOX */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Method 2: Paste Profile code</span>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='Paste your downloaded JSON config block here (e.g. { "resumeData": ... })'
                  rows={6}
                  className="w-full text-xs font-mono bg-black rounded-none p-3 border border-zinc-800 focus:outline-none focus:border-yellow-500 text-zinc-200"
                />
              </div>

              {importError && (
                <p className="text-xs font-semibold text-rose-450 bg-rose-950/20 px-3 py-2 rounded-none border border-rose-900/40">
                  {importError}
                </p>
              )}

              {importSuccess && (
                <p className="text-xs font-semibold text-emerald-450 bg-emerald-950/20 px-3 py-2 rounded-none border border-emerald-900/40 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Successfully imported profile setup! Syncing live views...
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportJsonText("");
                    setImportError("");
                  }}
                  className="px-4 py-2 text-[11px] font-mono font-semibold uppercase bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-none transition border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTextboxImport}
                  disabled={!importJsonText.trim()}
                  className="px-4 py-2 text-[11px] font-mono font-semibold uppercase bg-yellow-500 hover:bg-yellow-450 disabled:opacity-30 disabled:pointer-events-none text-black rounded-none transition border border-yellow-500"
                >
                  Apply Profile Change
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
