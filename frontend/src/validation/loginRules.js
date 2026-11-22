// Sign-in form rules. Backend: backend/src/routes/authRoutes.js (POST /login)
//   email:    trim, isEmail      -> "Enter a valid email"
//   password: notEmpty           -> "Enter your password"
import { EMAIL_PATTERN, trim } from './constants';

export const loginRules = {
  email: {
    setValueAs: trim,
    required: 'Enter your email',
    pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email' },
  },
  // Not trimmed: spaces are allowed in passwords.
  password: {
    required: 'Enter your password',
  },
};
