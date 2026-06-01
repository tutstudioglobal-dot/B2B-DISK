'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard') }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E0E1A]">
      <div className="loading-spinner w-8 h-8" />
    </div>
  )
}
