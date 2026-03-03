import dotenv from "dotenv";
import mongoose from "mongoose";
import CoreProblem from "../models/CoreProblem.js";
import Problem from "../models/Problem.js";
import {
  computeDescriptionFingerprint,
  normalizeText
} from "../services/problemDedup.service.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const shouldApply = process.argv.includes("--apply");

if (!MONGO_URI) {
  console.error("MONGO_URI is missing in environment.");
  process.exit(1);
}

const buildMeta = (doc) => {
  const description = String(doc?.description || "");
  return {
    normalizedDescription: normalizeText(description).slice(0, 300),
    descriptionFingerprint: computeDescriptionFingerprint(description)
  };
};

const dedupeCollection = async (label, Model) => {
  const docs = await Model.find({})
    .select("_id description createdAt normalizedDescription descriptionFingerprint")
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  const groups = new Map();
  const updates = [];

  for (const doc of docs) {
    const meta = buildMeta(doc);

    if (
      doc.normalizedDescription !== meta.normalizedDescription ||
      doc.descriptionFingerprint !== meta.descriptionFingerprint
    ) {
      updates.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              normalizedDescription: meta.normalizedDescription,
              descriptionFingerprint: meta.descriptionFingerprint
            }
          }
        }
      });
    }

    const bucket = groups.get(meta.descriptionFingerprint) || [];
    bucket.push(doc._id);
    groups.set(meta.descriptionFingerprint, bucket);
  }

  const duplicateGroups = [];
  const deleteIds = [];

  for (const [fingerprint, ids] of groups.entries()) {
    if (ids.length <= 1) continue;
    const [keptId, ...duplicates] = ids;
    duplicateGroups.push({ fingerprint, keptId, removedCount: duplicates.length });
    deleteIds.push(...duplicates);
  }

  if (shouldApply) {
    if (updates.length > 0) {
      await Model.bulkWrite(updates, { ordered: false });
    }

    if (deleteIds.length > 0) {
      await Model.deleteMany({ _id: { $in: deleteIds } });
    }
  }

  return {
    label,
    scanned: docs.length,
    metadataUpdates: updates.length,
    duplicateGroupCount: duplicateGroups.length,
    removed: deleteIds.length,
    kept: docs.length - deleteIds.length,
    sampleGroups: duplicateGroups.slice(0, 10)
  };
};

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    const [coreSummary, problemSummary] = await Promise.all([
      dedupeCollection("CoreProblem", CoreProblem),
      dedupeCollection("Problem", Problem)
    ]);

    const mode = shouldApply ? "APPLY" : "DRY-RUN";
    console.log(`\n[${mode}] Description dedup summary`);
    console.table([
      {
        collection: coreSummary.label,
        scanned: coreSummary.scanned,
        metadataUpdates: coreSummary.metadataUpdates,
        duplicateGroups: coreSummary.duplicateGroupCount,
        removed: coreSummary.removed,
        kept: coreSummary.kept
      },
      {
        collection: problemSummary.label,
        scanned: problemSummary.scanned,
        metadataUpdates: problemSummary.metadataUpdates,
        duplicateGroups: problemSummary.duplicateGroupCount,
        removed: problemSummary.removed,
        kept: problemSummary.kept
      }
    ]);

    const samples = [
      ...coreSummary.sampleGroups.map((item) => ({ collection: "CoreProblem", ...item })),
      ...problemSummary.sampleGroups.map((item) => ({ collection: "Problem", ...item }))
    ];

    if (samples.length > 0) {
      console.log("\nSample duplicate groups (first 10 per collection):");
      console.table(samples);
    }

    if (!shouldApply) {
      console.log("\nDry-run only. Re-run with --apply to persist metadata updates and delete duplicates.");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Failed to dedupe problems:", err.message);
    process.exit(1);
  }
};

run();
