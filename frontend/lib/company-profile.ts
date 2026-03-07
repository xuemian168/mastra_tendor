const STORAGE_KEY = "tender-analysis-company-profile";

export interface CompanyProfile {
  companyName: string;
  description: string;
}

const EMPTY_PROFILE: CompanyProfile = { companyName: "", description: "" };

export function loadProfile(): CompanyProfile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROFILE;
    return JSON.parse(raw) as CompanyProfile;
  } catch {
    return EMPTY_PROFILE;
  }
}

export function saveProfile(profile: CompanyProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function profileToSystemPrompt(profile: CompanyProfile): string | undefined {
  if (!profile.description.trim()) return undefined;
  return `[Company Profile] The user's company is "${profile.companyName}". Details:\n${profile.description}\n\nUse this company profile as context when analyzing tenders — assess compliance gaps, risk factors, and strategic fit against this profile automatically.`;
}
