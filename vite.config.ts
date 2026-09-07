import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import hostingConfig from './.openai/hosting.json';

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  '00000000-0000-4000-8000-000000000000';

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.


const localBindingConfig = {
  name: 'app',
  main: 'vinext/server/fetch-handler',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: 'site-creator-d1',
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: 'site-creator-r2',
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const localNode = process.env.POKERONDA_NODE_DEV === '1';
  const hostingPlugins = localNode ? [] : [
    (await import('@openai/sites-vite-plugin')).sites(),
    (await import('@cloudflare/vite-plugin')).cloudflare({
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
      config: localBindingConfig,
    }),
  ];

  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    server: { watch: { useFsEvents: false, usePolling: true, interval: 1000, ignored: ['**/node_modules/**', '**/.wrangler/**', '**/dist/**', '**/.git/**', '**/*.tsbuildinfo'] } },
    plugins: [
      vinext(),
      ...hostingPlugins,
    ],
  };
});
