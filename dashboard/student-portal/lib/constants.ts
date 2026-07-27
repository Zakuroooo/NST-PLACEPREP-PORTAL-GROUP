import { Monitor, Building, Calculator, Users, Zap, GraduationCap, Target, FileText, HelpCircle } from "lucide-react";

export type RoundType = "Coding" | "System Design" | "LLD" | "HR" | "Aptitude" | "Domain";

export interface PracticeCategory {
  id: string;
  label: string;
  iconName: string;
  description: string;
  totalQuestions: number;
  color: string;
  textColor: string;
  borderColor: string;
  roundTypes: RoundType[];
}

export const allTopics = [
  "Arrays", "DP", "Graphs", "Trees", "Binary Search",
  "Heaps", "Stacks", "Linked List", "Sliding Window",
  "Backtracking", "System Design", "LLD", "DBMS",
  "OS", "Networking", "OOP", "Aptitude", "Behavioral",
];

export const practiceCategories: PracticeCategory[] = [
  {
    id: "dsa",
    label: "DSA",
    iconName: "Monitor",
    description: "Data Structures & Algorithms — arrays, graphs, DP, trees",
    totalQuestions: 2400,
    color: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    roundTypes: ["Coding"],
  },
  {
    id: "system-design",
    label: "System Design",
    iconName: "Building",
    description: "High-level design — scalability, databases, caching, APIs",
    totalQuestions: 380,
    color: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    roundTypes: ["System Design"],
  },
  {
    id: "aptitude",
    label: "Aptitude",
    iconName: "Calculator",
    description: "Quant, logical reasoning, verbal for TCS NQT, Infosys Spectra",
    totalQuestions: 650,
    color: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    roundTypes: ["Aptitude"],
  },
  {
    id: "behavioral",
    label: "HR & Behavioral",
    iconName: "Users",
    description: "Amazon Leadership Principles, STAR method, cultural fit",
    totalQuestions: 150,
    color: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    roundTypes: ["HR"],
  },
];

export type Difficulty = "Easy" | "Medium" | "Hard";

export type CompanyCategory = "maang" | "product" | "service" | "startup" | "bfsi" | "other";

export interface TopicRating {
  id: string;
  label: string;
  defaultRating: number;
}


export interface RoadmapWeek {
  weekNum: number;
  topic: string;
  totalQuestions: number;
  doneQuestions: number;
  status: "done" | "active" | "locked";
  questions: { id: number | string; title: string; diff: Difficulty; xp: number; leetcodeUrl?: string; done?: boolean }[];
}

export interface UserRoadmapCompany {
  slug: string;
  name: string;
  initial: string;
  color: string;
  role: string;
  totalWeeks: number;
  currentWeek: number;
  pctComplete: number;
  weeks: RoadmapWeek[];
}

export const topicsByCategory: Record<CompanyCategory, TopicRating[]> = {
  maang: [
    { id: "arrays", label: "Arrays & Strings", defaultRating: 5 },
    { id: "dp", label: "DP", defaultRating: 3 },
    { id: "graphs", label: "Graphs & BFS/DFS", defaultRating: 4 },
    { id: "trees", label: "Trees & Binary Search", defaultRating: 5 },
    { id: "sysDesign", label: "System Design (HLD)", defaultRating: 3 },
    { id: "lld", label: "Low Level Design (LLD)", defaultRating: 3 },
    { id: "behavioral", label: "Behavioral (STAR Method)", defaultRating: 6 },
    { id: "os", label: "Operating Systems", defaultRating: 4 },
  ],
  product: [
    { id: "arrays", label: "Arrays & Strings", defaultRating: 5 },
    { id: "dp", label: "DP", defaultRating: 4 },
    { id: "trees", label: "Trees & Graphs", defaultRating: 5 },
    { id: "lld", label: "Low Level Design (LLD)", defaultRating: 3 },
    { id: "sysDesign", label: "System Design (HLD)", defaultRating: 4 },
    { id: "sql", label: "SQL & Databases", defaultRating: 5 },
    { id: "oop", label: "OOP & Design Patterns", defaultRating: 4 },
    { id: "behavioral", label: "Behavioral (STAR Method)", defaultRating: 6 },
  ],
  service: [
    { id: "sql", label: "SQL & DBMS", defaultRating: 5 },
    { id: "os", label: "Operating Systems", defaultRating: 4 },
    { id: "networking", label: "Computer Networks", defaultRating: 4 },
    { id: "java", label: "Java / Core Programming", defaultRating: 5 },
    { id: "arrays", label: "Arrays & Basic DSA", defaultRating: 6 },
    { id: "oop", label: "OOP Concepts", defaultRating: 5 },
    { id: "agile", label: "Agile & SDLC", defaultRating: 6 },
  ],
  startup: [
    { id: "arrays", label: "DSA Fundamentals", defaultRating: 5 },
    { id: "fullstack", label: "Full Stack Concepts", defaultRating: 4 },
    { id: "sysDesign", label: "System Design Basics", defaultRating: 3 },
    { id: "sql", label: "SQL & Databases", defaultRating: 5 },
    { id: "devops", label: "DevOps & Cloud Basics", defaultRating: 3 },
    { id: "problemSolving", label: "Problem Solving", defaultRating: 5 },
  ],
  bfsi: [
    { id: "sql", label: "SQL & Data Analysis", defaultRating: 5 },
    { id: "java", label: "Java / Python Basics", defaultRating: 5 },
    { id: "arrays", label: "DSA Fundamentals", defaultRating: 5 },
    { id: "probability", label: "Probability & Stats", defaultRating: 4 },
    { id: "excel", label: "Excel & Reporting", defaultRating: 6 },
    { id: "networking", label: "Networking Basics", defaultRating: 4 },
  ],
  other: [
    { id: "arrays", label: "Arrays & Strings", defaultRating: 5 },
    { id: "dp", label: "DP", defaultRating: 3 },
    { id: "trees", label: "Trees & Graphs", defaultRating: 4 },
    { id: "sql", label: "SQL & Databases", defaultRating: 5 },
    { id: "sysDesign", label: "System Design", defaultRating: 3 },
    { id: "behavioral", label: "Behavioral (STAR Method)", defaultRating: 6 },
  ],
};

export function getTopicsForCategories(categories: CompanyCategory[]): TopicRating[] {
  if (categories.length === 0) return topicsByCategory.other;
  const seen = new Set<string>();
  const merged: TopicRating[] = [];
  for (const cat of categories) {
    for (const topic of topicsByCategory[cat]) {
      if (!seen.has(topic.id)) {
        seen.add(topic.id);
        merged.push(topic);
      }
    }
  }
  return merged;
}
