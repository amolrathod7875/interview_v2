import axios from "axios"
import { useEffect, useState, useRef } from "react"
import { FaPencilAlt, FaCamera, FaDice, FaCheck, FaTimes } from "react-icons/fa"
import { Sun, Moon, Settings, LogOut } from "lucide-react"
import LoadingWave from "./ui/LoadingWave"
import LinkedinButton from "./ui/LinkedinButton"
import GithubButton from "./ui/GithubButton"
import LeetcodeButton from "./ui/LeetcodeButton"
import EmailButton from "./ui/EmailButton"
import EmptyState from "./ui/EmptyState"
import { UserRoundX, CheckCircle, AlertCircle } from "lucide-react"

const API = import.meta.env.VITE_API_BASE_URL

const Profile = () => {
  const [user, setUser] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showAvatarOptions, setShowAvatarOptions] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [savingField, setSavingField] = useState(null)
  const fileInputRef = useRef(null)
  const menuRef = useRef(null)

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    const fields = [
      user?.name,
      user?.email,
      user?.dob,
      user?.linkedin,
      user?.github,
      user?.leetcode,
      user?.photoURL
    ]
    const completed = fields.filter(f => f && f.toString().trim() !== '').length
    return Math.round((completed / fields.length) * 100)
  }

  const profileCompletion = user ? calculateProfileCompletion() : 0
  const getCompletionColor = () => {
    if (profileCompletion >= 80) return 'bg-green-500'
    if (profileCompletion >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const [form, setForm] = useState({
    name: "",
    email: "",
    dob: "",
    linkedin: "",
    github: "",
    leetcode: "",
    photoURL: "",
  })

  const firebaseId = localStorage.getItem("userUid")

  // ---------------- FETCH PROFILE ----------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API}/user/me`, {
          params: { firebaseId },
        })

        const data = res.data.data
        setUser(data)

        setForm({
          name: data.name || "",
          email: data.email || "",
          dob: data.dob || "",
          linkedin: data.linkedin || "",
          github: "",
          leetcode: data.leetcode || "",
          photoURL: data.photoURL || "",
        })
      } catch (err) {
        console.error("Profile fetch failed:", err)
      } finally {
        setLoading(false)
      }
    }

    if (firebaseId) fetchUser()
    else setLoading(false)
  }, [firebaseId])

  // ---------------- SAVE PROFILE ----------------
  const handleSave = async () => {
    try {
      const res = await axios.put(`${API}/user/update`, {
        firebaseId,
        name: form.name,
        dob: form.dob,
        linkedin: form.linkedin,
        github: form.github,
        leetcode: form.leetcode,
        photoURL: form.photoURL,
      })

      setUser(res.data.data)
      setEditMode(false)
    } catch (err) {
      console.error("Profile update failed:", err)
    }
  }

  // Inline field save
  const handleInlineSave = async (field) => {
    try {
      setSavingField(field)
      const res = await axios.put(`${API}/user/update`, {
        firebaseId,
        [field]: form[field],
      })
      setUser(res.data.data)
      setEditingField(null)
    } catch (err) {
      console.error("Field update failed:", err)
    } finally {
      setSavingField(null)
    }
  }

  // ---------------- UPLOAD PROFILE PICTURE ----------------
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB")
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file")
      return
    }

    try {
      setUploadingAvatar(true)
      
      // Convert image to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result
        
        setForm({ ...form, photoURL: base64String })
        
        // Auto-save after upload
        await axios.put(`${API}/user/update`, {
          firebaseId,
          photoURL: base64String,
        })
        
        setUser({ ...user, photoURL: base64String })
        setShowAvatarOptions(false)
        setUploadingAvatar(false)
      }
      
      reader.onerror = () => {
        console.error("File reading failed")
        alert("Failed to read file. Please try again.")
        setUploadingAvatar(false)
      }
      
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Avatar upload failed:", err)
      alert("Failed to upload avatar. Please try again.")
      setUploadingAvatar(false)
    }
  }

  // ---------------- GENERATE AI AVATAR ----------------
  const generateAIAvatar = async () => {
    try {
      setUploadingAvatar(true)
      
      // DiceBear API with random style
      const styles = ["avataaars", "bottts", "personas", "lorelei", "notionists", "adventurer"]
      const randomStyle = styles[Math.floor(Math.random() * styles.length)]
      const seed = user.name || user.email || Date.now()
      const avatarUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`
      
      setForm({ ...form, photoURL: avatarUrl })
      
      // Auto-save after generation
      await axios.put(`${API}/user/update`, {
        firebaseId,
        photoURL: avatarUrl,
      })
      
      setUser({ ...user, photoURL: avatarUrl })
      setShowAvatarOptions(false)
    } catch (err) {
      console.error("Avatar generation failed:", err)
      alert("Failed to generate avatar. Please try again.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] gap-4">
        <LoadingWave />
        <p className="text-gray-600 text-sm">Loading profile...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] px-4 md:px-8 py-10">
        <div className="max-w-xl mx-auto">
          <EmptyState
            icon={UserRoundX}
            title="No profile found"
            description="We couldn't find your profile details yet. Try refreshing or sign in again to sync your account."
          />
        </div>
      </div>
    )
  }

  // -------- NORMALIZE GITHUB --------
  const githubText =
    typeof user.github === "object" && user.github?.owner && user.github?.repo
      ? `${user.github.owner}/${user.github.repo}`
      : user.github || null

  const githubLink =
    typeof user.github === "object" && user.github?.owner && user.github?.repo
      ? `https://github.com/${user.github.owner}/${user.github.repo}`
      : user.github || "https://github.com"

  return (
    <div className="min-h-screen bg-slate-50 px-4 md:px-8 py-10">
      <div className="max-w-xl mx-auto space-y-8">

        {/* Header with Profile Completion */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Profile
          </h1>
          <p className="text-slate-500">
            Manage your account information
          </p>
          
          {/* Profile Completion Bar */}
          <div className="mt-4 max-w-xs mx-auto">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-600">Profile Completion</span>
              <span className={`text-xs font-bold ${profileCompletion >= 80 ? 'text-green-600' : profileCompletion >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {profileCompletion}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getCompletionColor()}`}
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-card transition-colors">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-slate-100">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
                )}
              </div>
              
              <button
                onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FaCamera className="text-sm" />
                )}
              </button>
            </div>

            {/* Avatar Options Popup */}
            {showAvatarOptions && !uploadingAvatar && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 w-full max-w-xs">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
                >
                  <FaCamera />
                  Upload Photo
                </button>
                
                <button
                  onClick={generateAIAvatar}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition font-medium"
                >
                  <FaDice />
                  Generate AI Avatar
                </button>
                
                <button
                  onClick={() => setShowAvatarOptions(false)}
                  className="w-full px-4 py-2 text-gray-600 text-sm hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <h3 className="mt-4 text-2xl font-bold text-gray-900">{user.name}</h3>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>

          {/* Settings Bar */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">
              Your Details
            </h2>
            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
              
              {/* Edit Button */}
              <button
                onClick={() => setEditMode(!editMode)}
                className={`p-2 rounded-lg border transition ${
                  editMode 
                    ? 'bg-blue-100 border-blue-300 text-blue-700' 
                    : 'border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {editMode ? <FaTimes className="text-sm" /> : <FaPencilAlt className="text-sm" />}
              </button>
            </div>
          </div>

          {!editMode ? (
            <div className="space-y-4">
              <Field label="Name" value={user.name} />

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-gray-900 font-medium break-all">
                    {user.email}
                  </p>
                </div>
                <EmailButton email={user.email} />
              </div>

              <Field label="Date of Birth" value={user.dob || "-"} />

              <SocialField
                label="LinkedIn"
                text={user.linkedin}
                link={user.linkedin || "https://linkedin.com"}
                Button={LinkedinButton}
              />

              <SocialField
                label="GitHub"
                text={githubText}
                link={githubLink}
                Button={GithubButton}
              />

              <SocialField
                label="LeetCode"
                text={user.leetcode}
                link={user.leetcode || "https://leetcode.com"}
                Button={LeetcodeButton}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />

              <Input label="Email" value={form.email} disabled />

              <Input
                label="Date of Birth"
                type="date"
                value={form.dob}
                onChange={e => setForm({ ...form, dob: e.target.value })}
              />

              <Input
                label="LinkedIn"
                value={form.linkedin}
                onChange={e => setForm({ ...form, linkedin: e.target.value })}
              />

              <Input
                label="GitHub"
                value={form.github}
                onChange={e => setForm({ ...form, github: e.target.value })}
              />

              <Input
                label="LeetCode"
                value={form.leetcode}
                onChange={e => setForm({ ...form, leetcode: e.target.value })}
              />

              <button
                onClick={handleSave}
                className="w-full mt-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Save Changes
              </button>

              <button
                onClick={() => setEditMode(false)}
                className="w-full py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Field = ({ label, value }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-gray-900 font-medium break-all">
      {value || "-"}
    </p>
  </div>
)

const SocialField = ({ label, text, link, Button }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between">
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-gray-900 font-medium break-all">
        {text || "Not added"}
      </p>
    </div>
    <Button link={link} disabled={!text} />
  </div>
)

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      {...props}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
    />
  </div>
)

export default Profile
