/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

it('ships without an active WhatsApp destination and documents explicit verification', () => {
  const envExample = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8');
  const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');

  expect(envExample).toMatch(/^VITE_WHATSAPP_NUMBER=\s*$/m);
  expect(readme).toMatch(/configura explícitamente.*número.*verificado/i);
  expect(readme).toMatch(/prototipo no (?:los )?guarda ni los transmite.*navegador puede conservar/i);
});
