import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Topic from "../models/Topic.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(" MONGO_URI not found in .env");
  process.exit(1);
}

const topics = [
  { name: "Arrays", slug: "arrays", order: 1 },
  { name: "Strings", slug: "strings", order: 2 },
  { name: "Hashing", slug: "hashing", order: 3 },
  { name: "Two Pointers", slug: "two-pointers", order: 4 },
  { name: "Sliding Window", slug: "sliding-window", order: 5 },
  { name: "Stack", slug: "stack", order: 6 },
  { name: "Queue", slug: "queue", order: 7 },
  { name: "Linked List", slug: "linked-list", order: 8 },
  { name: "Trees", slug: "trees", order: 9 },
  { name: "Graphs", slug: "graphs", order: 10 },
  { name: "Dynamic Programming", slug: "dynamic-programming", order: 11 }
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(" MongoDB connected");

    await Topic.deleteMany();
    await Topic.insertMany(topics);

    console.log(" Topics seeded successfully");
    process.exit();
  } catch (err) {
    console.error(" Seeding failed:", err.message);
    process.exit(1);
  }
};

seed();
