import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import AdmZip from "adm-zip";
import { Parser } from "xml2js";

// Simple in-memory cache for parsed files
const parseCache = new Map();
const CACHE_MAX_SIZE = 50;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Get cached result if available and valid
const getCachedResult = (filePath) => {
  const cached = parseCache.get(filePath);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[FILE-PARSER] Cache hit for: ${path.basename(filePath)}`);
    return cached.result;
  }
  return null;
};

// Cache the result
const setCachedResult = (filePath, result) => {
  // Clear old entries if cache is full
  if (parseCache.size >= CACHE_MAX_SIZE) {
    const firstKey = parseCache.keys().next().value;
    parseCache.delete(firstKey);
  }
  parseCache.set(filePath, { result, timestamp: Date.now() });
};

export const parseFileToText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);

  // Check cache first
  const cachedResult = getCachedResult(filePath);
  if (cachedResult !== null) {
    return cachedResult;
  }

  try {
    let result = "";

    // Handle TXT files
    if (ext === ".txt") {
      result = await parseTxtFile(filePath);
    }
    // Handle PDF files
    else if (ext === ".pdf") {
      result = await parsePdfFile(filePath);
    }
    // Handle PPT/PPTX files
    else if (ext === ".ppt" || ext === ".pptx") {
      result = await parsePowerPoint(filePath);
    }
    // Handle DOCX files
    else if (ext === ".docx") {
      result = await parseDocxFile(filePath);
    }
    // Unsupported file type
    else {
      console.warn(`[FILE-PARSER] Unsupported file type: ${ext}`);
      result = "";
    }

    // Cache the result
    if (result) {
      setCachedResult(filePath, result);
    }

    return result;
  } catch (error) {
    console.error(`[FILE-PARSER] Error parsing file ${filePath}:`, error.message);
    throw error;
  }
};

// Parse TXT file
async function parseTxtFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  console.log(`[FILE-PARSER] TXT file parsed, length: ${content.length}`);
  return content;
}

// Parse PDF file with improved extraction
async function parsePdfFile(filePath) {
  console.log(`[FILE-PARSER] Attempting to parse PDF: ${filePath}`);
  const dataBuffer = fs.readFileSync(filePath);
  console.log(`[FILE-PARSER] PDF buffer size: ${dataBuffer.length} bytes`);
  
  try {
    const data = await pdfParse(dataBuffer, {
      max: 5000, // Limit pages to prevent memory issues
      normalizeWhitespace: true,
    });
    
    console.log(`[FILE-PARSER] PDF parsed, text length: ${data.text?.length || 0}`);
    console.log(`[FILE-PARSER] PDF pages: ${data.numpages}`);
    
    if (data.text && data.text.trim().length > 0) {
      // Clean up the extracted text
      const cleanedText = data.text
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\n\s*\n/g, '\n\n') // Preserve paragraph breaks
        .trim();
      return cleanedText;
    } else {
      console.warn(`[FILE-PARSER] PDF has no extractable text (may be scanned image)`);
      return "[PDF contains images that cannot be extracted - please upload a text-based PDF]\n\nNote: Scanned PDFs require OCR processing which is not currently available.";
    }
  } catch (pdfError) {
    console.error(`[FILE-PARSER] PDF parse error:`, pdfError.message);
    throw pdfError;
  }
}

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

// Parse DOCX file
async function parseDocxFile(filePath) {
  console.log(`[FILE-PARSER] Attempting to parse DOCX: ${filePath}`);
  
  try {
    const zip = new AdmZip(filePath);
    const xmlParser = new Parser({ explicitArray: false });
    
    // DOCX stores document content in word/document.xml
    const documentEntry = zip.getEntry('word/document.xml');
    
    if (!documentEntry) {
      console.warn(`[FILE-PARSER] No document.xml found in DOCX`);
      return "";
    }
    
    const xmlContent = documentEntry.getData().toString();
    const result = await xmlParser.parseStringPromise(xmlContent);
    
    // Extract text from the document
    const textElements = [];
    
    function extractTextFromNode(node) {
      if (!node) return;
      
      if (typeof node === 'string') {
        if (node.trim()) textElements.push(node.trim());
        return;
      }
      
      if (Array.isArray(node)) {
        node.forEach(extractTextFromNode);
        return;
      }
      
      if (typeof node === 'object') {
        // Check for text content in w:t elements
        if (node['w:t']) {
          textElements.push(node['w:t']);
        }
        // Recurse through all properties
        Object.values(node).forEach(extractTextFromNode);
      }
    }
    
    extractTextFromNode(result);
    
    const fullText = textElements.join(' ');
    console.log(`[FILE-PARSER] DOCX parsed, text length: ${fullText.length}`);
    
    return fullText;
  } catch (error) {
    console.error(`[FILE-PARSER] DOCX parse error:`, error.message);
    throw error;
  }
}
