import { useState } from "react";
import { formatINR, parseCurrencyNumber } from "../../utils/money.js";
import { FieldMessage } from "./FieldMessage.jsx";
import { getDescribedBy } from "./fieldA11y.js";

export function CurrencyInput({
  id,
  label,
  helperText,
  error,
  value,
  onValueChange,
  disabled = false,
  required = false,
  className = "",
  "aria-describedby": describedBy,
  onBlur,
  onFocus,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const hasValue = value !== "" && value !== null && value !== undefined;
  const displayValue = hasValue ? (isFocused ? String(value) : formatINR(value)) : "";

  const handleChange = (event) => {
    onValueChange?.(parseCurrencyNumber(event.target.value));
  };

  const handleFocus = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-navy">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        id={id}
        inputMode="numeric"
        disabled={disabled}
        required={required}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
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
