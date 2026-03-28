interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
}

export default function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${SIZE_CLASSES[size]} animate-spin rounded-full border-indigo-600 border-t-transparent`}
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}
