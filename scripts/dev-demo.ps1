$env:NODE_ENV = "development"
$env:DEMO_MODE = "true"
$env:JWT_SECRET = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { "dev-local-secret" }
npx tsx server/_core/index.ts
