export const PASSWORD_REQUIREMENTS_ERROR =
  "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number or special character. Spaces are not allowed.";

export const meetsPasswordRequirements = (password: string): boolean =>
  password.length >= 8 &&
  !/\s/.test(password) &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[^A-Za-z\s]/.test(password);
