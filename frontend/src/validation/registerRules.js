// Create-account form rules. Backend: backend/src/routes/authRoutes.js (POST /register)
//   name:         trim, at least 2 characters      -> "Enter your name"
//   email:        trim, isEmail                    -> "Enter a valid email"
//                 (a used email comes back as 409 with a field error)
//   password:     at least 6 characters            -> "Password must be at least 6 characters"
//   role:         donor | recipient | volunteer    -> "Choose donor, recipient or volunteer"
//   phone:        trim, /^[0-9+\- ]{7,15}$/        -> "Enter a valid phone number"
//   organization: optional, at most 80 characters  -> "Organization name is too long"
import {
  EMAIL_PATTERN,
  NAME_MIN,
  ORGANIZATION_MAX,
  PASSWORD_MIN,
  PHONE_PATTERN,
  REGISTER_ROLES,
  trim,
} from './constants';

export const registerRules = {
  role: {
    required: 'Choose donor, recipient or volunteer',
    validate: (value) => REGISTER_ROLES.includes(value) || 'Choose donor, recipient or volunteer',
  },
  name: {
    setValueAs: trim,
    required: 'Enter your name',
    minLength: { value: NAME_MIN, message: 'Enter your name' },
  },
  organization: {
    setValueAs: trim,
    maxLength: { value: ORGANIZATION_MAX, message: 'Organization name is too long' },
  },
  email: {
    setValueAs: trim,
    required: 'Enter your email',
    pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email' },
  },
  phone: {
    setValueAs: trim,
    required: 'Enter your phone number',
    pattern: { value: PHONE_PATTERN, message: 'Enter a valid phone number' },
  },
  // Not trimmed: spaces are allowed in passwords.
  password: {
    required: 'Choose a password',
    minLength: { value: PASSWORD_MIN, message: 'Password must be at least 6 characters' },
  },
};
