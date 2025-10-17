export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
  className = ''
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-black uppercase text-brutal-black mb-2">
          {label} {required && <span className="text-brutal-pink">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        className="w-full px-4 py-3 border-brutal border-brutal-black bg-white text-brutal-black font-bold placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-brutal-cyan focus:ring-offset-0 transition-all"
      />
    </div>
  )
}
