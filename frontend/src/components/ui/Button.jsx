export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = ''
}) {
  const baseStyles = 'font-black border-brutal border-brutal-black uppercase transition-all duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0'

  const variants = {
    primary: 'bg-brutal-yellow text-brutal-black shadow-brutal hover:shadow-brutal-lg',
    secondary: 'bg-brutal-cyan text-brutal-black shadow-brutal hover:shadow-brutal-lg',
    danger: 'bg-brutal-pink text-white shadow-brutal hover:shadow-brutal-lg',
    success: 'bg-brutal-lime text-brutal-black shadow-brutal hover:shadow-brutal-lg',
    outline: 'bg-white text-brutal-black shadow-brutal hover:shadow-brutal-lg',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          LOADING...
        </span>
      ) : children}
    </button>
  )
}
