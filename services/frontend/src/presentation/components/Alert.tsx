import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface AlertProps {
  type: 'error' | 'success' | 'info'
  message: string
  onClose?: () => void
}

export function Alert({ type, message, onClose }: AlertProps) {
  const styles = {
    error: {
      bg: 'bg-red-100',
      border: 'border-red-400',
      text: 'text-red-700',
      icon: AlertCircle,
    },
    success: {
      bg: 'bg-green-100',
      border: 'border-green-400',
      text: 'text-green-700',
      icon: CheckCircle2,
    },
    info: {
      bg: 'bg-blue-100',
      border: 'border-blue-400',
      text: 'text-blue-700',
      icon: AlertCircle,
    },
  }

  const style = styles[type]
  const Icon = style.icon

  return (
    <div className={`mb-4 p-3 ${style.bg} border ${style.border} ${style.text} rounded text-sm flex items-start gap-2`}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-lg leading-none hover:opacity-70"
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  )
}
