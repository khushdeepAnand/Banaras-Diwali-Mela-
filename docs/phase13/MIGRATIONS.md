# Executed migration record (live, Phase 13)

Before changes, Management API GET `/v1/projects` matched the configured URL's
reference to the existing **Diwali Mela** project. Initial exact-case check stopped
without writes because the requested name used lowercase `m`; inspecting the actual
display name confirmed a capitalization-only difference. A second read-only catalog
query found **no public tables**. No business records were present or deleted.

Executed from the project root using Node 24.22.1 and the private env file:

```sh
node --env-file=backend/.env --input-type=module <<'JS'
import {readFile} from 'node:fs/promises';
const ref=new URL(process.env.SUPABASE_URL).hostname.split('.')[0];
async function sql(query){const r=await fetch('https://api.supabase.com/v1/projects/'+ref+'/database/query',{method:'POST',headers:{Authorization:'Bearer '+process.env.SUPABASE_ACCESS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({query}),signal:AbortSignal.timeout(60000)}); if(!r.ok){console.log(JSON.stringify({sqlHttpStatus:r.status,failed:true}));throw Error('SQL failed')}return r.json()}
try {
 const tables=await sql("select tablename from pg_tables where schemaname='public'");
 if(tables.length)throw Error('Preflight changed; stop');
 for(const file of ['backend/migrations/001_mela_commerce.sql','backend/migrations/002_staging_hardening.sql','docs/phase12/VERIFY-DATABASE.sql','docs/phase13/VERIFY-SERVICE-ROLE.sql']){
  await sql(await readFile(file,'utf8'));console.log(JSON.stringify({file,result:'executed successfully'}));
 }
 await sql('begin; alter table public.mela_contributions validate constraint mela_contribution_input; alter table public.mela_applications validate constraint mela_application_input; commit;');
 console.log(JSON.stringify({inputConstraints:'validated successfully'}));
 const counts=await sql(`select 'mela_settings' as table_name,count(*)::int as rows from public.mela_settings union all select 'mela_contributions',count(*)::int from public.mela_contributions union all select 'mela_applications',count(*)::int from public.mela_applications union all select 'mela_audit_events',count(*)::int from public.mela_audit_events`);
 console.log(JSON.stringify({postMigrationCounts:counts}));
} catch {console.log('Stopped on SQL/preflight failure; no automatic retries or destructive repair.');process.exitCode=1}
JS
```

Actual result: exit0, every named file succeeded (HTTP 201); both constraints validated.
Counts immediately afterwards: settings=1, contributions=0, applications=0, audit=0.
The verification files rolled back synthetic records. Identity sequence gaps are
expected. Later labelled live QA records are documented separately in VERIFICATION.md.

**Historical execution record, not a command to rerun on this project.** Its guard
now refuses because the schema exists. Do not rerun 001 after 002. For future checks,
use `node --env-file=backend/.env scripts/verify_database.mjs`; it applies no migrations.
