/**
 * Neo-brutalist Textarea Component
 */
export default function Textarea({ 
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
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
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="w-full px-4 py-3 border-brutal border-brutal-black shadow-brutal-sm focus:shadow-brutal focus:outline-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all bg-white font-medium resize-none"
        {...props}
      />
    </div>
  );
}

