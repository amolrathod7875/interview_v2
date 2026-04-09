import axios from "axios"
import { useEffect, useState, useRef } from "react"
import { FaPencilAlt, FaCamera, FaDice, FaTimes } from "react-icons/fa"
import { Sun, Moon } from "lucide-react"
import LoadingWave from "./ui/LoadingWave"
import LinkedinButton from "./ui/LinkedinButton"
import GithubButton from "./ui/GithubButton"
import LeetcodeButton from "./ui/LeetcodeButton"
import EmailButton from "./ui/EmailButton"
import EmptyState from "./ui/EmptyState"
import { UserRoundX } from "lucide-react"

const API = import.meta.env.VITE_API_BASE_URL

const Profile = ({ theme = "light", toggleTheme }) => {
  const [user, setUser] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showAvatarOptions, setShowAvatarOptions] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [savingField, setSavingField] = useState(null)
  const fileInputRef = useRef(null)
  const menuRef = useRef(null)

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
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <LoadingWave />
        <p className="text-muted-foreground text-sm">Loading profile...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background px-4 md:px-8 py-10">
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
    <div className="min-h-screen bg-background px-4 md:px-8 py-10">
      <div className="max-w-xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your account information
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-card transition-colors">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-border">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-primary/20 text-primary flex items-center justify-center text-4xl font-bold shadow-lg">
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
                className="absolute bottom-0 right-0 w-10 h-10 bg-primary hover:brightness-90 text-primary-foreground rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
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
              <div className="mt-4 bg-muted border border-border rounded-lg p-4 space-y-2 w-full max-w-xs">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-card border border-border rounded-lg hover:bg-background transition text-foreground font-medium"
                >
                  <FaCamera />
                  Upload Photo
                </button>
                
                <button
                  onClick={generateAIAvatar}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:brightness-90 transition font-medium"
                >
                  <FaDice />
                  Generate AI Avatar
                </button>
                
                <button
                  onClick={() => setShowAvatarOptions(false)}
                  className="w-full px-4 py-2 text-muted-foreground text-sm hover:text-foreground"
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

            <h3 className="mt-4 text-2xl font-bold text-foreground">{user.name}</h3>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>

          {/* Settings Bar */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Your Details
            </h2>
            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-border hover:bg-muted transition"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
              </button>
              
              {/* Edit Button */}
              <button
                onClick={() => setEditMode(!editMode)}
                className={`p-2 rounded-lg border transition ${
                  editMode 
                    ? 'bg-primary/15 border-primary/40 text-primary'
                    : 'border-border hover:bg-muted text-muted-foreground'
                }`}
              >
                {editMode ? <FaTimes className="text-sm" /> : <FaPencilAlt className="text-sm" />}
              </button>
            </div>
          </div>

          {!editMode ? (
            <div className="space-y-4">
              <Field label="Name" value={user.name} />

              <div className="bg-muted border border-border rounded-lg p-4 flex justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-foreground font-medium break-all">
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
                className="w-full mt-4 py-3 rounded-lg bg-primary hover:brightness-90 text-primary-foreground font-medium"
              >
                Save Changes
              </button>

              <button
                onClick={() => setEditMode(false)}
                className="w-full py-3 rounded-lg border border-border text-foreground hover:bg-muted"
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
  <div className="bg-muted border border-border rounded-lg p-4">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-foreground font-medium break-all">
      {value || "-"}
    </p>
  </div>
)

const SocialField = ({ label, text, link, Button }) => (
  <div className="bg-muted border border-border rounded-lg p-4 flex justify-between">
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-foreground font-medium break-all">
        {text || "Not added"}
      </p>
    </div>
    <Button link={link} disabled={!text} />
  </div>
)

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-1">
      {label}
    </label>
    <input
      {...props}
      className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
    />
  </div>
)

export default Profile
