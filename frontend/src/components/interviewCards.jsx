import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { TabStore } from '@/store/tabStore'
import { useNavigate, useLocation } from 'react-router-dom'
import LoadingWave from './ui/LoadingWave'

const API = import.meta.env.VITE_API_BASE_URL

const InterviewCards = () => {
  const { state } = useLocation()
  const [data, setData] = useState([])
  const [loading, setIsLoading] = useState(true)

  const navigate = useNavigate()
  const trigger = TabStore(s => s.trigger)

  useEffect(() => {
    const func = async () => {
      try {
        const res = await axios.get(
          `${API}/interview/getAll/${localStorage.getItem("userUid")}`
        )
        setData(res.data.data)
        setIsLoading(false)
      } catch (e) {
        console.error(e)
      }
    }
    func()
  }, [trigger])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8fafc]">
        <LoadingWave />
      </div>
    )
  }

  const incompleteInterviews = data.filter(item => !item.isCompleted)

  return (
    <div className="min-h-screen bg-gray-100 px-4 md:px-8 py-10">
      <div className="mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
            Incomplete Interviews
          </h1>
          <p className="text-gray-500 text-center">
            Continue interviews that are not yet completed
          </p>
        </div>

        {/* Cards */}
        {incompleteInterviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incompleteInterviews.map(item => (
              <div
                key={item._id}
                onClick={() =>
                  navigate('/ai-interview', {
                    state: { interviewId: item._id }
                  })
                }
                className="bg-white border border-gray-200 rounded-2xl p-6
                shadow-sm hover:shadow-md transition cursor-pointer flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 flex items-center justify-center
                    rounded-lg bg-blue-100 text-blue-700 font-semibold text-lg">
                    {item.topic?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate capitalize">
                      {item.topic}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Experience: {item.experience} year{item.experience > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {item.skills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs rounded-md
                      bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {skill}
                    </span>
                  ))}
                  {item.skills.length > 3 && (
                    <span className="px-2 py-1 text-xs rounded-md
                      bg-gray-50 text-gray-500 border border-gray-200">
                      +{item.skills.length - 3} more
                    </span>
                  )}
                </div>

                {/* Action */}
                <button
                  className="mt-auto w-full py-2 rounded-lg
                  bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
                >
                  Continue Interview
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-500 text-lg mb-6 text-center">
              No incomplete interviews available.
            </p>
            <button
              onClick={() => navigate('/ai-interview-form')}
              className="px-8 py-3 rounded-lg
              bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
            >
              Start New Interview
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default InterviewCards
