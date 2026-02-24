import { useLocation, useNavigate } from "react-router-dom";
import ComplexityChart from "../components/ComplexityChart";

/* ---------------- THEORY PANEL ---------------- */
const ComplexityTheory = ({ analysis }) => {
  const {
    timeComplexity,
    spaceComplexity,
    optimalTimeComplexity,
    optimalSpaceComplexity
  } = analysis;

  return (
    <div className="space-y-6 text-sm text-gray-800">
      <h2 className="text-lg font-semibold text-gray-900">
        Complexity Breakdown
      </h2>

      {/* Time Complexity */}
      <div>
        <p className="font-medium text-blue-600">
          Time Complexity — {timeComplexity}
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Describes how runtime grows with input size</li>
          <li>
            Optimal approach runs in{" "}
            <span className="text-green-600 font-medium">
              {optimalTimeComplexity || timeComplexity}
            </span>
          </li>
          <li>Look for unnecessary loops or repeated work</li>
        </ul>
      </div>

      {/* Space Complexity */}
      <div>
        <p className="font-medium text-purple-600">
          Space Complexity — {spaceComplexity}
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Measures extra memory usage</li>
          <li>
            Optimal solution uses{" "}
            <span className="text-green-600 font-medium">
              {optimalSpaceComplexity || spaceComplexity}
            </span>
          </li>
          <li>In-place solutions are preferred in interviews</li>
        </ul>
      </div>

      {/* Interview Tip */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-gray-600">
        <b>Interview Tip:</b> Always explain <i>why</i> your solution is
        optimal, not just the Big-O.
      </div>
    </div>
  );
};

/* ---------------- MAIN PAGE ---------------- */
const ComplexityPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!state?.analysis) {
    return (
      <div className="h-screen flex items-center justify-center bg-white text-gray-600">
        No analysis data found
      </div>
    );
  }

  const analysis = state.analysis;

  return (
    <div className="min-h-screen bg-white text-gray-900 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">
          Complexity Analysis
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          ← Back
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: THEORY */}
        <div className="col-span-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <ComplexityTheory analysis={analysis} />
        </div>

        {/* RIGHT: CHARTS */}
        <div className="col-span-8 space-y-8">
          <ComplexityChart
            label="Time Complexity (Optimal vs Yours)"
            yourComplexity={analysis.timeComplexity}
            optimalComplexity={analysis.optimalTimeComplexity}
          />

          <ComplexityChart
            label="Space Complexity (Optimal vs Yours)"
            yourComplexity={analysis.spaceComplexity}
            optimalComplexity={analysis.optimalSpaceComplexity}
          />
        </div>
      </div>
    </div>
  );
};

export default ComplexityPage;
