// SharedComponents.jsx


// FormInput: generic input with optional icon
export const FormInput = ({ id, type, placeholder, value, onChange, icon }) => (
  <div className="form-input-container">
    {icon && <div className="icon-container">{icon}</div>}
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="form-input"
      required
    />
  </div>
);

// FormButton: generic button
export const FormButton = ({ type = 'button', onClick, children }) => (
  <button type={type} onClick={onClick} className="form-button">
    {children}
  </button>
);

// Optional: FormSelect if you want reusable select dropdown
export const FormSelect = ({ id, name, value, onChange, options, icon }) => (
  <div className="form-input-container">
    {icon && <div className="icon-container">{icon}</div>}
    <select id={id} name={name} value={value} onChange={onChange} className="form-select" required>
      <option value="" disabled>Select {name}</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);
