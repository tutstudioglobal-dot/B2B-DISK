import './globals.css'
import { LangProvider } from '@/context/LangContext'
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  title: 'SAPKEY ERP — Petroleum Supply Chain',
  description: 'Enterprise petroleum supply chain management system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var l=localStorage.getItem('sapkey_lang');if(l==='en'){document.documentElement.dir='ltr';document.documentElement.lang='en'}else{document.documentElement.dir='rtl';document.documentElement.lang='ar'}}catch(e){}})()`
        }} />
      </head>
      <body className="antialiased" style={{ fontFamily: "'Segoe UI', 'Cairo', system-ui, -apple-system, sans-serif" }}>
        <AuthProvider>
          <LangProvider>
            {children}
          </LangProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
