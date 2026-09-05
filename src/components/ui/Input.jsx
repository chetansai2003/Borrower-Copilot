import { FieldMessage } from "./FieldMessage.jsx";
import { getDescribedBy } from "./fieldA11y.js";

export function Input({
  id,
  label,
  helperText,
  error,
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
      <input
        id={id}
        disabled={disabled}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={getDescribedBy({ helperId, errorId, describedBy })}
        className="mt-2 min-h-11 w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-base text-navy shadow-sm transition placeholder:text-navy/35 disabled:bg-navy/5 disabled:text-navy/45"
        {...props}
      />
      <FieldMessage id={helperId}>{helperText}</FieldMessage>
      <FieldMessage id={errorId} tone="error">
        {error}
      </FieldMessage>
    </div>
  );
}
