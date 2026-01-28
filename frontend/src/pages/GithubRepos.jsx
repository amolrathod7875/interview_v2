import GithubLoginButton from "../components/GithubLoginButton";
import GithubRepoSelector from "../components/GithubRepoSelector";

const GithubRepos = () => {
  return (
    <div className="p-6 space-y-6">
      <GithubLoginButton />
      <GithubRepoSelector />
    </div>
  );
};

export default GithubRepos;
