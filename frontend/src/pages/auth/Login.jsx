// Sign in. On success nothing navigates here: AuthContext changes, and the
// route gate moves the user to /home (or /pending).
import { Link } from 'react-router';
import useValidatedForm from '../../hooks/useValidatedForm';
import Button from '../../components/Button';
import { FormNotice, PasswordField, TextField } from '../../components/Field';
import { useAuth } from '../../context/AuthContext';
import { useSlip } from '../../context/ToastContext';
import { loginRules } from '../../validation/loginRules';
import { handleServerError } from '../../validation/serverErrors';
import AuthLayout from './AuthLayout';

export default function Login() {
  const { login, sessionExpired } = useAuth();
  const showSlip = useSlip();
  const {
    field,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useValidatedForm();

  async function onSubmit({ email, password }) {
    try {
      await login(email, password);
    } catch (error) {
      // "Incorrect email or password" has no field: it is shown as a slip.
      handleServerError(error, { setError, fields: ['email', 'password'], showSlip });
    }
  }

  return (
    <AuthLayout>
      <h1 className="t-display-sm text-ink">Sign in</h1>
      <p className="mt-2 text-ink-soft t-body-lg">Pick up where you left off at the counter.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8">
        {sessionExpired && <FormNotice>You were signed out. Please sign in again.</FormNotice>}
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="you@college.edu"
          error={errors.email}
          {...field('email', loginRules.email)}
        />
        <PasswordField autoComplete="current-password" error={errors.password} {...field('password', loginRules.password)} />
        <Button type="submit" variant="accent" expand loading={isSubmitting} loadingLabel="Signing in" className="mt-2">
          Sign in
        </Button>
      </form>

      <p className="mt-6 flex flex-wrap items-center gap-x-1 text-ink t-body">
        New to FoodLoop?
        <Link to="/register" className="inline-flex min-h-12 items-center px-2 font-semibold underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
