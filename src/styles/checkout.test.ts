/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const checkoutCss = readFileSync(resolve(process.cwd(), 'src/styles/checkout.css'), 'utf8');
const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

const hexToken = (name: string): string => {
  const match = tokensCss.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'));
  if (!match) throw new Error(`Missing hex token: ${name}`);
  return match[1];
};

const luminance = (hex: string): number => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrast = (first: string, second: string): number => {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};

it('uses a 3:1 contrast border for normal checkout fields without changing dividers', () => {
  const fields = checkoutCss.match(/\.checkout-field input, \.checkout-field select \{[^}]+\}/)?.[0];
  expect(fields).toMatch(/border:\s*1px solid var\(--mist\)/);
  expect(contrast(hexToken('mist'), hexToken('violet'))).toBeGreaterThanOrEqual(3);

  const summaryDivider = checkoutCss.match(/\.order-summary li \{[^}]+\}/)?.[0];
  expect(summaryDivider).toMatch(/border-bottom:\s*1px solid var\(--line\)/);
});
