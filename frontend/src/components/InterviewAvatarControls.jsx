import { User, Smile, Meh, Frown, MessageSquare } from 'lucide-react'

/**
 * InterviewAvatarControls - UI controls for avatar settings
 * 
 * Provides toggle and expression controls for the speaking avatar
 */
export default function InterviewAvatarControls({
  avatarEnabled = true,
  onToggleAvatar = () => {},
  expression = 'neutral',
  onExpressionChange = () => {},
  showCaptions = false,
  onToggleCaptions = () => {}
}) {
  const expressions = [
    { id: 'neutral', icon: Meh, label: 'Neutral' },
    { id: 'smile', icon: Smile, label: 'Smile' },
    { id: 'happy', icon: Frown, label: 'Happy' }
  ]

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md border border-gray-100">
      {/* Avatar Toggle */}
      <button
        onClick={onToggleAvatar}
        className={`p-2 rounded-lg transition-colors ${
          avatarEnabled 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
        title={avatarEnabled ? 'Disable Avatar' : 'Enable Avatar'}
        aria-label={avatarEnabled ? 'Disable Avatar' : 'Enable Avatar'}
        aria-pressed={avatarEnabled}
        type="button"
      >
        <User className="w-5 h-5" />
      </button>
      
      {/* Divider */}
      <div className="w-px h-6 bg-gray-200" />
      
      {/* Expression Selector */}
      <div className="flex gap-1">
        {expressions.map((exp) => (
          <button
            key={exp.id}
            onClick={() => onExpressionChange(exp.id)}
            className={`p-2 rounded-lg transition-colors ${
              expression === exp.id
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
            title={exp.label}
            aria-label={`Set expression to ${exp.label}`}
            aria-pressed={expression === exp.id}
            type="button"
          >
            <exp.icon className="w-5 h-5" />
          </button>
        ))}
      </div>
      
      {/* Divider */}
      <div className="w-px h-6 bg-gray-200" />
      
      {/* Captions Toggle */}
      <button
        onClick={onToggleCaptions}
        className={`p-2 rounded-lg transition-colors ${
          showCaptions
            ? 'bg-blue-100 text-blue-600'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
        title={showCaptions ? 'Hide Captions' : 'Show Captions'}
        aria-label={showCaptions ? 'Hide Captions' : 'Show Captions'}
        aria-pressed={showCaptions}
        type="button"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
    </div>
  )
}
