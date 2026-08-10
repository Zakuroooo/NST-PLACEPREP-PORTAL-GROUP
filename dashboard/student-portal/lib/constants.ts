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
    totalQuestions: 0,
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
    totalQuestions: 0,
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
    totalQuestions: 0,
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
    totalQuestions: 0,
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
  /** IDs of questions assigned to this week — deduped across weeks at read time */
  questionIds?: string[];
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
  roadmapId?: string;  // MongoDB _id of the Roadmap document — needed for weekly progress tracking
  weeks: RoadmapWeek[];
}

