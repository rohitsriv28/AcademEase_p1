export function validateName(name) {
  const nameRegex = /^[A-Za-z\s]+$/;
  return nameRegex.test(name);
}

export function validateUsername(username) {
  const usernameRegex = /^[A-Za-z0-9@._-]+$/;
  return usernameRegex.test(username);
}

export function validateEmail(email) {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z]+\.[A-Za-z]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  return password && password.length >= 6;
}
