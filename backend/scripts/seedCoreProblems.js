import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Topic from "../models/Topic.js";
import CoreProblem from "../models/CoreProblem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI not found in .env");
  process.exit(1);
}

const STARTER_CODE = {
  python: "# Read input from stdin and print output\n# Write your solution below\n",
  javascript: "// Read input from stdin and print output\n// Write your solution below\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
  java: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n"
};

const CORE_PROBLEMS = [
  {
    topicName: "Arrays",
    difficulty: "easy",
    title: "Maximum Element in Array",
    description:
      "Given an array of integers, print the maximum element in the array.",
    input:
      "First line contains an integer n.\nSecond line contains n space-separated integers.",
    output: "Print a single integer: the maximum element.",
    constraints: "1 <= n <= 10^5\n-10^9 <= a[i] <= 10^9",
    examples: "Input:\n5\n1 9 3 4 2\nOutput:\n9",
    testCases: [
      { input: "5\n1 9 3 4 2", expectedOutput: "9" },
      { input: "4\n-1 -5 -2 -9", expectedOutput: "-1" },
      { input: "1\n42", expectedOutput: "42" }
    ]
  },
  {
    topicName: "Arrays",
    difficulty: "easy",
    title: "Array Sum",
    description:
      "Given an array of integers, print the sum of all elements.",
    input:
      "First line contains an integer n.\nSecond line contains n space-separated integers.",
    output: "Print a single integer: the sum of all elements.",
    constraints: "1 <= n <= 10^5\n-10^6 <= a[i] <= 10^6",
    examples: "Input:\n4\n1 2 3 4\nOutput:\n10",
    testCases: [
      { input: "4\n1 2 3 4", expectedOutput: "10" },
      { input: "5\n-1 -2 3 4 5", expectedOutput: "9" },
      { input: "1\n99", expectedOutput: "99" }
    ]
  },
  {
    topicName: "Arrays",
    difficulty: "easy",
    title: "Count Even Numbers in Array",
    description:
      "Given an array of integers, count how many elements are even and print the count.",
    input:
      "First line contains an integer n.\nSecond line contains n space-separated integers.",
    output: "Print a single integer: count of even numbers.",
    constraints: "1 <= n <= 10^5\n-10^9 <= a[i] <= 10^9",
    examples: "Input:\n6\n1 2 3 4 5 6\nOutput:\n3",
    testCases: [
      { input: "6\n1 2 3 4 5 6", expectedOutput: "3" },
      { input: "4\n1 3 5 7", expectedOutput: "0" },
      { input: "5\n0 -2 9 10 11", expectedOutput: "3" }
    ]
  },
  {
    topicName: "Arrays",
    difficulty: "easy",
    title: "Check If Array Is Sorted",
    description:
      "Given an array, print YES if it is sorted in non-decreasing order, otherwise print NO.",
    input:
      "First line contains an integer n.\nSecond line contains n space-separated integers.",
    output: "Print YES or NO.",
    constraints: "1 <= n <= 10^5\n-10^9 <= a[i] <= 10^9",
    examples: "Input:\n5\n1 2 2 4 9\nOutput:\nYES",
    testCases: [
      { input: "5\n1 2 2 4 9", expectedOutput: "YES" },
      { input: "4\n1 5 3 7", expectedOutput: "NO" },
      { input: "1\n100", expectedOutput: "YES" }
    ]
  },
  {
    topicName: "Strings",
    difficulty: "easy",
    title: "Count Vowels",
    description:
      "Given a string, count the number of vowels (a, e, i, o, u) in both lowercase and uppercase.",
    input: "A single line string s.",
    output: "Print the count of vowels in the string.",
    constraints: "1 <= |s| <= 10^5",
    examples: "Input:\nInterview\nOutput:\n3",
    testCases: [
      { input: "Interview", expectedOutput: "3" },
      { input: "AEIOU", expectedOutput: "5" },
      { input: "rhythm", expectedOutput: "0" }
    ]
  },
  {
    topicName: "Two Pointers",
    difficulty: "medium",
    title: "Pair With Target Sum",
    description:
      "Given a sorted array and a target sum, determine if there exists a pair of elements whose sum equals the target.",
    input:
      "First line contains n and target.\nSecond line contains n sorted space-separated integers.",
    output: "Print YES if such a pair exists, otherwise print NO.",
    constraints: "2 <= n <= 2 * 10^5\n-10^9 <= a[i], target <= 10^9",
    examples: "Input:\n5 10\n1 2 3 7 8\nOutput:\nYES",
    testCases: [
      { input: "5 10\n1 2 3 7 8", expectedOutput: "YES" },
      { input: "4 20\n1 3 5 7", expectedOutput: "NO" },
      { input: "6 0\n-5 -2 -1 1 4 8", expectedOutput: "NO" }
    ]
  },
  {
    topicName: "Stack",
    difficulty: "medium",
    title: "Valid Parentheses",
    description:
      "Given a string containing only characters ()[]{} , determine whether the brackets are balanced.",
    input: "A single line string s of bracket characters.",
    output: "Print YES if balanced, otherwise print NO.",
    constraints: "1 <= |s| <= 2 * 10^5",
    examples: "Input:\n([]{})\nOutput:\nYES",
    testCases: [
      { input: "([]{})", expectedOutput: "YES" },
      { input: "([)]", expectedOutput: "NO" },
      { input: "(((())))", expectedOutput: "YES" }
    ]
  },
  {
    topicName: "Dynamic Programming",
    difficulty: "medium",
    title: "Climbing Stairs",
    description:
      "You can climb 1 or 2 steps at a time. Given n stairs, print the total number of distinct ways to reach the top.",
    input: "A single integer n.",
    output: "Print the number of distinct ways.",
    constraints: "1 <= n <= 45",
    examples: "Input:\n5\nOutput:\n8",
    testCases: [
      { input: "1", expectedOutput: "1" },
      { input: "5", expectedOutput: "8" },
      { input: "10", expectedOutput: "89" }
    ]
  }
];

const BUCKET_DIFFICULTIES = ["easy", "medium", "hard"];
const MIN_PROBLEMS_PER_BUCKET = 3;

const AUTO_TEMPLATES = {
  easy: [
    {
      suffix: "Foundations I",
      description:
        "Given an integer array, print the sum of all elements.",
      input:
        "First line contains an integer n.\nSecond line contains n space-separated integers.",
      output: "Print a single integer: the sum.",
      constraints: "1 <= n <= 10^5\n-10^6 <= a[i] <= 10^6",
      examples: "Input:\n5\n1 2 3 4 5\nOutput:\n15",
      testCases: [
        { input: "5\n1 2 3 4 5", expectedOutput: "15" },
        { input: "4\n-1 2 -3 4", expectedOutput: "2" },
        { input: "1\n7", expectedOutput: "7" }
      ]
    },
    {
      suffix: "Foundations II",
      description:
        "Given an integer array, print the difference between maximum and minimum element.",
      input:
        "First line contains an integer n.\nSecond line contains n space-separated integers.",
      output: "Print max(array) - min(array).",
      constraints: "1 <= n <= 10^5\n-10^9 <= a[i] <= 10^9",
      examples: "Input:\n4\n4 9 1 6\nOutput:\n8",
      testCases: [
        { input: "4\n4 9 1 6", expectedOutput: "8" },
        { input: "3\n5 5 5", expectedOutput: "0" },
        { input: "5\n-3 -1 -7 -2 -4", expectedOutput: "6" }
      ]
    },
    {
      suffix: "Foundations III",
      description:
        "Given an integer array, print the number of distinct values.",
      input:
        "First line contains an integer n.\nSecond line contains n space-separated integers.",
      output: "Print a single integer: count of distinct numbers.",
      constraints: "1 <= n <= 10^5\n-10^9 <= a[i] <= 10^9",
      examples: "Input:\n6\n1 2 2 3 3 3\nOutput:\n3",
      testCases: [
        { input: "6\n1 2 2 3 3 3", expectedOutput: "3" },
        { input: "5\n10 20 30 40 50", expectedOutput: "5" },
        { input: "4\n7 7 7 7", expectedOutput: "1" }
      ]
    }
  ],
  medium: [
    {
      suffix: "Pattern Drill I",
      description:
        "Given an array and multiple range queries [l, r] (1-indexed), print sum of elements in each range.",
      input:
        "First line: n q.\nSecond line: n space-separated integers.\nNext q lines: l r.",
      output: "For each query, print the range sum on a new line.",
      constraints: "1 <= n, q <= 2*10^5\n-10^9 <= a[i] <= 10^9",
      examples: "Input:\n5 3\n1 2 3 4 5\n1 3\n2 5\n4 4\nOutput:\n6\n14\n4",
      testCases: [
        { input: "5 3\n1 2 3 4 5\n1 3\n2 5\n4 4", expectedOutput: "6\n14\n4" },
        { input: "4 2\n5 5 5 5\n1 4\n2 3", expectedOutput: "20\n10" },
        { input: "3 1\n-2 8 1\n1 2", expectedOutput: "6" }
      ]
    },
    {
      suffix: "Pattern Drill II",
      description:
        "Rotate the array to the right by k positions and print the resulting array.",
      input:
        "First line: n k.\nSecond line: n space-separated integers.",
      output: "Print the rotated array as space-separated integers.",
      constraints: "1 <= n <= 2*10^5\n0 <= k <= 10^9",
      examples: "Input:\n5 2\n1 2 3 4 5\nOutput:\n4 5 1 2 3",
      testCases: [
        { input: "5 2\n1 2 3 4 5", expectedOutput: "4 5 1 2 3" },
        { input: "4 4\n9 8 7 6", expectedOutput: "9 8 7 6" },
        { input: "6 1\n10 20 30 40 50 60", expectedOutput: "60 10 20 30 40 50" }
      ]
    },
    {
      suffix: "Pattern Drill III",
      description:
        "Given an array, print the length of the longest non-decreasing contiguous subarray.",
      input:
        "First line contains n.\nSecond line contains n space-separated integers.",
      output: "Print one integer: maximum length.",
      constraints: "1 <= n <= 2*10^5\n-10^9 <= a[i] <= 10^9",
      examples: "Input:\n7\n1 2 2 1 3 4 5\nOutput:\n4",
      testCases: [
        { input: "7\n1 2 2 1 3 4 5", expectedOutput: "4" },
        { input: "5\n5 4 3 2 1", expectedOutput: "1" },
        { input: "6\n2 2 2 2 2 2", expectedOutput: "6" }
      ]
    }
  ],
  hard: [
    {
      suffix: "Advanced Set I",
      description:
        "Given an integer array, print the maximum possible subarray sum.",
      input:
        "First line contains n.\nSecond line contains n space-separated integers.",
      output: "Print one integer: maximum subarray sum.",
      constraints: "1 <= n <= 2*10^5\n-10^9 <= a[i] <= 10^9",
      examples: "Input:\n8\n-2 -3 4 -1 -2 1 5 -3\nOutput:\n7",
      testCases: [
        { input: "8\n-2 -3 4 -1 -2 1 5 -3", expectedOutput: "7" },
        { input: "5\n1 2 3 4 5", expectedOutput: "15" },
        { input: "4\n-5 -2 -3 -1", expectedOutput: "-1" }
      ]
    },
    {
      suffix: "Advanced Set II",
      description:
        "Given an array, find the maximum difference a[j] - a[i] such that j > i.",
      input:
        "First line contains n.\nSecond line contains n space-separated integers.",
      output: "Print one integer: maximum difference.",
      constraints: "2 <= n <= 2*10^5\n-10^9 <= a[i] <= 10^9",
      examples: "Input:\n6\n7 1 5 3 6 4\nOutput:\n5",
      testCases: [
        { input: "6\n7 1 5 3 6 4", expectedOutput: "5" },
        { input: "5\n9 8 7 6 5", expectedOutput: "-1" },
        { input: "5\n1 2 3 4 10", expectedOutput: "9" }
      ]
    },
    {
      suffix: "Advanced Set III",
      description:
        "Given an array, print the total amount of trapped rain water.",
      input:
        "First line contains n.\nSecond line contains n non-negative integers.",
      output: "Print one integer: trapped water.",
      constraints: "1 <= n <= 2*10^5\n0 <= h[i] <= 10^9",
      examples: "Input:\n12\n0 1 0 2 1 0 1 3 2 1 2 1\nOutput:\n6",
      testCases: [
        { input: "12\n0 1 0 2 1 0 1 3 2 1 2 1", expectedOutput: "6" },
        { input: "4\n3 0 2 0", expectedOutput: "2" },
        { input: "5\n1 1 1 1 1", expectedOutput: "0" }
      ]
    }
  ]
};

const buildAutoProblem = (topicName, difficulty, index) => {
  const templates = AUTO_TEMPLATES[difficulty] || AUTO_TEMPLATES.easy;
  const template = templates[(index - 1) % templates.length];

  return {
    topicName,
    difficulty,
    title: `${topicName} ${template.suffix} ${index}`,
    description: `${template.description} This version is from ${topicName}.`,
    input: template.input,
    output: template.output,
    constraints: template.constraints,
    examples: template.examples,
    testCases: template.testCases
  };
};

const seedCoreProblems = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const topics = await Topic.find({}, "name").lean();
    const topicMap = new Map(topics.map((topic) => [topic.name, topic._id]));

    let upserted = 0;
    let skipped = 0;
    let autoGenerated = 0;

    for (const problem of CORE_PROBLEMS) {
      const topicId = topicMap.get(problem.topicName);

      if (!topicId) {
        console.warn(`Skipping '${problem.title}' because topic '${problem.topicName}' was not found.`);
        skipped += 1;
        continue;
      }

      await CoreProblem.findOneAndUpdate(
        {
          title: problem.title,
          topic: topicId,
          difficulty: problem.difficulty
        },
        {
          $set: {
            title: problem.title,
            topic: topicId,
            difficulty: problem.difficulty,
            description: problem.description,
            input: problem.input,
            output: problem.output,
            constraints: problem.constraints,
            examples: problem.examples,
            starterCode: STARTER_CODE,
            testCases: problem.testCases,
            createdBy: "admin",
            isPublished: true
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      upserted += 1;
    }

    for (const topic of topics) {
      for (const difficulty of BUCKET_DIFFICULTIES) {
        const existingCount = await CoreProblem.countDocuments({
          topic: topic._id,
          difficulty,
          isPublished: true
        });

        if (existingCount >= MIN_PROBLEMS_PER_BUCKET) continue;

        const needed = MIN_PROBLEMS_PER_BUCKET - existingCount;

        for (let index = 1; index <= needed; index += 1) {
          const generated = buildAutoProblem(topic.name, difficulty, existingCount + index);

          await CoreProblem.findOneAndUpdate(
            {
              title: generated.title,
              topic: topic._id,
              difficulty: generated.difficulty
            },
            {
              $set: {
                title: generated.title,
                topic: topic._id,
                difficulty: generated.difficulty,
                description: generated.description,
                input: generated.input,
                output: generated.output,
                constraints: generated.constraints,
                examples: generated.examples,
                starterCode: STARTER_CODE,
                testCases: generated.testCases,
                createdBy: "admin",
                isPublished: true
              }
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true
            }
          );

          autoGenerated += 1;
        }
      }
    }

    const publishedCount = await CoreProblem.countDocuments({ isPublished: true });

    console.log(`Core seeding done. Upserted: ${upserted}, Skipped: ${skipped}, Auto-generated: ${autoGenerated}`);
    console.log(`Published core problems available: ${publishedCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed core problems:", err.message);
    process.exit(1);
  }
};

seedCoreProblems();
