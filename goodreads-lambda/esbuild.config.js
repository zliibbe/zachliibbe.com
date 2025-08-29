const esbuild = require('esbuild');

module.exports = {
  bundle: true,
  minify: false,
  sourcemap: true,
  platform: 'node',
  target: 'node18',
  external: [
    '@playwright/test',
    'playwright-core',
    'chromium-bidi',
    'fsevents',
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
};
