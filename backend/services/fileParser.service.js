import fs from "fs";
import path from "path";

export const parseFileToText = async (filePath) => {
  const ext = path.extname(filePath);

  if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  }

  // Placeholder for PDF / PPT
  // Later: pdf-parse, unstructured, llamaindex, etc.
  return "Parsed text from document goes here...";
};
