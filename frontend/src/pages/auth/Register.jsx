// Create an account. The role picker is four token slips; Admin is shown but
// cannot be picked (admin accounts are made by the college, not here).
// New accounts are always "pending" until an admin approves them; the route
// gate sends the new user to the waiting page.
import { Link } from 'react-router';
import useValidatedForm from '../../hooks/useValidatedForm';
import Button from '../../components/Button';
import { FieldError, PasswordField, TextField } from '../../components/Field';
import StatusStamp from '../../components/StatusStamp';
import { useAuth } from '../../context/AuthContext';
import { useSlip } from '../../context/ToastContext';
import { ROLES } from '../../lib/roles';
import { registerRules } from '../../validation/registerRules';
import { handleServerError } from '../../validation/serverErrors';
import AuthLayout from './AuthLayout';

const FIELDS = ['role', 'name', 'organization', 'email', 'phone', 'password'];

export default function Register() {
  const { register: createAccount } = useAuth();
  const showSlip = useSlip();
  const {
    field,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useValidatedForm();

  const role = watch('role');
  const orgLabel = { donor: 'Canteen name', volunteer: 'Club or unit' }[role] || 'Organization';

  async function onSubmit(values) {
    try {
      await createAccount(values);
    } catch (error) {
      handleServerError(error, { setError, fields: FIELDS, showSlip });
    }
  }

  return (
    <AuthLayout formWidth="max-w-[560px]">
      <h1 className="t-display-sm text-ink">Take a token</h1>
      <p className="mt-2 text-ink-soft t-body-lg">
        Tell us how you will use FoodLoop. An admin approves each new account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6">
        {/* ---- Role picker: four token slips (a real radio group) ---- */}
        <fieldset
          className="mb-6"
          aria-describedby={errors.role ? 'role-error' : undefined}
          aria-invalid={errors.role ? true : undefined}
        >
          <legend className="mb-2 text-ink t-title-sm">I am joining as</legend>
          {/* The gap is wider than two notches, so neighbouring cut-outs never touch. */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 min-[340px]:grid-cols-2">
            {['donor', 'recipient', 'volunteer', 'admin'].map((value) => (
              <RoleSlip
                key={value}
                value={value}
                selected={role === value}
                disabled={value === 'admin' || isSubmitting}
                inputProps={field('role', registerRules.role)}
              />
            ))}
          </div>
          <FieldError id="role-error" error={errors.role} />
        </fieldset>

        {/* ---- Details ---- */}
        <TextField label="Your name" autoComplete="name" error={errors.name} {...field('name', registerRules.name)} />
        <TextField
          label={orgLabel}
          optional
          autoComplete="organization"
          placeholder="e.g. Asha Night Shelter"
          error={errors.organization}
          {...field('organization', registerRules.organization)}
        />
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          error={errors.email}
          {...field('email', registerRules.email)}
        />
        <TextField
          label="Phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          helper="So a volunteer or canteen can reach you"
          error={errors.phone}
          {...field('phone', registerRules.phone)}
        />
        <PasswordField
          autoComplete="new-password"
          helper="At least 6 characters"
          error={errors.password}
          {...field('password', registerRules.password)}
        />
        <Button type="submit" variant="accent" expand loading={isSubmitting} loadingLabel="Creating account" className="mt-2">
          Create account
        </Button>
      </form>

      <p className="mt-6 flex flex-wrap items-center gap-x-1 text-ink t-body">
        Already have an account?
        <Link to="/login" className="inline-flex min-h-12 items-center px-2 font-semibold underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

/** One role, drawn as a small token slip. Picking it stamps it. */
function RoleSlip({ value, selected, disabled, inputProps }) {
  const isAdmin = value === 'admin';
  const { label, blurb } = ROLES[value];
  const edge = selected ? 'var(--fl-ink)' : 'var(--fl-perforation)';

  return (
    <label
      className={`group relative block rounded-slip has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
        isAdmin ? 'cursor-not-allowed opacity-60' : ''
      }`}
    >
      {/* The real radio, visually hidden: arrow keys move between roles. */}
      <input type="radio" value={value} disabled={disabled} className="sr-only" {...inputProps} />
      <div
        className={`slip ${selected ? 'slip-selected' : isAdmin ? '' : 'group-hover:slip-lifted'} [--stub:2.125rem]`}
        style={{ '--edge': edge }}
      >
        <div className="slip-paper flex flex-col">
          <div className="min-h-24 px-3 pt-3">
            <p className="t-title-lg text-ink">{label}</p>
            <p className="mt-1 pb-2 text-ink-soft t-body-sm">{isAdmin ? 'Set up by the campus office' : blurb}</p>
          </div>
          <div className="flex h-[var(--stub)] flex-col bg-sunken">
            <div className="perforation mx-3" aria-hidden="true" />
            <div className="flex flex-1 items-center justify-between gap-2 px-3">
              <span className="text-ink-soft t-mono-sm">{isAdmin ? 'Not here' : selected ? 'Yours' : 'Tap to pick'}</span>
              {selected && <StatusStamp label="Picked" size="sm" />}
            </div>
          </div>
        </div>
      </div>
    </label>
  );
}
