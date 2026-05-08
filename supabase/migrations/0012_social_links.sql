-- Optional social + contact links on profiles. All nullable: leaving a
-- field empty means it's hidden on the public profile (no extra
-- visibility flag needed). The UI accepts either a full URL or a bare
-- @handle for the social platforms and normalizes when rendering.

alter table public.profiles
  add column instagram text,
  add column tiktok text,
  add column youtube text,
  add column website text,
  add column contact_email text;
