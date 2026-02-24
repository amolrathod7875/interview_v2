import { callCohere } from "./cohere.service.js";

export async function analyzeWithAI({
  repo,
  owner,
  readmeText,
  techStack,
  paths,
}) {
  // Use Cohere for GitHub analysis. The API key to use is COHERE_API_KEY_GITHUB_ANALYSIS

  const prompt = `
You are a senior software engineer and technical interviewer.

Analyze the following GitHub repository and generate:

1. A concise project summary (3–4 lines)
2. 4 resume-ready bullet points
3. 6 project-based interview questions

Repository: ${owner}/${repo}

Tech Stack:
Languages: ${techStack.languages.join(", ")}
Frameworks: ${techStack.frameworks.join(", ")}
Domain: ${techStack.domain.join(", ")}

README:
${readmeText.slice(0, 4000)}

Project Structure:
${paths.slice(0, 200).join("\n")}
`;

  // Keep the same system persona but call Cohere instead, using the dedicated key
  const systemMsg = "You are an expert interviewer.";
  const cohereKey = process.env.COHERE_API_KEY_GITHUB_ANALYSIS;
  const content = await callCohere(prompt, systemMsg, 2048, cohereKey);

  return {
    projectSummary: extractSection(content, "Summary"),
    resumeBulletPoints: extractList(content),
    interviewQuestions: extractList(content),
  };
}

/* -------- helpers -------- */

function extractSection(text, key) {
  return text.slice(0, 500);
}

function extractList(text) {
  return text
    .split("\n")
    .map(l => l.replace(/^[-*0-9.]+/, "").trim())
    .filter(Boolean)
    .slice(0, 6);
}
