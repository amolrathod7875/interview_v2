import GithubRepoSelector from "../components/GithubRepoSelector";

const GithubRepos = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              GitHub Repository Analysis
            </h1>
            <p className="text-gray-600">
              Select a repository to analyze your code quality, dependencies, and get AI-powered insights
            </p>
          </div>
          <GithubRepoSelector />
        </div>
      </div>
    </div>
  );
};

export default GithubRepos;
