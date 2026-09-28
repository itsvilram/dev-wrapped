// GitHub usernames: 1-39 characters, letters, digits and single hyphens,
// and they cannot start or end with a hyphen.
const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}
