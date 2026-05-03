const USER_NAME_PATTERN = /^[a-z0-9_/]+$/i;

export function isValidUserName(value) {
  return typeof value === "string" && USER_NAME_PATTERN.test(value);
}
