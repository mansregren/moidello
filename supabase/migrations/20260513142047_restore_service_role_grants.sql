-- Service-role saknade alla DML-grants på public-tabeller (förlorade
-- vid något tidigare migration eller projekt-setup). Återställ till
-- normal Supabase-default: full access för server-side use.
-- Säkerheten är inte kompromissad eftersom service_role bara används
-- från server-side routes som har sin egen admin-check.

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Säkerställ att framtida tabeller också får grants automatiskt.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;
