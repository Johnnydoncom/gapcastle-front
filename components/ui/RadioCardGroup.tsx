import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioCardGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
}

const RadioCardGroupContext = React.createContext<{
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
} | null>(null)

export function RadioCardGroup({
  className,
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
  ...props
}: RadioCardGroupProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const selectedValue = value !== undefined ? value : internalValue

  const handleChange = React.useCallback(
    (newValue: string) => {
      if (disabled) return
      setInternalValue(newValue)
      onValueChange?.(newValue)
    },
    [disabled, onValueChange]
  )

  return (
    <RadioCardGroupContext.Provider
      value={{ value: selectedValue, onValueChange: handleChange, disabled }}
    >
      <div className={cn("grid gap-3", className)} role="radiogroup" {...props}>
        {children}
      </div>
    </RadioCardGroupContext.Provider>
  )
}

interface RadioCardProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  value: string
  disabled?: boolean
}

export const RadioCard = React.forwardRef<HTMLLabelElement, RadioCardProps>(
  ({ className, value, children, disabled, ...props }, ref) => {
    const context = React.useContext(RadioCardGroupContext)
    if (!context) {
      throw new Error("RadioCard must be used within a RadioCardGroup")
    }

    const isSelected = context.value === value
    const isDisabled = disabled || context.disabled

    return (
      <label
        ref={ref}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all",
          isSelected
            ? "border-primary bg-primary/5 text-primary"
            : "border-muted bg-transparent hover:border-primary/50",
          isDisabled && "cursor-not-allowed opacity-50",
          className
        )}
        {...props}
      >
        <input
          type="radio"
          className="sr-only"
          value={value}
          checked={isSelected}
          disabled={isDisabled}
          onChange={() => context.onValueChange?.(value)}
        />
        {children}
      </label>
    )
  }
)
RadioCard.displayName = "RadioCard"
