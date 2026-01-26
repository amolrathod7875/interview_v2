import axios from "axios"
import { useEffect, useState } from "react"
import { FaPencilAlt } from "react-icons/fa"
import LoadingWave from "./ui/LoadingWave"
import LinkedinButton from "./ui/LinkedinButton"
import GithubButton from "./ui/GithubButton"
import LeetcodeButton from "./ui/LeetcodeButton"
import EmailButton from "./ui/EmailButton"



const API = import.meta.env.VITE_API_BASE_URL

const Profile = () => {
    const [user, setUser] = useState(null)
    const [editMode, setEditMode] = useState(false)
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({
        name: "",
        email: "",
        dob: "",
        linkedin: "",
        github: "",
        leetcode: ""
    })

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(
                    `${API}/user/get/${localStorage.getItem("userUid")}`
                )
                setUser(res.data.data)
                setForm({
                    name: res.data.data.name || "",
                    email: res.data.data.email || "",
                    dob: res.data.data.dob || "",
                    linkedin: res.data.data.linkedin || "",
                    github: res.data.data.github || "",
                    leetcode: res.data.data.leetcode || ""
                })
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [])

    const handleSave = async () => {
        await axios.put(`${API}/user/update`, {
            userId: localStorage.getItem("userUid"),
            name: form.name,
            dob: form.dob,
            linkedin: form.linkedin,
            github: form.github,
            leetcode: form.leetcode
        })
        setUser({ ...user, ...form })
        setEditMode(false)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] gap-4">
                <LoadingWave />
                <p className="text-gray-600 text-sm">Loading profile...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] px-4 md:px-8 py-10">
            <div className="max-w-xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Profile
                    </h1>
                    <p className="text-gray-500">
                        Manage your account information
                    </p>
                </div>

                {/* Profile Card */}
                {user && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Your Details
                            </h2>
                            <button
                                onClick={() => setEditMode(!editMode)}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                            >
                                <FaPencilAlt className="text-gray-600" />
                            </button>
                        </div>

                        {!editMode ? (
                            <div className="space-y-4">
                                <Field label="Name" value={user.name} />
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Email</p>
                                        <p className="text-gray-900 font-medium break-all">
                                            {user.email || "Not added"}
                                        </p>
                                    </div>

                                    <EmailButton
                                        email={user.email}
                                        disabled={!user.email}
                                    />
                                </div>

                                <Field label="Date of Birth" value={user.dob || "-"} />

                                {/* ✅ LinkedIn with Button */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">LinkedIn</p>
                                    <p className="text-gray-900 font-medium break-all">
                                        {user.linkedin || "Not added"}
                                    </p>
                                </div>

                                <LinkedinButton
                                    link={user.linkedin || "https://linkedin.com"}
                                    disabled={!user.linkedin}
                                />
                            </div>


                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">GitHub</p>
                                    <p className="text-gray-900 font-medium break-all">
                                        {user.github || "Not added"}
                                    </p>
                                </div>

                                <GithubButton
                                link={user.github || "https://github.com"}
                                disabled={!user.github}
                                />
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">LeetCode</p>
                                <p className="text-gray-900 font-medium break-all">
                                    {user.leetcode || "Not added"}
                                </p>
                            </div>

                            <LeetcodeButton
                                link={user.leetcode || "https://leetcode.com"}
                                disabled={!user.leetcode}
                            />
                        </div>

                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Input
                                    label="Name"
                                    value={form.name}
                                    onChange={e =>
                                        setForm({ ...form, name: e.target.value })
                                    }
                                />

                                <Input
                                    label="Email"
                                    value={form.email}
                                    disabled
                                />

                                <Input
                                    label="Date of Birth"
                                    type="date"
                                    value={form.dob}
                                    onChange={e =>
                                        setForm({ ...form, dob: e.target.value })
                                    }
                                />

                                <Input
                                    label="LinkedIn"
                                    value={form.linkedin}
                                    onChange={e =>
                                        setForm({ ...form, linkedin: e.target.value })
                                    }
                                />

                                <Input
                                    label="GitHub"
                                    value={form.github}
                                    onChange={e =>
                                        setForm({ ...form, github: e.target.value })
                                    }
                                />

                                <Input
                                    label="LeetCode"
                                    value={form.leetcode}
                                    onChange={e =>
                                        setForm({ ...form, leetcode: e.target.value })
                                    }
                                />

                                <button
                                    onClick={handleSave}
                                    className="w-full mt-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
                                >
                                    Save Changes
                                </button>

                                <button
                                    onClick={() => setEditMode(false)}
                                    className="w-full py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

const Field = ({ label, value }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-gray-900 font-medium break-all">{value}</p>
    </div>
)

const Input = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
        </label>
        <input
            {...props}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
    </div>
)

export default Profile
