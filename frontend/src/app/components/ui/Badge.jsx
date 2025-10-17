/**
 * Neo-brutalist Badge Component
 */
export default function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '' 
}) {
  const variants = {
    hot: 'bg-brutal-pink text-white',
    warm: 'bg-brutal-orange text-white',
    cool: 'bg-brutal-cyan text-brutal-black',
    cold: 'bg-white text-brutal-black',
    noshow: 'bg-gray-300 text-brutal-black',
    default: 'bg-brutal-yellow text-brutal-black',
    success: 'bg-brutal-lime text-brutal-black',
    info: 'bg-brutal-cyan text-brutal-black',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`inline-block border-brutal border-brutal-black shadow-brutal-sm font-bold uppercase ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

