import { ResumeData, PageSettings } from "./types";

// Helper to escape LaTeX special characters to ensure compiler stability
export function escapeLatex(text: string): string {
  if (!text) return "";
  
  // First escape backslashes temporarily with a placeholder to avoid double escaping,
  // but let's do simple direct replacements that are safe.
  let res = text;
  
  // Replace backslashes first so we don't escape our own escapes
  res = res.replace(/\\/g, "\\textbackslash{}");
  
  // Escape standard LaTeX special characters
  const replacements: [RegExp, string][] = [
    [/&/g, "\\&"],
    [/%/g, "\\%"],
    [/\$/g, "\\$"],
    [/#/g, "\\#"],
    [/_/g, "\\_"],
    [/\{/g, "\\{"],
    [/\}/g, "\\}"],
    [/\^/g, "\\textasciicircum{}"],
    [/~/g, "\\textasciitilde{}"],
    [/\|/g, "\\textbar{}"],
    [/</g, "\\textless{}"],
    [/>/g, "\\textgreater{}"],
  ];

  for (const [regex, replacement] of replacements) {
    res = res.replace(regex, replacement);
  }

  return res;
}

export function generateLatex(data: ResumeData, settings: PageSettings): string {
  const { personalInfo, education, experience, projects, skills } = data;
  
  // Handle dynamically calculated spacing depending on "fit to single page" toggle
  const topBottomGeometry = settings.fitToSinglePage ? Math.min(settings.topBottomMargin, 0.5) : settings.topBottomMargin;
  const leftRightGeometry = settings.fitToSinglePage ? Math.min(settings.leftRightMargin, 0.9) : settings.leftRightMargin;
  
  const sectionVSpace = settings.fitToSinglePage ? "-4.5mm" : "-3.0mm";
  const itemVSpace = settings.fitToSinglePage ? "-2.6mm" : "-2.0mm";
  const listVSpace = settings.fitToSinglePage ? "-1.0mm" : "0.0mm";

  // Escape all text inputs
  const name = escapeLatex(personalInfo.name);
  const course = escapeLatex(personalInfo.course);
  const phone = escapeLatex(personalInfo.phone);
  const email = escapeLatex(personalInfo.email);
  const github = escapeLatex(personalInfo.github);
  const linkedin = escapeLatex(personalInfo.linkedin);

  // Generate sections
  let educationSection = "";
  if (education && education.length > 0) {
    educationSection = `%-----------EDUCATION-----------
\\section{\\textbf{Education}}
\\resumeSubHeadingListStart
${education.map(edu => `  \\resumeSubheading
    { ${escapeLatex(edu.degree)}}{${escapeLatex(edu.score)}}
    { ${escapeLatex(edu.institution)}}{${escapeLatex(edu.dates)}}`).join("\n")}
\\resumeSubHeadingListEnd
\\vspace{${sectionVSpace}}
`;
  }

  let experienceSection = "";
  if (experience && experience.length > 0) {
    experienceSection = `%-----------EXPERIENCE-----------------
\\section{\\textbf{Experience, Training and Internship}}
  \\resumeSubHeadingListStart
${experience.map(exp => {
  const bulletsLatex = exp.bullets && exp.bullets.length > 0
    ? `      \\resumeItemListStart
${exp.bullets.map(b => `        \\item {${escapeLatex(b)}}`).join("\n")}
      \\resumeItemListEnd`
    : "";
    
  return `    \\resumeSubheading
      { ${escapeLatex(exp.role)}}{${escapeLatex(exp.locationType)}}
      {${escapeLatex(exp.company)}}{${escapeLatex(exp.dates)}}
      \\vspace{0.3mm}
${bulletsLatex}`;
}).join("\n\n")}
  \\resumeSubHeadingListEnd
\\vspace{${sectionVSpace}}
`;
  }

  let projectsSection = "";
  if (projects && projects.length > 0) {
    projectsSection = `%-----------PROJECTS-----------------
\\section{\\textbf{Projects}}
\\resumeSubHeadingListStart
${projects.map(proj => {
  const bulletsLatex = proj.bullets && proj.bullets.length > 0
    ? `  \\resumeItemListStart
${proj.bullets.map(b => `    \\item {${escapeLatex(b)}}`).join("\n")}
  \\resumeItemListEnd`
    : "";
    
  const techLabel = proj.technologies ? `\\textbf{Stack:} ${escapeLatex(proj.technologies)}` : "";
  const descLabel = proj.description ? `\\textit{${escapeLatex(proj.description)}}` : "";
  
  const escapedTitle = escapeLatex(proj.title);
  const rawLink = proj.link ? proj.link.trim() : "";
  const titleFormatted = rawLink 
    ? `\\href{${rawLink.match(/^[a-zA-Z]+:\/\//) ? rawLink : `https://${rawLink}`}}{${escapedTitle}}`
    : escapedTitle;
  
  return `  \\item
    \\begin{tabular*}{0.98\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
        \\textbf{${titleFormatted}} & \\textit{\\footnotesize{${escapeLatex(proj.dates)}}} \\\\
        ${techLabel ? `\\multicolumn{2}{p{0.98\\textwidth}}{\\footnotesize{${techLabel}}} \\\\` : ""}
        ${descLabel ? `\\multicolumn{2}{p{0.98\\textwidth}}{\\footnotesize{${descLabel}}} \\\\` : ""}
    \\end{tabular*}
    \\vspace{${itemVSpace}}
${bulletsLatex}`;
}).join("\n\n")}
\\resumeSubHeadingListEnd
\\vspace{${sectionVSpace}}
`;
  }

  let skillsSection = "";
  if (skills && skills.length > 0) {
    skillsSection = `%-----------Technical skills-----------------
\\section{\\textbf{Technical Skills and Core Competencies}}
\\begin{itemize}[leftmargin=0.15in, label={}]
    \\small
    \\item{
${skills.map(s => `     \\textbf{${escapeLatex(s.category)}}{: ${escapeLatex(s.skills)}}`).join(" \\\\\n")}
    }
\\end{itemize}
`;
  }

  // Choose Font Family declaration for LaTeX
  let fontDeclaration = settings.fontFamily === "cmr" 
    ? "\\fontfamily{cmr}\\selectfont" 
    : settings.fontFamily === "eb-garamond" 
      ? "\\usepackage{ebgaramond}\n\\fontfamily{ebgaramond}\\selectfont"
      : settings.fontFamily === "serif"
        ? "\\fontfamily{ptm}\\selectfont" // Times Roman standard
        : "\\fontfamily{phv}\\selectfont"; // Helvetica sans-serif

  return `%-------------------------
% Auto-Generated Resume from LaTeX Resume Generator
% Saved: ${new Date().toLocaleDateString()}
%------------------------

\\documentclass[${settings.pageSize},${settings.fontSize}]{article}
\\usepackage{latexsym}
\\usepackage{xcolor}
\\usepackage{float}
\\usepackage{ragged2e}
\\usepackage[empty]{fullpage}
\\usepackage{wrapfig}
\\usepackage{lipsum}
\\usepackage{tabularx}
\\usepackage{titlesec}
\\usepackage{geometry}
\\usepackage{marvosym}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{fontawesome5}
\\usepackage{multicol}
\\usepackage{graphicx}
\\usepackage[T1]{fontenc}
\\setlength{\\multicolsep}{0pt}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\geometry{left=${leftRightGeometry}cm, top=${topBottomGeometry}cm, right=${leftRightGeometry}cm, bottom=${topBottomGeometry}cm}

\\usepackage[most]{tcolorbox}
\\tcbset{
  frame code={},
  center title,
  left=0pt, right=0pt, top=0pt, bottom=0pt,
  colback=gray!20, colframe=white,
  width=\\dimexpr\\textwidth\\relax,
  enlarge left by=-2mm,
  boxsep=3pt,
  arc=0pt, outer arc=0pt,
}

\\urlstyle{same}
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-6pt}]

%-------------------------
\\newcommand{\\resumeItem}[2]{
  \\item{\\textbf{#1}{\\hspace{0.5mm}#2 \\vspace{-0.5mm}}}
}
\\newcommand{\\resumePOR}[3]{
\\vspace{0.5mm}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
        \\textbf{#1}\\hspace{0.3mm}#2 & \\textit{\\small{#3}}
    \\end{tabular*}
    \\vspace{-2mm}
}
\\newcommand{\\resumeSubheading}[4]{
\\vspace{0.3mm}\\item
    \\begin{tabular*}{0.98\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
        \\textbf{#1} & \\textit{\\footnotesize{#4}} \\\\
        \\textit{\\footnotesize{#3}} & \\footnotesize{#2}\\\\
    \\end{tabular*}
    \\vspace{${itemVSpace}}
}
\\newcommand{\\resumeProject}[4]{
\\vspace{0.3mm}\\item
    \\begin{tabular*}{0.98\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
        \\textbf{#1} & \\textit{\\footnotesize{#4}} \\\\
        \\multicolumn{2}{p{0.98\\textwidth}}{\\footnotesize{#3}} \\\\
        \\multicolumn{2}{p{0.98\\textwidth}}{\\footnotesize{\\textit{#2}}}
    \\end{tabular*}
    \\vspace{${itemVSpace}}
}
\\newcommand{\\resumeSubItem}[2]{\\resumeItem{#1}{#2}\\vspace{-4pt}}
\\renewcommand{\\labelitemi}{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=*,labelsep=0mm]}
\\newcommand{\\resumeHeadingSkillStart}{\\begin{itemize}[leftmargin=*,itemsep=1.7mm, rightmargin=2ex]}
\\newcommand{\\resumeItemListStart}{\\begin{justify}\\begin{itemize}[leftmargin=3ex, rightmargin=2ex, noitemsep,labelsep=1.2mm,itemsep=0mm]\\small}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}\\vspace{0mm}}
\\newcommand{\\resumeHeadingSkillEnd}{\\end{itemize}\\vspace{-2mm}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\end{justify}\\vspace{${listVSpace}}}
\\newcommand{\\cvsection}[1]{%
\\vspace{1mm}
\\begin{tcolorbox}
    \\textbf{\\large #1}
\\end{tcolorbox}
    \\vspace{-4mm}
}

\\newcolumntype{L}{>{\\raggedright\\arraybackslash}X}%
\\newcolumntype{R}{>{\\raggedleft\\arraybackslash}X}%
\\newcolumntype{C}{>{\\centering\\arraybackslash}X}%

\\newcommand{\\name}{${name}}
\\newcommand{\\course}{${course}}
\\newcommand{\\phone}{${phone}}
\\newcommand{\\emaila}{${email}}

\\begin{document}
${fontDeclaration}

%----------HEADING-----------------
\\begin{minipage}[t]{0.68\\textwidth}
    \\vspace{-0.3cm}
    {\\huge\\bfseries \\name}${personalInfo.course ? ` \\\\ [0.1cm]\n    {\\small\\itshape \\course}` : ""}
\\end{minipage}%
\\begin{minipage}[t]{0.32\\textwidth}
    \\vspace{-0.3cm}
    \\raggedleft
    {\\footnotesize
    \\faPhone\\ \\phone \\\\ [0.1cm]
    \\href{mailto:\\emaila}{\\faEnvelope\\ {\\emaila}} \\\\ [0.1cm]
    \\href{https://${github}}{\\faGithub\\ {${github}}} \\\\ [0.1cm]
    \\href{https://${linkedin}}{\\faLinkedin\\ {${linkedin}}}
    }
\\end{minipage}
\\vspace{-0.85cm}
${educationSection}${experienceSection}${projectsSection}${skillsSection}
\\end{document}
`;
}
