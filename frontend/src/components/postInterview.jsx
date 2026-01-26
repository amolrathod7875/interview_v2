import axios from "axios"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import ScoreCircle from "./ui/scoreCircle"
import { Button } from "./ui/button"
import LoadingWave from "./ui/LoadingWave"

const API = import.meta.env.VITE_API_BASE_URL

const PostInterview = () => {
  const { state } = useLocation()
  const interviewId = state?.interviewId

  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchResult = async () => {
      try {
        await axios
          .get(`${API}/results/getByInterviewId/${interviewId}`)
          .then(res => setResult(res.data.data))
          .catch(async () => {
            await axios
              .get(`${API}/results/generateAfterFailure/${interviewId}`)
              .then(res => setResult(res.data.data))
              .catch(e => setError(e?.response?.data?.message || "Unable to generate results"))
          })
      } catch (e) {
        console.error(e)
        setError("Unexpected error occurred")
      }
    }

    if (interviewId) fetchResult()
  }, [interviewId])

  if (!result && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] gap-4">
        <LoadingWave />
        <p className="text-gray-600 text-sm">Generating interview results...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8fafc] px-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-lg text-center shadow-sm">
          <p className="text-gray-700 mb-6">
            We are unable to process your request at the moment.
            You may try opening the most recently completed interview from the dashboard to regenerate results.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 md:px-8 py-10">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-8">

        {/* Score */}
        <div className="flex justify-center">
          <ScoreCircle score={result.score} size={160} />
        </div>

        {/* Overall Assessment */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Overall Assessment
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {result.overallAssessment}
          </p>
        </div>

        {/* Improvements */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Areas for Improvement
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            {result.improvements?.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Action */}
        <div className="pt-4">
          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

      </div>
    </div>
  )
}

export default PostInterview
