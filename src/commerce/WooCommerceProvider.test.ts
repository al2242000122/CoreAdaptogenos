import { WooCommerceProvider } from './WooCommerceProvider';

afterEach(() => vi.restoreAllMocks());

it('maps Store API products into the storefront contract', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([
    {
      id: 42,
      name: 'Extracto de Reishi',
      slug: 'extracto-reishi',
      sku: 'REI-42',
      short_description: '<p>30 ml · extracto de reishi</p>',
      prices: { price: '78000', currency_minor_unit: 2 },
      images: [{ src: 'https://shop.test/reishi.jpg' }],
      categories: [{ name: 'Extractos', slug: 'extractos' }],
      tags: [{ name: 'Mañana', slug: 'manana' }],
    },
  ]), { status: 200 }));

  const [product] = await new WooCommerceProvider('https://shop.test/').listProducts({ format: 'extracto' });

  expect(product).toMatchObject({
    id: '42',
    slug: 'extracto-reishi',
    name: 'Extracto de Reishi',
    price: 780,
    size: '30 ml',
    format: 'extracto',
    moments: ['mañana'],
    imageUrl: 'https://shop.test/reishi.jpg',
  });
  expect(fetchSpy).toHaveBeenCalledWith(
    'https://shop.test/wp-json/wc/store/v1/products?per_page=100&page=1&status=publish',
    expect.objectContaining({ headers: { Accept: 'application/json' } }),
  );
});

it('returns undefined when a slug is not present', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]', { status: 200 }));
  await expect(new WooCommerceProvider('https://shop.test').getProduct('no existe')).resolves.toBeUndefined();
});

it('omits variable products and products without a valid price', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([
    { id: 1, name: 'Variable', slug: 'variable', has_options: true, prices: { price: '1000', currency_minor_unit: 2 } },
    { id: 2, name: 'Sin precio', slug: 'sin-precio', prices: {} },
    { id: 3, name: 'Simple', slug: 'simple', prices: { price: '1000', currency_minor_unit: 2 } },
  ]), { status: 200 }));

  await expect(new WooCommerceProvider('https://shop.test').listProducts()).resolves.toHaveLength(1);
});

it('follows Store API pagination using the exposed total-pages header', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1, name: 'Uno', slug: 'uno', prices: { price: '1000' } }]), { status: 200, headers: { 'X-WP-TotalPages': '2' } }))
    .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 2, name: 'Dos', slug: 'dos', prices: { price: '2000' } }]), { status: 200, headers: { 'X-WP-TotalPages': '2' } }));

  await expect(new WooCommerceProvider('https://shop.test').listProducts()).resolves.toHaveLength(2);
  expect(fetchSpy.mock.calls[1][0]).toContain('page=2');
});
