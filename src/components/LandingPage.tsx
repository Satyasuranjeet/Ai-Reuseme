import React, { useState } from "react";
import { 
  Sparkles, 
  Database, 
  LogIn, 
  User, 
  ExternalLink, 
  ShieldCheck, 
  FileCode, 
  Layout, 
  Layers,
  Award,
  AlertTriangle,
  Laptop,
  Smartphone,
  CheckCircle2,
  Zap,
  ArrowRight,
  Eye,
  FileText
} from "lucide-react";
import { motion } from "motion/react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";

interface LandingPageProps {
  clerkError: string;
  setClerkError: (err: string) => void;
  isVerifying: boolean;
}

export default function LandingPage({ clerkError, setClerkError, isVerifying }: LandingPageProps) {
  // Check if Clerk configuration is active in current env
  const clerkPublishableKey = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY || "";
  const isClerkConfigured = !!clerkPublishableKey;

  // Detect if running inside an iframe (e.g., the AI Studio development environment)
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-200 font-sans relative overflow-x-hidden selection:bg-yellow-500/30 selection:text-yellow-200 flex flex-col justify-between">
      
      {/* Premium ambient decorative glow fields */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-amber-500/5 to-transparent pointer-events-none z-0" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-yellow-500/3 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-10 w-80 h-80 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none z-0" />
      
      {/* HEADER NAVIGATION */}
      <header className="border-b border-zinc-800/50 bg-[#0B0C10]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-none bg-yellow-500/10 font-mono font-bold text-yellow-500 text-xs tracking-widest border border-yellow-500/30">
            <span>L</span>
            <span className="text-[8px] transform translate-y-0.5 -translate-x-0.5">T</span>
            <span>X</span>
          </div>
          <span className="font-mono font-black text-xs uppercase tracking-widest text-zinc-100 hidden sm:inline-block">
            LaTeX Resume Architect
          </span>
          <span className="font-mono font-black text-xs uppercase tracking-widest text-zinc-100 sm:hidden">
            LaTeX LTX
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono bg-zinc-900/80 border border-zinc-800 text-zinc-400 py-1 px-3 rounded-none uppercase hidden md:inline-block">
            MongoDB Cloud Synced
          </span>
          <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-1 px-2.5 rounded-none uppercase">
            Active System
          </span>
        </div>
      </header>

      {/* PRODUCT LANDING PAGE BODY */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 md:py-16 z-10 flex flex-col gap-16 md:gap-20">
        
        {/* HERO HEADER & GATEWAY INTERACTION GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Product pitch & metrics */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/25 rounded-none font-mono text-[9px] uppercase tracking-widest text-yellow-500">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              Next-Gen LaTeX ATS Optimizer
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-mono font-extrabold text-stone-150 tracking-tight leading-[1.08] uppercase">
              Your Resume. <br />
              <span className="text-yellow-500">Perfected in LaTeX.</span> <br />
              <span className="text-zinc-400 text-2xl sm:text-3xl lg:text-4xl block normal-case font-sans font-light mt-1.5">
                AI Spliced. ATS Target Scored.
              </span>
            </h1>
            
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xl font-sans font-light">
              Don't compromise on typographic excellence. LaTeX Resume Architect empowers you to manage a comprehensive offline-ready career vault, instantly compile standard templates, and use deep Gemini AI models to splice key metrics directly into your resume bullets.
            </p>

            {/* Micro value badges */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-zinc-400 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-yellow-500" />
                <span>Zero LaTeX Install Needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-yellow-500" />
                <span>MongoDB Automated Sync</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-yellow-500" />
                <span>100% Secure Clerk SSO</span>
              </div>
            </div>
          </div>

          {/* Right Column: Beautiful Gateway Auth Card */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-none blur-xl opacity-35" />
            <div className="relative bg-[#0D0E12] border border-zinc-800 p-6 md:p-8 rounded-none shadow-2xl">
              <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-500" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-zinc-800" />
              <div className="absolute bottom-0 left-0 w-2 h-2 bg-zinc-800" />
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-500" />
              
              <h2 className="text-xs font-mono font-black uppercase text-zinc-100 tracking-wider mb-2.5 flex items-center gap-2 border-b border-zinc-800/80 pb-3">
                <LogIn className="w-4 h-4 text-yellow-500" /> Cloud Sync Gateway
              </h2>

              <p className="text-[11px] text-zinc-450 leading-relaxed font-sans mb-5">
                Authenticate in one click to unlock cloud save with your secure MongoDB instance, activate the AI ATS scoring diagnostics, and save your career vaults.
              </p>

              {/* Iframe Redirect Warning with New Tab Button */}
              {isInIframe && (
                <div className="p-3.5 mb-5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10.5px] font-sans rounded-none leading-relaxed text-left space-y-2">
                  <div className="flex items-center gap-1.5 font-mono text-yellow-500 uppercase font-black text-[9px] tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    <span>Sandbox Iframe Boundary Detected</span>
                  </div>
                  <p className="opacity-90 leading-tight">
                    Clerk SSO authorization requires secure page redirections. To log in successfully, launch this application inside a clean web browser window.
                  </p>
                  <div className="pt-1.5">
                    <a 
                      href={window.location.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 text-[9.5px] uppercase font-mono tracking-wider bg-yellow-500 text-black px-3.5 py-2 font-bold hover:bg-yellow-450 transition text-center"
                    >
                      Open App In New Tab <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {clerkError && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-sans rounded-none leading-relaxed">
                  {clerkError}
                </div>
              )}

              {/* CLERK REGISTRATION PATHWAYS */}
              <div className="space-y-3">
                {isVerifying ? (
                  <div className="p-4 bg-zinc-950 border border-zinc-850 text-center space-y-2.5">
                    <div className="inline-block w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                    <p className="font-mono text-[9px] uppercase text-zinc-500 tracking-widest">
                      Establishing database connection...
                    </p>
                  </div>
                ) : isClerkConfigured ? (
                  <div className="space-y-2.5">
                    <SignInButton mode="modal">
                      <button 
                        onClick={() => {
                          localStorage.setItem("clerk_auth_action", "login");
                          setClerkError("");
                        }}
                        className="w-full flex items-center justify-center gap-2.5 py-3 text-xs font-bold font-mono uppercase tracking-wider bg-yellow-500 hover:bg-yellow-450 text-black rounded-none transition duration-150 shadow-sm cursor-pointer border border-yellow-600"
                      >
                        <LogIn className="w-4 h-4" />
                        Enter Application Workspace
                      </button>
                    </SignInButton>
                    
                    <SignUpButton mode="modal">
                      <button 
                        onClick={() => {
                          localStorage.setItem("clerk_auth_action", "register");
                          setClerkError("");
                        }}
                        className="w-full py-2.5 text-xs font-mono font-bold tracking-wider rounded-none bg-zinc-900/60 hover:bg-zinc-850 text-zinc-350 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
                      >
                        Create Free Developer Profile
                      </button>
                    </SignUpButton>
                  </div>
                ) : (
                  <div className="p-3.5 bg-zinc-900/40 border border-zinc-850/80 text-[10.5px] text-zinc-400 text-left space-y-2">
                    <div className="flex items-center gap-1.5 font-mono text-yellow-500 uppercase font-black text-[9px] tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-505 shrink-0" />
                      <span>Workspace Auth Status</span>
                    </div>
                    <p className="font-sans leading-relaxed text-zinc-450">
                      Standard environment mode: Setup your <code className="text-[10px] text-zinc-200 font-mono bg-zinc-950 px-1 py-0.5 border border-zinc-850">VITE_CLERK_PUBLISHABLE_KEY</code> credentials to enable production MongoDB cloud integrations.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* HIGH-FIDELITY PRODUCT VIEWPORT SHIELD & DEVICE PREVIEWS (Laptop & Smartphone Mockup) */}
        <section className="space-y-6">
          <div className="text-center space-y-1.5">
            <span className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest font-black">Live Application Viewport Mockup</span>
            <h2 className="text-xl sm:text-2xl font-mono text-stone-200 uppercase font-bold">The Aesthetic Workspace Grid</h2>
            <p className="text-xs text-zinc-400 font-sans max-w-lg mx-auto">See how the split-pane architect formats perfect resumes alongside continuous AI scores.</p>
          </div>

          <div className="relative pt-6 max-w-5xl mx-auto">
            {/* Ambient visual background glow for the gadgets */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-56 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none z-0" />

            {/* DUAL SCREEN COLLABORATIVE RENDER */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 relative z-10">
              
              {/* 1. HIGH-FIDELITY LAPTOP BROWSER FRAME MOCKUP */}
              <div className="w-full lg:w-[75%] bg-[#0B0C10] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col">
                
                {/* Browser chrome headers */}
                <div className="bg-zinc-950 py-2.5 px-4 border-b border-zinc-900 flex items-center justify-between shrink-0 font-mono text-[9.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <div className="bg-zinc-900 border border-zinc-850 rounded text-zinc-500 px-10 py-0.5 text-center truncate max-w-[280px]">
                    latex-resume-architect.io/workspace
                  </div>
                  <div className="flex items-center gap-1 text-zinc-500">
                    <Laptop className="w-3.5 h-3.5" />
                    <span className="text-[8px] uppercase font-bold text-zinc-650">DESKTOP WORKSPACE</span>
                  </div>
                </div>

                {/* Inner simulated split-pane layout mimicking the real App.tsx */}
                <div className="grid grid-cols-1 md:grid-cols-12 bg-[#07080B] text-zinc-300 min-h-[340px] text-left">
                  
                  {/* Left Simulated Interactive Form Control (40% width) */}
                  <div className="md:col-span-5 bg-[#0D0E12] border-r border-zinc-900 p-4 space-y-3 font-mono text-[10px]">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5 text-zinc-400">
                      <span className="text-[9px] uppercase font-bold text-yellow-500">Resume Structurer</span>
                      <span className="text-[8px] uppercase tracking-wider bg-zinc-900 px-1 border border-zinc-800">UNSAVED</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-zinc-500 uppercase text-[8px] block tracking-wide">Candidate Contact</label>
                      <div className="p-2 bg-zinc-950 border border-zinc-900 text-zinc-350">
                        John Doe • john@doe.com • Devops Specialist
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-zinc-500 uppercase text-[8px] block tracking-wide">Dynamic Experience Stack</label>
                      <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-none space-y-1">
                        <div className="flex justify-between items-center text-zinc-200">
                          <span className="font-bold text-[9px] text-yellow-500">Lead Architectural Engineer</span>
                          <span className="text-[8px] text-zinc-500">2024 - Present</span>
                        </div>
                        <p className="text-[8px] text-zinc-405 leading-snug">
                          • Built <b>highly scalable backend storage system</b> optimizing document retrieval databases by 42% over AWS clusters.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-zinc-500 font-bold uppercase text-[8px]">
                        <span>Career Vault Reserve (2)</span>
                        <span className="text-yellow-600">+ Spliced</span>
                      </div>
                      <div className="p-1 px-2 border border-dashed border-zinc-800 text-zinc-500 text-[8.5px] bg-[#07080B]">
                        • Kubernetes clusters backup cluster script logic ...
                      </div>
                    </div>
                  </div>

                  {/* Right Simulated Pure Typographical Academic Resume PDF Preview (70% width) */}
                  <div className="md:col-span-7 bg-zinc-200 py-6 px-7 flex flex-col justify-between text-neutral-900 rounded-none">
                    
                    {/* Tiny visual document mockup representing Academic Latex Style */}
                    <div className="space-y-4">
                      {/* Name heading */}
                      <div className="text-center space-y-0.5 border-b border-neutral-400 pb-2">
                        <h3 className="font-mono text-xs font-bold leading-none tracking-tight">JOHN DOE</h3>
                        <p className="font-sans text-[7px] text-neutral-700 font-light tracking-wide uppercase">
                          San Francisco, CA | john@doe.com | (555) 019-2834 | linkedin.com/in/johndoe
                        </p>
                      </div>

                      {/* Section 1: Education */}
                      <div className="space-y-1">
                        <h4 className="font-mono text-[8px] font-bold border-b border-neutral-300 pb-0.5 tracking-wider uppercase">EDUCATION</h4>
                        <div className="flex justify-between items-start text-[7px] font-sans">
                          <div>
                            <span className="font-bold">Stanford University</span> — M.S. in Computer Science
                          </div>
                          <span className="font-mono text-[7px] text-neutral-600">Graduated 2024</span>
                        </div>
                      </div>

                      {/* Section 2: Experience */}
                      <div className="space-y-1.5 text-[7px] leading-relaxed">
                        <h4 className="font-mono text-[8px] font-bold border-b border-neutral-300 pb-0.5 tracking-wider uppercase">PROFESSIONAL EXPERIENCE</h4>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between font-sans font-bold">
                            <span>STRIPE — LEAD ARCHITECTURAL ENGINEER</span>
                            <span className="font-mono font-normal">2024 -- Present</span>
                          </div>
                          <ul className="list-disc pl-3.5 space-y-0.5 font-sans text-[6.5px] text-neutral-800 tracking-tight leading-normal">
                            <li>Architected and managed a <b>highly scalable backend storage system</b>, maximizing API read-latencies by 35% through robust cloud pooling algorithms.</li>
                            <li>Engineered key Docker and continuous deployment pipelines, rescuing developer onboarding setup times by 4.5 hours per core engineer.</li>
                          </ul>
                        </div>
                      </div>

                      {/* Section 3: Technical Skills */}
                      <div className="space-y-1">
                        <h4 className="font-mono text-[8px] font-bold border-b border-neutral-300 pb-0.5 tracking-wider uppercase">TECHNICAL SKILLS</h4>
                        <p className="font-sans text-[6.5px] leading-tight">
                          <span className="font-bold">Languages/Frameworks:</span> Go, TypeScript, React, Node.js, Python, LaTeX Document Suite.<br />
                          <span className="font-bold">Databases/Cloud:</span> MongoDB Atlas, PostgreSQL, AWS Cloud Deployments, Docker Engine.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-300 flex justify-between items-center text-[7px] font-mono text-neutral-500 uppercase tracking-widest">
                      <span>Standard LaTeX Academic Layout</span>
                      <span className="font-bold text-neutral-700">Page 1 of 1</span>
                    </div>

                  </div>
                </div>

              </div>

              {/* 2. HIGH-FIDELITY MOBILE SMARTPHONE ATS OPTIMIZER FRAME MOCKUP */}
              <div className="w-[250px] bg-[#0B0C10] border-4 border-zinc-800 rounded-[28px] shadow-2xl aspect-[9/19] shrink-0 overflow-hidden flex flex-col text-left">
                
                {/* Phone Speaker Notch bar */}
                <div className="bg-zinc-950 py-2.5 flex items-center justify-center shrink-0 border-b border-zinc-900">
                  <div className="w-12 h-3.5 rounded-full bg-zinc-900 border border-zinc-800/80 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  </div>
                </div>

                {/* Inner Simulated Screen content (ATS MATCHING & MOBILE COMPLIANCE) */}
                <div className="flex-1 bg-[#07080B] p-4 flex flex-col justify-between font-mono text-[9px] relative">
                  
                  {/* Dashboard header */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-zinc-550 border-b border-zinc-900 pb-2">
                      <span className="uppercase text-[7.5px] tracking-wider text-yellow-500 font-bold">MATCH DETECTOR</span>
                      <span className="text-[7px]">SYSTEM LIVE</span>
                    </div>

                    {/* Circular evaluation progress score */}
                    <div className="py-4 flex flex-col items-center justify-center bg-[#0D0E12] border border-zinc-900 rounded-lg my-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 to-transparent" />
                      
                      <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center font-bold text-sm text-emerald-400 font-mono tracking-tighter shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                        94%
                      </div>
                      <span className="text-[7px] text-zinc-400 mt-2 uppercase tracking-widest font-black">ATS TARGET LEVEL</span>
                    </div>

                    {/* ATS Missing phrases highlights in red and emerald */}
                    <div className="space-y-1.5">
                      <span className="text-[7.5px] text-zinc-550 font-bold uppercase">Spliced Competencies</span>
                      
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded leading-normal space-y-1">
                        <div className="flex gap-1 items-center font-bold text-[7.5px] uppercase">
                          <Zap className="w-2.5 h-2.5 text-emerald-405" />
                          <span>INTEGATED SKILL</span>
                        </div>
                        <p className="text-[7px] text-zinc-350 leading-tight">
                          Resolved requirement: <b>"highly scalable app"</b> inserted safely into stripe engineering stack bullets.
                        </p>
                      </div>

                      <div className="p-2 bg-zinc-900 border border-zinc-850 text-zinc-400 rounded leading-normal">
                        <span className="text-[7px] font-sans text-yellow-500 uppercase font-black tracking-wide block">Career Vault Source</span>
                        <p className="text-[7px] leading-tight mt-0.5 italic">
                          "ScaleStore" achievement successfully matched and ported. Matches 4 targeted keyphrases.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Phone controls mockup */}
                  <div className="space-y-2 border-t border-zinc-900 pt-2 shrink-0">
                    <button className="w-full py-1.5 bg-yellow-500 text-black font-black text-[8px] uppercase tracking-wider text-center flex items-center justify-center gap-1">
                      <span>Sync All To LaTeX</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                    <div className="text-[7px] text-zinc-600 text-center uppercase tracking-widest leading-none">
                      • Device Simulation Match •
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* THREE CORE PRODUCT HIGHLIGHTS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left">
          
          <div className="p-6 bg-zinc-950/60 border border-zinc-850/80 rounded-none relative">
            <div className="absolute top-0 left-0 w-1 p-2 h-1 bg-yellow-500" />
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-yellow-500" />
              <h3 className="font-mono font-bold text-sm uppercase text-stone-200">Continuous Sync Engine</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans font-light">
              We bind direct cloud write triggers inside your workspace. Work on your desktop, and press <kbd className="bg-zinc-900 border border-zinc-800 text-[10px] px-1 font-mono text-yellow-500">Ctrl + S</kbd> to commit instant revisions safely back to your MongoDB instance. No data is lost.
            </p>
          </div>

          <div className="p-6 bg-zinc-950/60 border border-zinc-850/80 rounded-none relative">
            <div className="absolute top-0 left-0 w-1 p-2 h-1 bg-yellow-500" />
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h3 className="font-mono font-bold text-sm uppercase text-stone-200">The Metric Splicer</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans font-light">
              Our smart AI analyzer doesn't generic-draft. It targets missing skills (e.g. "Docker", "Go") and complex structural principles (e.g. "highly scalable app") and maps out complete metric-quantified bullet suggestions to splice directly inside your templates.
            </p>
          </div>

          <div className="p-6 bg-zinc-950/60 border border-zinc-850/80 rounded-none relative">
            <div className="absolute top-0 left-0 w-1 p-2 h-1 bg-yellow-500" />
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-5 h-5 text-indigo-500" />
              <h3 className="font-mono font-bold text-sm uppercase text-stone-200">Dual Export Ready</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans font-light">
              Export polished academic resumes with zero configuration. Grab clean compiled LaTeX code scripts for immediate Overleaf posting, or instantly download offline PDF documents custom tailored for high-frequency tracking software.
            </p>
          </div>

        </section>

      </main>

      {/* FOOTER & ABOUT US SECTION */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-6 py-12 z-10 font-mono text-xs mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          <div className="md:col-span-5 space-y-3 text-left">
            <h4 className="font-mono font-black text-xs uppercase tracking-widest text-zinc-200">
              LaTeX Resume Generator
            </h4>
            <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-none space-y-2 text-left">
              <span className="text-[10px] uppercase font-bold text-yellow-500 border-b border-zinc-800 pb-1.5 block tracking-widest">
                Our Mission Philosophy
              </span>
              <p className="text-[11px] font-sans leading-relaxed text-zinc-450 font-light">
                Created to build highly typographical, compliance-optimized engineering resumes instantly. This SaaS workspace replaces manual margin styling rules by transforming raw data blocks and standby career vault achievements into standardized LaTeX output templates.
              </p>
              <div className="text-[11px] font-bold text-yellow-500 font-mono flex items-center gap-1.5 pt-1 border-t border-zinc-800/60">
                <Award className="w-3.5 h-3.5 text-yellow-500" />
                <span>Created By Satya</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2 text-left">
            <h5 className="font-bold text-[10px] uppercase tracking-widest text-zinc-450">Cloud Database Coordinates</h5>
            <p className="text-[10px] text-zinc-550 leading-relaxed font-mono">
              Instance: MongoDB Atlas Cluster<br />
              Encryption: TLS 1.3 End-to-End<br />
              Replication: Global Server Nodes<br />
              Auth Schema: Clerk secure tokens
            </p>
          </div>

          <div className="md:col-span-4 space-y-2 text-left md:text-right">
            <h5 className="font-bold text-[10px] uppercase tracking-widest text-zinc-450 text-left md:text-right">Developer Protection</h5>
            <p className="text-[10.5px] text-zinc-550 leading-relaxed font-sans font-light text-left md:text-right">
              All credentials, API pathways, and Gemini models run behind full-stack Express server endpoints. No credentials ever bleed to client-side network inspectors.
            </p>
            <div className="text-[10px] font-mono text-zinc-450 flex items-center justify-start md:justify-end gap-1.5 pt-1.5">
              <span>App Status:</span>
              <span className="flex items-center gap-1 font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Cloud Online
              </span>
            </div>
          </div>

        </div>

        {/* BOTTOM METADATA BAR */}
        <div className="max-w-6xl mx-auto border-t border-zinc-900 mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-650 font-sans">
          <p>© 2026 LaTeX Resume Generator & ATS Match. Open-source MIT License.</p>
          <p className="font-mono text-yellow-500/70 mt-1 sm:mt-0 font-bold">Created By Satya</p>
        </div>
      </footer>

    </div>
  );
}
