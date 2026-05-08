-- Add messaging tables to the supabase_realtime publication so the
-- ConversationThread's postgres_changes subscription actually fires
-- when a counterpart inserts a new message. Without this, sends look
-- silent on the receiver side until they refresh.
--
-- The publication ships with Supabase by default; we just opt our
-- tables in.

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.notifications;
