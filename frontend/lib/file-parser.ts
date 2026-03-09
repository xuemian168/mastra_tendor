const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ParsedFile {
  text: string;
  title: string;
}

export async function parseFile(file: File): Promise<ParsedFile> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`);
  }

  const title = file.name;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  switch (ext) {
    case "txt":
    case "md":
      return { text: await file.text(), title };

    case "pdf":
      return { text: await parsePdf(file), title };

    case "docx":
      return { text: await parseDocx(file), title };

    default:
      throw new Error(`Unsupported file type: .${ext}. Supported: .txt, .md, .pdf, .docx`);
  }
}

async function parsePdf(file: File): Promise<string> {
  const { extractText } = await import("unpdf");
  const arrayBuffer = await file.arrayBuffer();
  const { text } = await extractText(arrayBuffer);
  return Array.isArray(text) ? text.join("\n\n") : text;
}

async function parseDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
