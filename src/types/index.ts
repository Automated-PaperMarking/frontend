export type AssessmentType = "mcq" | "essay" | "coding";

// Auth Types
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  emailVerified: boolean;
}

export interface AuthResponse {
  code: string;
  message: string;
  data: {
    token: string;
    user: User;
  };
  success: boolean;
}

export interface AssessmentBase {
  id: string;
  title: string;
  type: AssessmentType;
  createdAt: string; // ISO string
}

export interface MCQAssessment extends AssessmentBase {
  type: "mcq";
}

export interface EssayAssessment extends AssessmentBase {
  type: "essay";
  modelAnswer?: string;
  studentImages?: string[]; // data URLs
  ocrResults?: string[]; // simulated OCR text
  aiNotes?: string; // simulated evaluation notes
}

export type LanguageOption = "javascript" | "python";

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface CodingData {
  description?: string;
  sampleInput?: string;
  sampleOutput?: string;
  language?: LanguageOption;
  publicTests: TestCase[];
  hiddenTests: TestCase[];
  starterCode?: string;
  enrollmentKey?: string;
}

export interface CodingAssessment extends AssessmentBase {
  type: "coding";
  coding: CodingData;
}

export type Assessment = MCQAssessment | EssayAssessment | CodingAssessment;

export interface Project {
  id: string;
  // Contest fields from server
  name: string;
  description?: string;
  enrollmentKey?: string;
  startTime?: string; // ISO with offset
  endTime?: string; // ISO with offset
  createdAt?: string;
  updatedAt?: string;
  // keep assessments optional for backward compatibility
  assessments?: Assessment[];
}
