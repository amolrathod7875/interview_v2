import { Github } from "lucide-react";
import { Link } from "react-router-dom";

const GithubConnectedCard = ({ github }) => {
  if (!github?.connected) {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="font-semibold mb-2">GitHub</h3>
        <p className="text-sm text-gray-500 mb-3">
          No GitHub repository connected
        </p>
        <Link
          to="/github-repos"
          className="text-blue-600 text-sm font-medium"
        >
          Connect GitHub →
        </Link>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white flex items-start gap-3">
      <Github className="text-black mt-1" size={20} />

      <div>
        <h3 className="font-semibold">GitHub Connected</h3>
        <p className="text-sm text-gray-700 mt-1">
          {github.owner}/{github.repo}
        </p>

        <Link
          to="/github-repos"
          className="text-xs text-blue-600 mt-2 inline-block"
        >
          Change repository
        </Link>
      </div>
    </div>
  );
};

export default GithubConnectedCard;
