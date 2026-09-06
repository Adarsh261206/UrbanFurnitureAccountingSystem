/**
 * Shared semantic validators — used across every form so validation stays
 * consistent. Each validator returns a human-readable error message or null.
 * These are UX helpers only; the backend remains the final authority.
 */

export function validateRequired(value: string, label: string): string | null {
  if (!value || !value.trim()) return `${label} is required.`;
  return null;
}

export function validateEmail(value: string): string | null {
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validatePan(value: string): string | null {
  if (!value) return null;
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.trim().toUpperCase())) {
    return "Enter a valid PAN in the format ABCDE1234F.";
  }
  return null;
}

export function validateGstin(value: string): string | null {
  if (!value) return null;
  if (!/^[0-9A-Z]{15}$/.test(value.trim().toUpperCase())) {
    return "Enter a valid GSTIN (15 characters, e.g. 27AABCU9603R1ZM).";
  }
  return null;
}

export function validateMobile(value: string): string | null {
  if (!value) return null;
  const digits = value.trim().replace(/[\s-]/g, "");
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return "Enter a valid 10-digit mobile number starting with 6-9.";
  }
  return null;
}

export function validatePincode(value: string): string | null {
  if (!value) return null;
  if (!/^[1-9]\d{5}$/.test(value.trim())) {
    return "Enter a valid 6-digit PIN code.";
  }
  return null;
}

export function validateLoginId(value: string): string | null {
  if (!value) return null;
  if (!/^[a-zA-Z0-9_-]{6,12}$/.test(value.trim())) {
    return "Login ID must be 6-12 characters (letters, numbers, _ or -).";
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return null;
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(value)) return "Password must include a lowercase letter.";
  if (!/[A-Z]/.test(value)) return "Password must include an uppercase letter.";
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=;'[\]\\/]/.test(value)) {
    return "Password must include a special character.";
  }
  return null;
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return null;
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

export function validateNumber(
  value: string,
  label: string,
  opts: { min?: number; max?: number; allowZero?: boolean } = {},
): string | null {
  if (value === "" || value === undefined || value === null) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return `Enter a valid ${label}.`;
  if (opts.allowZero === false && n <= 0) return `${label} must be greater than zero.`;
  if (opts.min !== undefined && n < opts.min) return `${label} must be at least ${opts.min}.`;
  if (opts.max !== undefined && n > opts.max) return `${label} must be at most ${opts.max}.`;
  return null;
}

export function validateDateOrder(
  start: string,
  end: string,
  startLabel: string,
  endLabel: string,
): string | null {
  if (!start || !end) return null;
  if (new Date(end) < new Date(start)) return `${endLabel} cannot be before ${startLabel}.`;
  return null;
}

/** Trim helper — call before submit so leading/trailing spaces never persist. */
export function trimmed(value: string | undefined | null): string {
  return (value ?? "").trim();
}
