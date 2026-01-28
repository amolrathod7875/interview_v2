const GithubLoginButton = () => {
  const loginWithGithub = () => {
    window.location.href = "http://localhost:5000/auth/github";
  };

  return (
    <button
      onClick={loginWithGithub}
      className="px-4 py-2 bg-black text-white rounded"
    >
      Login with GitHub
    </button>
  );
};

export default GithubLoginButton;
