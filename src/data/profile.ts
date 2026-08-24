export interface Project {
  name: string;
  description: string;
  tech: string[];
  github?: string;
  paper?: string;
  link?: string;
}

export interface ProofLink {
  label: string;
  href: string;
}

export const profile = {
  name: "Kiril Klein, PhD",
  role: "Machine Learning Engineer",
  tagline:
    "Machine Learning Engineer with a PhD in Machine Learning and Causal Inference — building end-to-end ML systems for clinical data.",
  bio: [
    "I'm a Machine Learning Engineer with a PhD in Machine Learning and Causal Inference from the University of Copenhagen. I build end-to-end ML systems — from data pipelines and model training through validation, containerization, and production integration.",
    "At Aiomic (Copenhagen), I build end-to-end ML pipelines that combine transformers and classical ML for clinical data. My research background spans transformers pre-trained from scratch on longitudinal electronic health records and causal inference on observational data.",
  ],
  dissertation:
    "Scalable Causal Inference on Electronic Health Records Using Transformers",
  links: {
    github: "https://github.com/kirilklein",
    scholar: "https://scholar.google.com/citations?user=8k9TwncAAAAJ",
    linkedin: "https://www.linkedin.com/in/kiril-klein-phd-574809211/",
    email: "kiril.vadimovic.klein@gmail.com",
    cv: "/cv.pdf",
  },
  proof: [
    { label: "Aiomic", href: "https://aiomic.com" },
    {
      label: "CORE-BEHRT (PMLR 2024)",
      href: "https://proceedings.mlr.press/v252/odgaard24a.html",
    },
    { label: "BONSAI", href: "https://github.com/FGA-DIKU/BONSAI" },
    {
      label: "Scholar",
      href: "https://scholar.google.com/citations?user=8k9TwncAAAAJ",
    },
    { label: "CV", href: "/cv.pdf" },
  ] as ProofLink[],
  skills: {
    core_areas: [
      "Machine Learning Engineering",
      "Causal Inference",
      "NLP on Clinical Data",
      "Applied AI Research",
    ],
    programming: ["Python", "Bash"],
    modeling: [
      "Transformer Models",
      "Deep Learning",
      "Tree-based and Boosted Models",
      "Representation Learning",
      "Sequence Modeling",
    ],
    causal_inference: [
      "Target Trial Emulation",
      "Propensity Score Methods",
      "Matching and Weighting",
      "Time-to-event Analysis",
    ],
    engineering: [
      "ETL and Data Pipelines",
      "Docker-based Services",
      "CI/CD",
      "Experiment Design and Evaluation",
      "Reproducible ML Workflows",
    ],
    tools: [
      "PyTorch",
      "PyTorch Lightning",
      "Hydra",
      "scikit-learn",
      "XGBoost",
      "LightGBM",
      "Dask",
      "Docker",
      "Git",
      "Linux",
      "Azure",
      "GitHub Actions",
    ],
    domains: [
      "Electronic Health Records",
      "Pharmacoepidemiology",
      "Medical AI",
    ],
  },
  projects: [
    {
      name: "BONSAI",
      description:
        "Collaborative framework for transformer-based modeling of electronic health records",
      tech: ["PyTorch", "Transformers", "EHR"],
      github: "https://github.com/FGA-DIKU/BONSAI",
    },
    {
      name: "CORE-BEHRT",
      description:
        "A Carefully Optimized and Rigorously Evaluated BEHRT — PMLR vol. 252, 2024, joint first authorship",
      tech: ["Transformers", "EHR", "Research"],
      paper: "https://proceedings.mlr.press/v252/odgaard24a.html",
      github: "https://github.com/mikkelfo/CORE-BEHRT",
    },
    {
      name: "PHAIR-EHR",
      description:
        "Research extension of CORE-BEHRT for causal analyses on EHR data",
      tech: ["PyTorch", "Causal ML", "Healthcare"],
      github: "https://github.com/kirilklein/PHAIR_EHR",
    },
    {
      name: "MEDS",
      description:
        "Community data standard and ecosystem for health AI research — NEJM AI, 2026, co-author",
      tech: ["Data Standards", "Health AI", "Research"],
      paper: "https://doi.org/10.1056/AIra2501253",
      github: "https://github.com/Medical-Event-Data-Standard",
    },
  ] as Project[],
};
