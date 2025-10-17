/**
 * Neo-brutalist Alert Component
 */
export default function Alert({ 
  children, 
  type = 'error',
  className = '' 
}) {
  const types = {
    error: 'bg-brutal-pink text-white',
    success: 'bg-brutal-lime text-brutal-black',
    warning: 'bg-brutal-orange text-white',
    info: 'bg-brutal-cyan text-brutal-black',
  };

  return (
    <div className={`${types[type]} border-brutal border-brutal-black shadow-brutal p-4 font-bold ${className}`}>
      {children}
    </div>
  );
}

