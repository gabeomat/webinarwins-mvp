/**
 * Neo-brutalist Card Component
 */
export default function Card({ 
  children, 
  className = '',
  color = 'white',
  noPadding = false 
}) {
  const colors = {
    white: 'bg-white',
    yellow: 'bg-brutal-yellow',
    cyan: 'bg-brutal-cyan',
    pink: 'bg-brutal-pink',
    lime: 'bg-brutal-lime',
  };

  return (
    <div className={`${colors[color]} border-brutal border-brutal-black shadow-brutal ${!noPadding ? 'p-8' : ''} ${className}`}>
      {children}
    </div>
  );
}

