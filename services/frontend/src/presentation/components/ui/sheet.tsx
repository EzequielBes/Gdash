import React, { useState } from "react"

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Sheet = ({ open = false, onOpenChange, children }: SheetProps) => {
  const [isOpen, setIsOpen] = useState(open)

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <SheetContext.Provider value={{ isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

export const SheetTrigger = React.forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ onClick, ...props }, ref) => {
    const context = React.useContext(SheetContext)

    return (
      <button
        ref={ref}
        onClick={(e) => {
          context?.onOpenChange(!context?.isOpen)
          onClick?.(e)
        }}
        {...props}
      />
    )
  },
)

SheetTrigger.displayName = 'SheetTrigger'

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className = '', ...props }, ref) => {
    const context = React.useContext(SheetContext)

    if (!context?.isOpen) return null

    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => context?.onOpenChange(false)}
        />
        <div
          ref={ref}
          className={`fixed right-0 top-0 z-50 h-screen w-3/4 bg-white shadow-lg sm:w-1/2 ${className}`}
          {...props}
        />
      </>
    )
  },
)

SheetContent.displayName = 'SheetContent'

interface SheetContextType {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextType | undefined>(undefined)
