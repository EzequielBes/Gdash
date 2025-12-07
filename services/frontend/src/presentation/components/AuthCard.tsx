import React from 'react'

interface AuthCardProps {
  children: React.ReactNode
  gradient?: 'blue' | 'green'
}

export function AuthCard({ children, gradient = 'blue' }: AuthCardProps) {
  const gradientClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    green: 'bg-gradient-to-br from-green-50 to-emerald-100',
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${gradientClasses[gradient]} px-4`}>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
