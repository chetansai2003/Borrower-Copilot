import { FieldMessage } from "./FieldMessage.jsx";
import { getDescribedBy } from "./fieldA11y.js";

export function RadioGroup({
  name,
  label,
  helperText,
  error,
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  className = "",
  "aria-describedby": describedBy
}) {
  const helperId = helperText ? `${name}-helper` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <fieldset
      className={className}
      aria-describedby={getDescribedBy({ helperId, errorId, describedBy })}
    >
      <legend className="text-sm font-semibold text-navy">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm font-medium text-navy has-[:checked]:border-teal has-[:checked]:bg-teal/10"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(event) => onChange?.(event.target.value)}
              disabled={disabled}
              required={required}
              className="h-4 w-4 accent-teal"
            />
            {option.label}
          </label>
        ))}
      </div>
      <FieldMessage id={helperId}>{helperText}</FieldMessage>
      <FieldMessage id={errorId} tone="error">
        {error}
      </FieldMessage>
    </fieldset>
  );
}
