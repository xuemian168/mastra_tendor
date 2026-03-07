"use client";

import { useState, useEffect, useRef } from "react";
import {
  type CompanyProfile,
  loadProfile,
  saveProfile,
} from "@/lib/company-profile";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (profile: CompanyProfile) => void;
}

export function CompanyProfileDialog({ open, onClose, onSave }: Props) {
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

  const handleSave = () => {
    const profile: CompanyProfile = { companyName, description };
    saveProfile(profile);
    onSave(profile);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Company Profile</h2>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Configure your company details once. They will be automatically used
          as context for all tender analyses.
        </p>

        <label className="mb-1 block text-sm font-medium">Company Name</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Nexus Digital Solutions"
          className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />

        <label className="mb-1 block text-sm font-medium">
          Company Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`Include: industry, size, certifications, past projects, technology expertise, known limitations...\n\ne.g. Mid-tier Australian IT consultancy, 85 employees, ISO 27001:2022 certified...`}
          rows={10}
          className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
