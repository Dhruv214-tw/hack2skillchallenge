'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/checkin',   icon: '😊', label: 'Check In' },
  { href: '/journal',   icon: '📝', label: 'Journal' },
  { href: '/wellness',  icon: '✨', label: 'Wellness' },
  { href: '/history',   icon: '📊', label: 'History' },
]

export default function Sidebar({ user, profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🧠</span>
        <span className={styles.logoText}>MindTrack</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${pathname === href ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.userSection}>
        <div className={styles.avatar}>
          {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div className={styles.userInfo}>
          <p className={styles.userName}>{profile?.full_name || 'Student'}</p>
          <p className={styles.userExam}>{profile?.exam_type || 'Exam Prep'}</p>
        </div>
        <button id="logout-btn" className={styles.logoutBtn} onClick={handleLogout} title="Log out">
          ↩
        </button>
      </div>
    </aside>
  )
}
