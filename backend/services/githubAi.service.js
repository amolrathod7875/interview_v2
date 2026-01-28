import axios from "axios";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY_amol;

export async function analyzeWithAI({
  repo,
  owner,
  readmeText,
  techStack,
  paths,
}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY missing");
  }

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

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "nvidia/nemotron-3-nano-30b-a3b:free",
      messages: [
        { role: "system", content: "You are an expert interviewer." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const content = response.data.choices[0].message.content;

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
