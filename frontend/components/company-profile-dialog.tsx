"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  type CompanyProfile,
  loadProfile,
  saveProfile,
} from "@/lib/company-profile";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (profile: CompanyProfile) => void;
  /** When true, Cancel and backdrop dismiss are disabled — user must save. */
  required?: boolean;
}

export function CompanyProfileDialog({ open, onClose, onSave, required = false }: Props) {
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const p = loadProfile();
      setCompanyName(p.companyName);
      setDescription(p.description);
    }
  }, [open]);

  if (!open) return null;

  const canSave = companyName.trim().length > 0 && description.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const profile: CompanyProfile = { companyName, description };
    saveProfile(profile);
    onSave(profile);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (required) return;
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-lg)]">
        <h2 className="mb-4 text-lg font-semibold">Company Profile</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {required
            ? "Please set up your company profile before starting. This information will be used as context for all analyses."
            : "Configure your company details once. They will be automatically used as context for all tender analyses."}
        </p>

        <label className="mb-1 block text-sm font-medium">Company Name</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Nexus Digital Solutions"
          className="mb-4 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm shadow-[var(--shadow-sm)] outline-none transition-all duration-150 focus:border-primary/40 focus:shadow-[var(--shadow-md)] focus:ring-2 focus:ring-primary/15"
        />

        <label className="mb-1 block text-sm font-medium">
          Company Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`Include: industry, size, certifications, past projects, technology expertise, known limitations...\n\ne.g. Mid-tier Australian IT consultancy, 85 employees, ISO 27001:2022 certified...`}
          rows={10}
          className="mb-4 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm shadow-[var(--shadow-sm)] outline-none transition-all duration-150 focus:border-primary/40 focus:shadow-[var(--shadow-md)] focus:ring-2 focus:ring-primary/15"
        />

        <div className="flex justify-end gap-2">
          {!required && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={!canSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
