import { LocalCommerceProvider } from './LocalCommerceProvider';

const provider = new LocalCommerceProvider();

it('filters products by format and ritual moment', async () => {
  const products = await provider.listProducts({ format: 'extracto', moment: 'mañana' });

  expect(products.length).toBeGreaterThan(0);
  expect(products.every((product) => product.format === 'extracto')).toBe(true);
  expect(products.every((product) => product.moments.includes('mañana'))).toBe(true);
});

it('returns undefined for an unknown slug', async () => {
  await expect(provider.getProduct('no-existe')).resolves.toBeUndefined();
});
