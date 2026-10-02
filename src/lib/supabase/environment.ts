export function authConfigured() { return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; }
export function verifyEnvironment() {
  const expected=process.env.VERCEL_ENV==='production'?'production':process.env.VERCEL_ENV==='preview'?'preview':'local';
  if(expected!=='local'&&process.env.FIELDWORK_ENVIRONMENT!==expected)throw new Error('Fieldwork deployment environment is not explicitly configured.');
  if(authConfigured()&&process.env.SUPABASE_ENVIRONMENT!==expected)throw new Error('Supabase data environment does not match this deployment.');
  if(authConfigured()&&expected!=='local'){
    const preview=process.env.FIELDWORK_PREVIEW_SUPABASE_URL,production=process.env.FIELDWORK_PRODUCTION_SUPABASE_URL;
    if(!preview||!production||preview===production)throw new Error('Independent preview and production database boundaries are required.');
    if(process.env.NEXT_PUBLIC_SUPABASE_URL!==(expected==='production'?production:preview))throw new Error('Supabase URL does not match the pinned environment boundary.');
  }
  for(const key of ['NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY','NEXT_PUBLIC_MAPBOX_DIRECTIONS_TOKEN','NEXT_PUBLIC_FIELDWORK_DATABASE_URL'])if(process.env[key])throw new Error('Privileged credentials cannot use a public variable.');
}
export function safeAuthConfigured(){try{verifyEnvironment();return authConfigured();}catch{return false;}}
