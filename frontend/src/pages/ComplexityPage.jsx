import { useLocation, useNavigate } from "react-router-dom";
import ComplexityChart from "../components/ComplexityChart";

const ComplexityPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!state?.analysis) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f172a] text-gray-300">
        No analysis data found
      </div>
    );
  }

  const { timeComplexity, spaceComplexity } = state.analysis;

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-200 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">
          Complexity Analysis
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        >
          ← Back
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-8">
        <ComplexityChart
          label="Time Complexity Growth"
          complexity={timeComplexity}
        />

        <ComplexityChart
          label="Space Complexity Growth"
          complexity={spaceComplexity}
        />
      </div>
    </div>
  );
};

export default ComplexityPage;
