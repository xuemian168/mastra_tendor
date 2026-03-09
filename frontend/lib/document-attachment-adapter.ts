import type { AttachmentAdapter } from "@assistant-ui/react";
import { parseFile } from "./file-parser";

/**
 * Custom AttachmentAdapter that parses PDF/DOCX/TXT/MD files client-side
 * and converts them to text content for the assistant.
 *
 * Uses assistant-ui's official attachment system instead of manual file input.
 */
export const documentAttachmentAdapter: AttachmentAdapter = {
  accept:
    ".txt,.md,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  async add({ file }) {
    return {
      id: `${file.name}-${Date.now()}`,
      type: "document" as const,
      name: file.name,
      contentType: file.type || "application/octet-stream",
      file,
      content: [],
      status: { type: "requires-action" as const, reason: "composer-send" as const },
    };
  },

  async send(attachment) {
    const parsed = await parseFile(attachment.file);
    return {
      ...attachment,
      status: { type: "complete" as const },
      content: [
        {
          type: "text" as const,
          text: `<document title="${parsed.title}" chars="${parsed.text.length}">\n${parsed.text}\n</document>`,
        },
      ],
    };
  },

  async remove() {
    // no-op
  },
};
