export interface FacultyMember {
  id: string;
  name: string;
  subjects: string[];
  doubtsSolvedThisMonth: number;
  doubtsSolvedAllTime: number;
}

export const CURRENT_FACULTY_ID = "f1";

export const mockFacultyMembers: FacultyMember[] = [
  {
    id: "f1",
    name: "Prof. Sharma",
    subjects: ["DSA", "System Design", "Web Development", "DBMS & SQL", "Cloud Computing"],
    doubtsSolvedThisMonth: 12,
    doubtsSolvedAllTime: 145,
  }
];
