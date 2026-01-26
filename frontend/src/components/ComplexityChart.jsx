import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const getComplexityType = (text) => {
  const t = text.toLowerCase();
  if (t.includes("o(n^2)") || t.includes("o(n²)")) return "O(n²)";
  if (t.includes("o(n log n)")) return "O(n log n)";
  if (t.includes("o(n)")) return "O(n)";
  if (t.includes("o(log n)")) return "O(log n)";
  return "O(n)";
};

const ComplexityChart = ({ analysis }) => {
  const complexity = getComplexityType(analysis);

  const labels = [1, 2, 3, 4, 5];

  const curves = {
    "O(log n)": labels.map(x => Math.log(x + 1)),
    "O(n)": labels.map(x => x),
    "O(n log n)": labels.map(x => x * Math.log(x + 1)),
    "O(n²)": labels.map(x => x * x)
  };

  const data = {
    labels,
    datasets: [
      {
        label: complexity,
        data: curves[complexity],
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.2)",
        tension: 0.4
      }
    ]
  };

  return <Line data={data} />;
};

export default ComplexityChart;
