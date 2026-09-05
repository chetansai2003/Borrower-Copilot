import { FieldMessage } from "./FieldMessage.jsx";
import { getDescribedBy } from "./fieldA11y.js";

export function Select({
  id,
  label,
  helperText,
  error,
  options,
  disabled = false,
  required = false,
  className = "",
  "aria-describedby": describedBy,
  ...props
}) {
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-navy">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <select
        id={id}
        disabled={disabled}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={getDescribedBy({ helperId, errorId, describedBy })}
        className="mt-2 min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-base text-navy shadow-sm transition disabled:bg-navy/5 disabled:text-navy/45"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldMessage id={helperId}>{helperText}</FieldMessage>
      <FieldMessage id={errorId} tone="error">
        {error}
      </FieldMessage>
    </div>
  );
}
