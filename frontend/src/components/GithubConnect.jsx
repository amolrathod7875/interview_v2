import { FaGithub } from "react-icons/fa"

const API = import.meta.env.VITE_API_BASE_URL

export default function GithubConnect() {
  const connectGithub = () => {
    window.location.href = `${API}/auth/github`
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
      <p className="text-sm text-gray-500 mb-3">
        Connect your GitHub account to select repositories for interviews.
      </p>

      <button
        onClick={connectGithub}
        className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-900"
      >
        <FaGithub />
        Connect GitHub
      </button>
    </div>
  )
}
