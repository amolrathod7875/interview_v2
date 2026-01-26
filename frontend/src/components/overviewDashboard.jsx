import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScoreCircle from './ui/scoreCircle'
import { Spinner } from './ui/spinner'
import { FaChartBar } from 'react-icons/fa6'
import { MdDashboard } from 'react-icons/md'
import { BarChart } from 'lucide-react'
import { Button } from './ui/button'
import LoadingWave from './ui/LoadingWave'

const API = import.meta.env.VITE_API_BASE_URL

const OverviewDashboard = () => {
    const [data, setData] = useState([])
    const [quiz, setQuiz] = useState([])
    const [score, setScore] = useState(0)
    const [loading, setIsLoading] = useState(true);
    const navigate = useNavigate()

    useEffect(() => {
        const func = async () => {
            const resp = await axios.get(`${API}/interview/getInterviewsForDashboard/${localStorage.getItem("userUid")}`)
                .then(res => {
                    setIsLoading(false);
                    // console.log(res)
                    const result = Array.isArray(res.data.data) ? res.data.data : Object.values(res.data.data)
                    setData(result)
                    setScore(Math.round(res.data.avgScore))
                    setQuiz(res.data.quizResp)
                })
        }
        func()
    }, [])


    const getQuizResult = async (quizId, noOfQuestions) => {
        try {
            // console.log(quizId)
            const resp = await axios.get(`${API}/quiz/results/${quizId}`)
            navigate('/quizResult', { state: { score: resp.data.score, noOfQuestions: noOfQuestions } })
        } catch (e) {
            console.log(e.message);
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        },
        hover: {
            y: -8,
            transition: { duration: 0.3 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.4,
                ease: "easeOut"
            }
        },
        hover: {
            x: 4,
            transition: { duration: 0.2 }
        }
    }

    if (loading) {
        return (
            <div className='flex justify-center items-center h-screen'>
                <LoadingWave/>
            </div>
        )
    }
    return (
        <div className="min-h-screen bg-[#f8fafc] px-4 md:px-8 py-9">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-black mb-2">
                        Dashboard
                    </h1>
                    <p className="text-gray-500 text-lg">
                        Track your progress and performance across interviews and quizzes
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-6">
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center  flex-col text-center">
                                <h3 className="text-xl font-semibold text-black mb-1">
                                    Interview Readiness Score
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Overall performance evaluation
                                </p>
                                {data.length === 0 ? (
                                    <p className="text-gray-400 font-medium">
                                        Attempt at least one interview to view score
                                    </p>
                                ) : (
                                    <ScoreCircle score={score} />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">

                            <div
                                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                                onClick={() => navigate("/dashboard", { state: { tab: "Analyse Resume" } })}
                            >
                                <h3 className="text-xl font-semibold text-black mb-2">
                                    Analyse Your Resume
                                </h3>
                                <p className="text-sm text-gray-600 mb-6">
                                    Get AI-powered feedback to improve your chances of getting hired
                                </p>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                                    Start Resume Analysis
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        <h3 className="text-xl font-semibold text-black mb-1">
                            Completed Interviews
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Your finished interviews
                        </p>

                        <div className="space-y-3 overflow-y-auto">
                            {data.filter(d => d.isCompleted).length > 0 ? (
                                data.filter(d => d.isCompleted).map(item => (
                                    <div
                                        key={item._id}
                                        onClick={() =>
                                            navigate("/postInterview", { state: { interviewId: item._id } })
                                        }
                                        className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer"
                                    >
                                        <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-semibold">
                                            {item.topic?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-black truncate">
                                                {item.topic}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Experience: {item.experience} year{item.experience > 1 ? "s" : ""}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                Skills: {item.skills.join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-center mt-8">
                                    No completed interviews yet
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        <h3 className="text-xl font-semibold text-black mb-1">
                            Completed Quizzes
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Your finished quizzes
                        </p>

                        <div className="space-y-3 overflow-y-auto">
                            {quiz.filter(q => q.isCompleted).length > 0 ? (
                                quiz.filter(q => q.isCompleted).map(item => (
                                    <div
                                        key={item._id}
                                        onClick={() => getQuizResult(item._id, item.noOfQuestions)}
                                        className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition cursor-pointer"
                                    >
                                        <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-semibold">
                                            {item.topic?.[0]?.toUpperCase() || "Q"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-black truncate">
                                                {item.topic}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                No of Questions: {item.noOfQuestions}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-center mt-8">
                                    No completed quizzes yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OverviewDashboard
