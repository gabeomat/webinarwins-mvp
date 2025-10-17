/**
 * Neo-brutalist Input Component
 */
export default function Input({ 
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-bold text-brutal-black mb-2 uppercase">
          {label} {required && <span className="text-brutal-pink">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 border-brutal border-brutal-black shadow-brutal-sm focus:shadow-brutal focus:outline-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all bg-white font-medium"
        {...props}
      />
    </div>
  );
}

