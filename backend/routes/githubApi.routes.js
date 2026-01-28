import express from "express";
import { Octokit } from "@octokit/rest";
import { githubAuth } from "../middlewares/githubAuth.js";

const router = express.Router();

router.get("/repos", githubAuth, async (req, res) => {
  try {
    const octokit = new Octokit({
      auth: req.githubToken,
    });

    // 1️⃣ Fetch ALL user repos (pagination handled)
    const userRepos = await octokit.paginate(
      octokit.repos.listForAuthenticatedUser,
      {
        per_page: 100,
        sort: "updated",
        direction: "desc",
        visibility: "all",
        affiliation: "owner,collaborator,organization_member",
      }
    );

    // 2️⃣ Fetch all organizations user belongs to
    const orgs = await octokit.orgs.listForAuthenticatedUser();

    let orgRepos = [];

    // 3️⃣ Fetch repos for each organization
    for (const org of orgs.data) {
      const repos = await octokit.paginate(
        octokit.repos.listForOrg,
        {
          org: org.login,
          per_page: 100,
        }
      );
      orgRepos.push(...repos);
    }

    // 4️⃣ Merge & deduplicate repos
    const allReposMap = {};

    [...userRepos, ...orgRepos].forEach(repo => {
      allReposMap[repo.id] = {
        id: repo.id,
        name: repo.name,
        owner: repo.owner.login,
        private: repo.private,
        updatedAt: repo.updated_at,
      };
    });

    // 5️⃣ Return as array
    res.json(Object.values(allReposMap));
  } catch (err) {
    console.error("Repo fetch error:", err);
    res.status(500).json({ message: "Failed to fetch GitHub repositories" });
  }
});

export default router;
