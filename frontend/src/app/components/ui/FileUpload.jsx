/**
 * Neo-brutalist File Upload Component
 */
export default function FileUpload({ 
  label,
  name,
  file,
  onChange,
  accept = '.csv',
  required = false,
  icon = '📁',
  successColor = 'lime',
  infoColor = 'yellow',
  infoText = '',
  className = ''
}) {
  const successColors = {
    lime: 'bg-brutal-lime',
    cyan: 'bg-brutal-cyan',
    yellow: 'bg-brutal-yellow',
    pink: 'bg-brutal-pink',
  };

  const infoColors = {
    yellow: 'bg-brutal-yellow border-brutal-black',
    pink: 'bg-brutal-pink border-brutal-black text-white',
    cyan: 'bg-brutal-cyan border-brutal-black',
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-bold text-brutal-black mb-2 uppercase">
          {label} {required && <span className="text-brutal-pink">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type="file"
          id={name}
          name={name}
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
        <label
          htmlFor={name}
          className={`flex flex-col items-center justify-center w-full h-40 border-brutal border-brutal-black cursor-pointer transition-all hover:shadow-brutal ${
            file ? `${successColors[successColor]} shadow-brutal-sm` : 'bg-white shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5'
          }`}
        >
          {file ? (
            <div className="text-center p-4">
              <div className="text-4xl mb-2">{icon}</div>
              <p className="text-sm text-brutal-black font-black break-all px-2">{file.name}</p>
              <p className="text-xs text-brutal-black mt-2 font-bold">✓ Ready to Upload</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-2">⬆️</div>
              <p className="font-black text-brutal-black uppercase">Drop File Here</p>
              <p className="text-xs text-brutal-black mt-1">or click to browse</p>
            </div>
          )}
        </label>
      </div>

      {infoText && (
        <div className={`mt-2 border-brutal p-2 ${infoColors[infoColor]}`}>
          <p className="text-xs font-bold">{infoText}</p>
        </div>
      )}
    </div>
  );
}

