import type { FormEvent } from 'react';

/**
 * Submit handler for a client form. React 19 resets a form after a form `action` finishes, even
 * when the save failed or the server returned new values, which would wipe what someone typed.
 * A plain submit handler leaves the fields alone; call `form.reset()` where clearing is wanted.
 */
export const submitWith = (fn: (data: FormData, form: HTMLFormElement) => void) => (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  fn(new FormData(event.currentTarget), event.currentTarget);
};
