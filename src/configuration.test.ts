/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

it('ships without an active WhatsApp destination and documents explicit verification', () => {
  const envExample = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8');
  const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');

  expect(envExample).toMatch(/^VITE_WHATSAPP_NUMBER=\s*$/m);
  expect(readme).toMatch(/220 644 6651/);
  expect(readme).toMatch(/configúralo.*únicamente al publicar un catálogo real/i);
  expect(readme).toMatch(/prototipo no (?:los )?guarda ni los transmite.*navegador puede conservar/i);
});

it('ships an Apache SPA fallback for direct client-side routes', () => {
  const htaccess = readFileSync(resolve(process.cwd(), 'public/.htaccess'), 'utf8');

  expect(htaccess.replace(/\r\n/g, '\n').trim()).toBe(
    [
      '<IfModule mod_rewrite.c>',
      '  RewriteEngine On',
      '  RewriteBase /',
      '  RewriteRule ^index\\.html$ - [L]',
      '  RewriteCond %{REQUEST_FILENAME} !-f',
      '  RewriteCond %{REQUEST_FILENAME} !-d',
      '  RewriteRule . /index.html [L]',
      '</IfModule>',
    ].join('\n'),
  );
});
