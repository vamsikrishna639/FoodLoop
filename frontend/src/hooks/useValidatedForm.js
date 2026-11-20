// react-hook-form with FoodLoop's settings, used by every form.
//
//   mode: 'onBlur'            a field is checked when the user leaves it
//   reValidateMode: 'onChange' after a submit, fields re-check as they change
//   shouldFocusError: true    a failed submit focuses the first invalid field
//
// One addition: react-hook-form's reValidateMode only starts after the first
// submit. Before that, an error shown on blur would stay until the next
// blur, even once the value is fixed. `field()` registers an input and,
// while that input shows an error, re-checks it on every change, so the
// message disappears as soon as the value is right.
//
//   const { field, handleSubmit, formState: { errors } } = useValidatedForm();
//   <TextField {...field('email', loginRules.email)} error={errors.email} />
import { useForm } from 'react-hook-form';

export default function useValidatedForm(options = {}) {
  const form = useForm({ mode: 'onBlur', reValidateMode: 'onChange', shouldFocusError: true, ...options });
  const { register, trigger, getFieldState } = form;

  function field(name, rules = {}) {
    return register(name, {
      ...rules,
      onChange: (event) => {
        rules.onChange?.(event);
        if (getFieldState(name).error) trigger(name);
      },
    });
  }

  return { ...form, field };
}
