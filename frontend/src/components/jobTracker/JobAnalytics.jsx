import { useEffect, useState } from "react";
import { fetchJobs } from "@/services/jobService";
import { useAuth } from "@/contexts/authContext";

const StatCard = ({ label, value, color }) => (
  <div className="bg-white p-4 rounded-xl border shadow-sm">
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`text-2xl font-semibold ${color}`}>{value}</p>
  </div>
);

const JobAnalytics = () => {
  const { user } = useAuth();
  const userId = user?.uid || "demo-user";

  const [stats, setStats] = useState({
    total: 0,
    Applied: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0,
  });

  useEffect(() => {
    const load = async () => {
      const jobs = await fetchJobs(userId);

      const counts = {
        total: jobs.length,
        Applied: 0,
        Interview: 0,
        Offer: 0,
        Rejected: 0,
      };

      jobs.forEach(job => {
        counts[job.status]++;
      });

      setStats(counts);
    };

    load();
  }, []);

  const interviewRate =
    stats.total > 0
      ? Math.round((stats.Interview / stats.total) * 100)
      : 0;

  const offerRate =
    stats.Interview > 0
      ? Math.round((stats.Offer / stats.Interview) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Job Analytics</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total" value={stats.total} color="text-gray-800" />
        <StatCard label="Applied" value={stats.Applied} color="text-blue-600" />
        <StatCard label="Interview" value={stats.Interview} color="text-yellow-600" />
        <StatCard label="Offer" value={stats.Offer} color="text-green-600" />
        <StatCard label="Rejected" value={stats.Rejected} color="text-red-600" />
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <p className="text-sm text-gray-500">Conversion Funnel</p>
        <p className="mt-2 text-sm">
          Interview Rate: <b>{interviewRate}%</b>
        </p>
        <p className="text-sm">
          Offer Rate: <b>{offerRate}%</b>
        </p>
      </div>
    </div>
  );
};

export default JobAnalytics;
