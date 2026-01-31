import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import AdmZip from "adm-zip";
import { Parser } from "xml2js";

export const parseFileToText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  try {
    // Handle TXT files
    if (ext === ".txt") {
      const content = fs.readFileSync(filePath, "utf-8");
      console.log(`[FILE-PARSER] TXT file parsed, length: ${content.length}`);
      return content;
    }

    // Handle PDF files using pdf-parse
    if (ext === ".pdf") {
      console.log(`[FILE-PARSER] Attempting to parse PDF: ${filePath}`);
      const dataBuffer = fs.readFileSync(filePath);
      console.log(`[FILE-PARSER] PDF buffer size: ${dataBuffer.length} bytes`);
      
      try {
        const data = await pdfParse(dataBuffer);
        console.log(`[FILE-PARSER] PDF parsed, text length: ${data.text?.length || 0}`);
        
        if (data.text && data.text.trim().length > 0) {
          return data.text;
        } else {
          console.warn(`[FILE-PARSER] PDF has no extractable text (may be scanned image)`);
          return "[PDF contains images that cannot be OCR'd - please upload a text-based PDF]";
        }
      } catch (pdfError) {
        console.error(`[FILE-PARSER] PDF parse error:`, pdfError.message);
        throw pdfError;
      }
    }

    // Handle PPT/PPTX files
    if (ext === ".ppt" || ext === ".pptx") {
      console.log(`[FILE-PARSER] Attempting to parse PPTX: ${filePath}`);
      const result = await parsePowerPoint(filePath);
      console.log(`[FILE-PARSER] PPTX parsed, text length: ${result.length}`);
      return result;
    }

    // Unsupported file type
    console.warn(`[FILE-PARSER] Unsupported file type: ${ext}`);
    return "";
  } catch (error) {
    console.error(`[FILE-PARSER] Error parsing file ${filePath}:`, error.message);
    throw error;
  }
};

// Simple PPTX parser using xml2js
async function parsePowerPoint(filePath) {
  try {
    const zip = new AdmZip(filePath);
    const xmlParser = new Parser({ explicitArray: false });

    // PPTX stores slides in ppt/slides/slidesX.xml
    const slideEntries = zip
      .getEntries()
      .filter((entry) => entry.entryName.match(/ppt\/slides\/slide\d+\.xml/))
      .sort((a, b) => {
        const numA = parseInt(a.entryName.match(/slide(\d+)\.xml/)[1]);
        const numB = parseInt(b.entryName.match(/slide(\d+)\.xml/)[1]);
        return numA - numB;
      });

    console.log(`[FILE-PARSER] Found ${slideEntries.length} slides in PPTX`);

    let fullText = "";

    for (const entry of slideEntries) {
      const xmlContent = entry.getData().toString();
      const result = await xmlParser.parseStringPromise(xmlContent);
      const text = extractTextFromSlide(result);
      if (text) {
        fullText += text + "\n\n";
      }
    }

    return fullText.trim();
  } catch (error) {
    console.error("[FILE-PARSER] Error parsing PPTX:", error);
    // Fallback: try to read as binary text
    try {
      return fs.readFileSync(filePath, "utf-8").slice(0, 5000);
    } catch {
      throw error;
    }
  }
}

function extractTextFromSlide(slideResult) {
  const textElements = [];

  function traverse(obj) {
    if (!obj) return;
    if (typeof obj === "string") {
      if (obj.trim()) textElements.push(obj.trim());
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach(traverse);
      return;
    }
    if (typeof obj === "object") {
      // Check for common text properties
      if (obj.t) textElements.push(obj.t);
      // Check for a:p (paragraph) or similar
      if (obj["a:p"] || obj.p) {
        traverse(obj["a:p"] || obj.p);
      }
      // Recurse through all properties
      Object.values(obj).forEach(traverse);
    }
  }

  traverse(slideResult);
  return textElements.join(" ");
}
