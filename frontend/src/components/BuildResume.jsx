import { useEffect, useState } from 'react'
import axios from 'axios'

import ClassicATS from './ui/ClassicATS'
import SingleColumnATS from './ui/SingleColumnATS'
import AcademicSingleColumnATS from './ui/AcademicSingleColumnATS'
import LoadingWave from './ui/LoadingWave'

const API = import.meta.env.VITE_API_BASE_URL


const BuildResume = () => {
    const [file, setFile] = useState(null)
    const [resume, setResume] = useState(null)
    const [loading, setLoading] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState('')

    /* ---------------- Upload ---------------- */
    const handleUpload = async () => {
        if (!file) return

        const formData = new FormData()
        formData.append('resume', file)
        formData.append('userId', localStorage.getItem('userUid'))

        try {
            setLoading(true)
            const res = await axios.post(`${API}/buildResume`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setResume(res.data.resume)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const templates = [
        { id: 'classic', title: 'Classic ATS' },
        { id: 'single', title: 'Single Column ATS' },
        { id: 'academic', title: 'Academic Single Column ATS' }
    ]

    const normalizeResume = (resume) => {
        const text = resume.extractedText || ''
        const lines = text
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean)

        const SECTION_ALIASES = {
            summary: ['SUMMARY', 'OBJECTIVE', 'PROFESSIONAL SUMMARY'],
            experience: ['EXPERIENCE', 'WORK EXPERIENCE'],
            skills: ['SKILLS', 'TECHNICAL SKILLS'],
            projects: ['PROJECTS'],
            education: ['EDUCATION'],
            certifications: ['CERTIFICATIONS'],
            achievements: ['ACHIEVEMENTS', 'AWARDS']
        }

        const findSectionIndex = (titles) =>
            lines.findIndex(l => titles.includes(l.toUpperCase()))

        const sliceByTitles = (startTitles, endSectionKeys = []) => {
            const startIdx = findSectionIndex(startTitles)
            if (startIdx === -1) return []

            let endIdx = lines.length
            for (const key of endSectionKeys) {
                const idx = findSectionIndex(SECTION_ALIASES[key] || [])
                if (idx !== -1 && idx > startIdx) {
                    endIdx = Math.min(endIdx, idx)
                }
            }

            return lines.slice(startIdx + 1, endIdx)
        }

        const name = lines[0] || ''

        /* -------- Section Extraction -------- */
        const summaryLines = sliceByTitles(
            SECTION_ALIASES.summary,
            ['experience', 'skills', 'projects', 'education']
        )

        const experienceLines = sliceByTitles(
            SECTION_ALIASES.experience,
            ['projects', 'education', 'skills']
        )

        const projectLines = sliceByTitles(
            SECTION_ALIASES.projects,
            ['education', 'skills']
        )

        const educationLines = sliceByTitles(
            SECTION_ALIASES.education,
            ['skills']
        )

        const skillLines = sliceByTitles(
            SECTION_ALIASES.skills
        )

        const certificationLines = sliceByTitles(
            SECTION_ALIASES.certifications
        )

        const achievementLines = sliceByTitles(
            SECTION_ALIASES.achievements
        )

        /* -------- Parsers -------- */
        const parseExperience = (lines) => {
            const items = []
            let current = null

            for (const line of lines) {
                if (!line.startsWith('•') && !line.includes('—') && !line.includes('-')) {
                    if (current) items.push(current)
                    current = { org: line, role: '', date: '', points: [] }
                } else if (line.startsWith('•')) {
                    current?.points.push(line.replace('•', '').trim())
                } else if (!current.role) {
                    current.role = line
                } else if (!current.date) {
                    current.date = line
                }
            }

            if (current) items.push(current)
            return items
        }

        const parseProjects = (lines) => {
            const items = []
            let current = null

            for (const line of lines) {
                if (!line.startsWith('•')) {
                    if (current) items.push(current)
                    current = { title: line, points: [] }
                } else {
                    current?.points.push(line.replace('•', '').trim())
                }
            }

            if (current) items.push(current)
            return items
        }

        const parseEducation = (lines) => {
            const items = []
            let current = null

            for (const line of lines) {
                if (!line.startsWith('•')) {
                    if (current) items.push(current)
                    current = { institution: line, degree: '', date: '', location: '' }
                } else if (line.toLowerCase().includes('bachelor') || line.toLowerCase().includes('master')) {
                    current.degree = line.replace('•', '').trim()
                }
            }

            if (current) items.push(current)
            return items
        }

        const parseSkills = (lines) => {
            const skills = {}

            for (const line of lines) {
                if (line.toLowerCase().startsWith('languages')) {
                    skills.languages = line.split(':')[1]?.split(',').map(s => s.trim())
                }
                if (line.toLowerCase().startsWith('tools')) {
                    skills.tools = line.split(':')[1]?.split(',').map(s => s.trim())
                }
            }

            return skills
        }

        const parseSimpleList = (lines) =>
            lines.map(l => l.replace('•', '').trim())

        /* -------- Final Normalized Output -------- */
        return {
            name,
            summary: summaryLines.join(' '),
            experience: parseExperience(experienceLines),
            projects: parseProjects(projectLines),
            education: parseEducation(educationLines),
            skills: parseSkills(skillLines),
            certifications: parseSimpleList(certificationLines),
            achievements: parseSimpleList(achievementLines),
            links: {},
            coursework: null,
            hobbies: [],
            lastUpdated: new Date(resume.createdAt).toLocaleDateString()
        }
    }

    const handlePrint = () => {
        window.print()
    }


    const renderTemplate = () => {
        if (!resume || !selectedTemplate) return null
        const data = normalizeResume(resume)

        if (selectedTemplate === 'classic') return <ClassicATS data={data} />
        if (selectedTemplate === 'single') return <SingleColumnATS data={data} />
        if (selectedTemplate === 'academic') return <AcademicSingleColumnATS data={data} />

        return null
    }


    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingWave />
            </div>
        )
    }

    return (
        <div className="min-h-screen p-8 bg-[#f8fafc] space-y-10 flex justify-center">

            {/* STEP 1 — Upload Resume */}
            {!resume && (
                <section className="max-w-xl bg-white border rounded-xl p-8">
                    <h1 className="text-2xl font-semibold mb-4">
                        Upload Resume
                    </h1>

                    <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setFile(e.target.files[0])}

                        className="hidden"
                        id="resumeUpload"
                    />

                    <label
                        htmlFor="resumeUpload"
                        className="border-2 border-dashed rounded-lg p-8 block text-center cursor-pointer"
                    >
                        {file ? file.name : 'Click to upload resume'}
                    </label>

                    <button
                        onClick={handleUpload}
                        disabled={!file}
                        className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                    >
                        Upload & Build Resume
                    </button>
                </section>
            )}

            {/* STEP 2 — Template Selection */}
            {resume && (
                <section>
                    <h2 className="text-xl font-semibold mb-4">
                        Choose a Template
                    </h2>

                    <div className="flex gap-4">
                        {[
                            { id: 'classic', label: 'Classic ATS' },
                            { id: 'single', label: 'Single Column ATS' },
                            { id: 'academic', label: 'Academic ATS' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplate(t.id)}
                                className={`px-5 py-3 rounded-lg border
                  ${selectedTemplate === t.id
                                        ? 'border-black bg-white'
                                        : 'border-gray-300 bg-gray-50'}
                `}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* STEP 3 — Render Template */}
            {resume && selectedTemplate && (
                <section className="mt-10">
                    {renderTemplate()}
                </section>
            )}

            {resume && selectedTemplate && (
                <section className="mt-10">
                    <div className="flex justify-center mb-4">
                        <button
                            onClick={handlePrint}
                            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Download PDF
                        </button>
                    </div>
                </section>
            )}

        </div>
    )
}

export default BuildResume
