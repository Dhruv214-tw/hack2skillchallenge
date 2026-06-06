import './globals.css'

export const metadata = {
  title: 'MindTrack',
  description: 'Mental Wellness Tracker',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
