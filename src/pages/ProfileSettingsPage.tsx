import { User } from 'lucide-react'
import { ProfilePage } from '../components/profile/ProfilePage'

export function ProfileSettingsPage() {
  return (
    <>
      <header className="bg-white border-b border-cream-200 px-5 pt-safe-top">
        <div className="pt-4 pb-3">
          <div className="flex items-center gap-2">
            <User size={20} className="text-sand-500" />
            <h1 className="font-serif text-2xl text-warm-800">Profile</h1>
          </div>
          <p className="text-xs text-warm-400 mt-0.5">Your couple & settings</p>
        </div>
      </header>
      <div className="pt-2">
        <ProfilePage />
      </div>
    </>
  )
}
