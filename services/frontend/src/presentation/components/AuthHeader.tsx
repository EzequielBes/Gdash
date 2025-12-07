export function AuthHeader() {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-800">GDASH</h1>
      <p className="text-gray-600 text-sm mt-2">Weather Monitor</p>
    </div>
  )
}

interface AuthTitleProps {
  text: string
}

export function AuthTitle({ text }: AuthTitleProps) {
  return (
    <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
      {text}
    </h2>
  )
}
