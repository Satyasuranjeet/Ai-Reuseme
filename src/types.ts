export interface PersonalInfo {
  name: string;
  course: string;
  phone: string;
  email: string;
  github: string;
  linkedin: string;
  imageUrl: string; 
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  score: string;
  dates: string;
}

export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  locationType: string;
  employmentType: string;
  dates: string;
  bullets: string[];
}

export interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  dates: string;
  technologies: string;
  bullets: string[];
  link?: string;
}

export interface TechnicalSkill {
  id: string;
  category: string;
  skills: string;
}

export interface VaultItem {
  id: string;
  type: "project" | "experience" | "skill" | "certification";
  title: string;
  subtitle?: string; // e.g. Company, Sponsoring Body, Category
  description: string; // Bullet descriptions, body, or list of tech
  technologies?: string; // technologies if project
  dates?: string;
}

export interface PageSettings {
  pageSize: "a4paper" | "letterpaper";
  fontSize: "10pt" | "11pt" | "12pt";
  fitToSinglePage: boolean;
  leftRightMargin: number; // in cm, default 1.0
  topBottomMargin: number; // in cm, default 0.6
  fontFamily: "cmr" | "eb-garamond" | "inter" | "serif"; // cmr is computer modern roman
  themeColor: string; // hex or latex representation
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: TechnicalSkill[];
  careerVault?: VaultItem[];
}
