import './globals.css'

export const metadata = {
  title: 'MindTrack — Student Mental Wellness Tracker',
  description: 'Track your mood, manage stress, and receive personalized wellness support during NEET, JEE, CAT, GATE, UPSC, and board exam preparation.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
