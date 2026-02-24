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

/* ---------------- PARSER ---------------- */
const parse = (t = "") => {
  t = t.toLowerCase();
  if (t.includes("n^2") || t.includes("n²")) return "O(n²)";
  if (t.includes("n log n")) return "O(n log n)";
  if (t.includes("log n")) return "O(log n)";
  if (t.includes("1")) return "O(1)";
  return "O(n)";
};

/* ---------------- CURVES ---------------- */
const curves = (n) => ({
  "O(1)": n.map(() => 1),
  "O(log n)": n.map(x => Math.log2(x + 1)),
  "O(n)": n.map(x => x),
  "O(n log n)": n.map(x => x * Math.log2(x + 1)),
  "O(n²)": n.map(x => x * x)
});

/* ---------------- COLORS ---------------- */
const COLORS = {
  yours: "#22c55e",
  optimal: "#3b82f6",
  ref: {
    "O(1)": "#94a3b8",
    "O(log n)": "#a78bfa",
    "O(n)": "#60a5fa",
    "O(n log n)": "#f59e0b",
    "O(n²)": "#f87171"
  }
};

/* ---------------- COMPONENT ---------------- */
const ComplexityChart = ({
  label,
  yourComplexity,
  optimalComplexity
}) => {
  const your = parse(yourComplexity);
  const optimal = parse(optimalComplexity || yourComplexity);

  const labels = Array.from({ length: 14 }, (_, i) => i + 1);
  const allCurves = curves(labels);

  const datasets = [];

  /* -------- Reference Curves (NO animation) -------- */
  Object.entries(allCurves).forEach(([name, data]) => {
    datasets.push({
      label: name,
      data,
      borderColor: COLORS.ref[name],
      borderDash: [6, 4],
      borderWidth: 1.2,
      pointRadius: 0,
      tension: 0.35,
      animations: false // no animation
    });
  });

  /* -------- Optimal (BLUE – animated) -------- */
  datasets.push({
    label: `${optimal} (Optimal)`,
    data: allCurves[optimal],
    borderColor: COLORS.optimal,
    borderWidth: 3,
    pointRadius: 2,
    tension: 0.35,
    animations: {
      x: {
        type: "number",
        easing: "easeOutCubic",
        duration: 1200,
        from: NaN
      },
      y: {
        easing: "easeOutCubic",
        duration: 1200
      }
    }
  });

  /* -------- Your Solution (GREEN – animated) -------- */
  datasets.push({
    label: `${your} (Your Solution)`,
    data: allCurves[your],
    borderColor: COLORS.yours,
    borderWidth: 3,
    pointRadius: 3,
    tension: 0.35,
    animations: {
      x: {
        type: "number",
        easing: "easeOutQuart",
        duration: 1400,
        from: NaN
      },
      y: {
        easing: "easeOutQuart",
        duration: 1400
      }
    }
  });

  return (
    <div className="h-[360px] bg-[#0f172a] p-4 rounded-lg border border-gray-700">
      <div className="text-sm font-semibold text-gray-300 mb-2">
        {label}
      </div>
      <Line
        data={{ labels, datasets }}
        options={{
          responsive: true,
          animation: false, // global animation OFF
          plugins: {
            legend: {
              labels: {
                color: "#e5e7eb",
                font: { size: 11 }
              }
            },
            tooltip: {
              mode: "index",
              intersect: false
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Input Size (n)",
                color: "#9ca3af"
              },
              ticks: { color: "#9ca3af" }
            },
            y: {
              title: {
                display: true,
                text: "Operations",
                color: "#9ca3af"
              },
              ticks: { color: "#9ca3af" }
            }
          }
        }}
      />
    </div>
  );
};

export default ComplexityChart;
