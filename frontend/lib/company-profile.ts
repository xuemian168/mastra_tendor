import { getStorage, setStorage } from "./storage";

const STORAGE_KEY = "tender-analysis-company-profile";

export interface CompanyProfile {
  companyName: string;
  description: string;
}

const EMPTY_PROFILE: CompanyProfile = { companyName: "", description: "" };

export function loadProfile(): CompanyProfile {
  return getStorage<CompanyProfile>(STORAGE_KEY, EMPTY_PROFILE);
}

export function saveProfile(profile: CompanyProfile) {
  setStorage(STORAGE_KEY, profile);
}

export function profileToSystemPrompt(profile: CompanyProfile): string | undefined {
  if (!profile.description.trim()) return undefined;
  return `[Company Profile] The user's company is "${profile.companyName}". Details:\n${profile.description}\n\nUse this company profile as context when analyzing tenders — assess compliance gaps, risk factors, and strategic fit against this profile automatically.`;
}
