export default function Alert({ type = 'info', children, className = '' }) {
  const types = {
    success: 'bg-brutal-lime text-brutal-black',
    error: 'bg-brutal-pink text-white',
    warning: 'bg-brutal-orange text-white',
    info: 'bg-brutal-cyan text-brutal-black',
  }

  return (
    <div className={`${types[type]} border-brutal border-brutal-black shadow-brutal p-4 font-bold ${className}`}>
      {children}
    </div>
  )
}
