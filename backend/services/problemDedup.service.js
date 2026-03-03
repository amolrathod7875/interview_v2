import { createHash } from "crypto";

export const normalizeText = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getTokenSet = (text = "") => {
  const normalized = normalizeText(text);
  if (!normalized) return new Set();
  return new Set(normalized.split(" ").filter(Boolean));
};

export const jaccardSimilarity = (setA = new Set(), setB = new Set()) => {
  if (!setA.size && !setB.size) return 1;
  if (!setA.size || !setB.size) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }

  const union = new Set([...setA, ...setB]).size;
  return union ? intersection / union : 0;
};

export const computeDescriptionFingerprint = (description = "") =>
  createHash("sha256").update(normalizeText(description)).digest("hex");

export const buildFingerprint = ({ title = "", description = "" } = {}) => {
  const normalizedTitle = normalizeText(title);
  const normalizedDescription = normalizeText(description).slice(0, 300);

  return {
    normalizedTitle,
    normalizedDescription,
    descriptionFingerprint: computeDescriptionFingerprint(description),
    titleTokens: getTokenSet(title),
    descriptionTokens: getTokenSet(description)
  };
};

export const isNearDuplicate = (candidate, existingFingerprints = []) => {
  if (!candidate?.normalizedTitle) return true;

  return existingFingerprints.some((existing) => {
    if (candidate.normalizedTitle === existing.normalizedTitle) return true;
    if (
      candidate.descriptionFingerprint &&
      existing.descriptionFingerprint &&
      candidate.descriptionFingerprint === existing.descriptionFingerprint
    ) {
      return true;
    }
    if (
      candidate.normalizedDescription &&
      existing.normalizedDescription &&
      candidate.normalizedDescription === existing.normalizedDescription
    ) {
      return true;
    }

    const titleSimilarity = jaccardSimilarity(candidate.titleTokens, existing.titleTokens);
    const descriptionSimilarity = jaccardSimilarity(
      candidate.descriptionTokens,
      existing.descriptionTokens
    );

    return titleSimilarity >= 0.8 || (titleSimilarity >= 0.6 && descriptionSimilarity >= 0.75);
  });
};
