import { ResumeData, PageSettings } from "./types";

export const initialResumeData: ResumeData = {
  personalInfo: {
    name: "SATYA SURANJEET JENA",
    course: "Computer Science and Engineering",
    phone: "+91 84580 76100",
    email: "satyajena911@gmail.com",
    github: "github.com/Satyasuranjeet",
    linkedin: "linkedin.com/in/satyasuranjeet",
    imageUrl: "" // Pre-populate empty or we can add a beautiful default initials avatar
  },
  education: [
    {
      id: "edu-1",
      degree: "Bachelor of Technology in Computer Science and Engineering",
      institution: "Institute of Technical Education and Research",
      score: "CGPA: 9.25",
      dates: "2021-25"
    },
    {
      id: "edu-2",
      degree: "Senior Secondary (12th Grade)",
      institution: "Mount Litera Zee School",
      score: "Percentage: 83%",
      dates: "2019-21"
    },
    {
      id: "edu-3",
      degree: "Secondary (10th Grade)",
      institution: "Stewart School",
      score: "Percentage: 80%",
      dates: "2019"
    }
  ],
  experience: [
    {
      id: "exp-1",
      role: "Specialist Programmer (STG) @ Infosys",
      company: "Infosys",
      locationType: "On-site/Hybrid",
      employmentType: "Full-time",
      dates: "October 2025 - Present",
      bullets: [
        "Develop scalable, user-centric web applications using the MERN stack, translating Figma designs into pixel-perfect, accessible interfaces with semantic HTML and Tailwind CSS.",
        "Accelerate UI development and code optimization by leveraging modern AI tools (GitHub Copilot, Claude) to enhance developer productivity and debugging.",
        "Build and consume robust REST API structures and implement automated checks (Playwright testing, Jenkins CI/CD) to ensure production-grade quality on AWS."
      ]
    },
    {
      id: "exp-2",
      role: "Cv Tech Intern @ Highradius",
      company: "Highradius",
      locationType: "On-site",
      employmentType: "Internship",
      dates: "June 2024 - August 2024",
      bullets: [
        "Worked closely with complex datasets in the Order-to-Cash cycle, finding effective ways to process and present data attributes like payments and remittances.",
        "Designed and maintained cron jobs for automation, ensuring efficient data pipelines and system hygiene.",
        "Utilized ERP systems and SQL for reliable database management and querying."
      ]
    },
    {
      id: "exp-3",
      role: "PWC Cloud & Digital Launchpad",
      company: "Virtual",
      locationType: "Training",
      employmentType: "Training",
      dates: "February 2024 - July 2024",
      bullets: [
        "Built highly performant, responsive web views using semantic HTML5, modern CSS3, and plain JavaScript.",
        "Gained a solid understanding of DevOps fundamentals, implementing automated checks and CI/CD pipelines to gate code quality.",
        "Developed robust programming fundamentals in Java and Object-Oriented Principles within Agile workflows."
      ]
    }
  ],
  projects: [
    {
      id: "proj-1",
      title: "Arka AI -- AI-Powered Collaborative Architecture Workspace",
      description: "Unified realtime platform replacing disconnected whiteboards, docs, and chat for software system planning.",
      dates: "",
      technologies: "React 19, Vite, Tailwind CSS v4, Clerk, Liveblocks, React Flow, FastAPI, MongoDB, Trigger.dev, Groq, Vercel Blob",
      bullets: [
        "Eliminated tool-switching across Figma, Notion, and Slack---Arka AI collapses them into one shared workspace where teams go from idea to structured spec without leaving the tab.",
        "Built live multi-user canvas with real-time sync (Liveblocks, React Flow); Groq-powered AI reads canvas state and auto-generates feature specs, cutting spec-writing from hours to minutes.",
        "Shipped 29 production features: autosave, access control, spec export, and background jobs via Trigger.dev."
      ],
      link: "github.com/Satyasuranjeet/Arka-AI"
    },
    {
      id: "proj-2",
      title: "JStream - AI-Powered Music Streaming Platform",
      description: "An intelligent, real-time music streaming web app focusing on rendering performance and synchronized playback.",
      dates: "",
      technologies: "React.js, Tailwind CSS, Flask, WebSockets, TensorFlow, Saavn API, OpenCV",
      bullets: [
        "Built dynamic, responsive front-end views using React.js and Tailwind CSS, adhering to modern design system conventions.",
        "Designed efficient backend API structures with Flask to handle Saavn API integration, parsing 2M+ songs with <1s latency.",
        "Engineered WebSockets for real-time 1-to-many data synchronization across active user rooms."
      ],
      link: "github.com/Satyasuranjeet/JStream"
    },
    {
      id: "proj-3",
      title: "MailMon API Suite",
      description: "Built a secure email API with auth, API key management, admin panel, and QA test automation.",
      dates: "",
      technologies: "Flask, MongoDB, JWT, PyTest, Postman, SMTP, dotenv",
      bullets: [
        "Designed efficient API structures using Flask and MongoDB to power backend views securely and reliably.",
        "Developed a complete test coverage suite using PyTest for unit, API, and mocked scenarios.",
        "Integrated CI/CD via GitHub Actions to gate deployments with automated checks on every push."
      ],
      link: "github.com/Satyasuranjeet/MailMon"
    }
  ],
  skills: [
    {
      id: "skill-1",
      category: "Languages",
      skills: "JavaScript (ES6+), TypeScript, HTML5 (Semantic), CSS3, Java, Python, SQL"
    },
    {
      id: "skill-2",
      category: "Stack & Frameworks",
      skills: "MERN Stack (MongoDB, Express, React, Node.js), Tailwind CSS, Next.js, Flask, FastAPI"
    },
    {
      id: "skill-3",
      category: "Cloud & DevOps",
      skills: "AWS (EC2, S3), Docker, (CI/CD), GitHub Actions, Git, Vercel"
    },
    {
      id: "skill-4",
      category: "Testing & Tools",
      skills: "Figma, GitHub Copilot, Claude"
    },
    {
      id: "skill-5",
      category: "Core Competencies",
      skills: "Responsive Design, API Development, Real-time Systems, Performance Optimization, AI Integration"
    }
  ],
  careerVault: [
    {
      id: "vault-1",
      type: "project",
      title: "ScaleStore - Microservices E-Commerce API",
      subtitle: "Personal Project",
      description: "Designed a high-performance backend serving e-commerce traffic, introducing distributed caching and load buffering.",
      technologies: "Node.js, NestJS, Go, Redis, PostgreSQL, Kafka, Docker, Kubernetes",
      dates: "Jan 2024 - Mar 2024"
    },
    {
      id: "vault-2",
      type: "certification",
      title: "AWS Certified Solutions Architect - Associate",
      subtitle: "Amazon Web Services (AWS)",
      description: "Validated architectural expertise across database, compute, networking, security, and scaling services on AWS.",
      dates: "December 2024"
    },
    {
      id: "vault-3",
      type: "experience",
      title: "Freelance Software Engineer",
      subtitle: "Upwork & Local Clients",
      description: "Delivered web-scaling dashboards, bespoke payment pipelines, and automations for small to medium-sized business applications, achieving 98% client satisfaction.",
      dates: "Jan 2023 - Present"
    },
    {
      id: "vault-4",
      type: "skill",
      title: "Backend & Systems Sourced Tech",
      subtitle: "Systems Tech",
      description: "Go, NestJS, Redis, Elasticsearch, Kafka, Kubernetes, AWS Lambda, GraphQL, DynamoDB"
    },
    {
      id: "vault-5",
      type: "certification",
      title: "Playwright Automation Testing Certification",
      subtitle: "Udemy & Microsoft",
      description: "Professional certification covering complete end-to-end automation, network mocking, and load analysis.",
      dates: "August 2024"
    }
  ]
};

export const defaultSettings: PageSettings = {
  pageSize: "a4paper",
  fontSize: "10pt",
  fitToSinglePage: true,
  leftRightMargin: 1.0,
  topBottomMargin: 0.6,
  fontFamily: "cmr",
  themeColor: "#000000"
};
