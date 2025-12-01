/* Local storage utilities and API integration */
import { Project, Assessment, AssessmentType, CodingAssessment, EssayAssessment, RegisterRequest, AuthResponse, User } from "@/types";
import { post } from "@/lib/api";

const STORAGE_KEYS = {
  TOKEN: "ai-grade-token",
  USER: "ai-grade-user",
  PROJECTS: "ai-grade-projects",
  ROLE: "ai-grade-role",
} as const;

export const auth = {
  isLoggedIn: () => Boolean(localStorage.getItem(STORAGE_KEYS.TOKEN)),
  
  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
  
  getUser: () => {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  
  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const response = await post<AuthResponse>("/v1/auth/register", payload);

    if (!response.ok) {
      console.error("Registration API error:", {
        status: response.status,
        error: response.error,
      });
      throw new Error(response.error || "Registration failed");
    }

    const data = response.data;
    
    return data || { success: false, message: "Empty response", code: "", data: { token: "", user: {} as User } };
  },
  
  login: async (email: string, password: string) => {
    const response = await post<AuthResponse>("/v1/auth/login", { email, password });

    if (!response.ok) {
      console.error("Login API error:", { status: response.status, error: response.error });
      throw new Error(response.error || "Login failed");
    }

    const data = response.data;
    if (!data) {
      throw new Error("Empty response from login");
    }

    // Persist token and user info
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data.user));
      // Normalize role to local values: student | teacher
      const roleNormalized = data.data.user.role === "STUDENT" ? "student" : "teacher";
      localStorage.setItem(STORAGE_KEYS.ROLE, roleNormalized);
    } catch (err) {
      console.warn("Failed to persist auth data:", err);
    }

    return data;
  },
  
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
  },

  getRole: () => localStorage.getItem(STORAGE_KEYS.ROLE) as "student" | "teacher" | null,
};

export function loadProjects(): Project[] {
  const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

export function createProject(title: string): Project {
  const projects = loadProjects();
  const project: Project = {
    id: crypto.randomUUID(),
    title,
    createdAt: new Date().toISOString(),
    assessments: [],
  };
  const updated = [project, ...projects];
  saveProjects(updated);
  return project;
}

export function getProject(id: string): Project | undefined {
  return loadProjects().find((p) => p.id === id);
}

export function addAssessment(projectId: string, title: string, type: AssessmentType): Assessment | undefined {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return undefined;
  const base = {
    id: crypto.randomUUID(),
    title,
    type,
    createdAt: new Date().toISOString(),
    published: false,
  } as Assessment;

  let assessment: Assessment = base;
  if (type === "coding") {
    assessment = {
      ...base,
      type: "coding",
      coding: {
        description: "",
        publicTests: [],
        hiddenTests: [],
        language: "javascript",
        starterCode: "function solve(input) {\n  // TODO: write your solution\n  return input;\n}\n",
        enrollmentKey: crypto.randomUUID().slice(0, 8).toUpperCase(),
      },
    } as CodingAssessment;
  }
  if (type === "essay") {
    assessment = {
      ...base,
      type: "essay",
      modelAnswer: "",
      studentImages: [],
      ocrResults: [],
      aiNotes: "",
    } as EssayAssessment;
  }

  projects[idx].assessments = [assessment, ...projects[idx].assessments];
  saveProjects(projects);
  return assessment;
}

export function getAssessment(projectId: string, assessmentId: string): Assessment | undefined {
  return getProject(projectId)?.assessments.find((a) => a.id === assessmentId);
}

export function updateAssessment(projectId: string, updated: Assessment) {
  const projects = loadProjects();
  const pIdx = projects.findIndex((p) => p.id === projectId);
  if (pIdx === -1) return;
  projects[pIdx].assessments = projects[pIdx].assessments.map((a) => (a.id === updated.id ? updated : a));
  saveProjects(projects);
}
