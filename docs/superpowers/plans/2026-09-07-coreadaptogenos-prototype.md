# Core Adaptógenos Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive, navigable Spanish-language storefront prototype with a persistent cart, WhatsApp manual ordering, and a simulated WooCommerce-style checkout.

**Architecture:** A React/Vite single-page application uses route-focused pages, a `CommerceProvider` boundary for catalog access, and a reducer-backed cart persisted to `localStorage`. Checkout logic is isolated from presentation so the local demo provider can later be replaced by WooCommerce Store API without rebuilding the UI.

**Tech Stack:** React, TypeScript, Vite, React Router, Vitest, React Testing Library, CSS modules/global tokens, browser `localStorage`.

**Spec:** `docs/superpowers/specs/2026-09-07-coreadaptogenos-prototype-design.md`

## Global Constraints

- All customer-facing copy is Spanish and avoids therapeutic claims, diagnoses, treatments, guaranteed outcomes, and real legal advice.
- Visual direction is Botica lunar: ink blue, deep violet, electric lime, mineral pink, expressive serif headlines, geometric sans UI.
- Do not reuse CoreMushroom code, copy, assets, palette, typography, homepage structure, product-card structure, or botanical/earthy motifs.
- The prototype must work from 360 px through wide desktop layouts and respect `prefers-reduced-motion`.
- The normal checkout is demonstrative only and must never request real card details.
- Product names, prices, ingredients, WhatsApp number, and lot values are demo data and must be easy to replace.

---

### Task 1: Application shell and design system

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/App.test.tsx`
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/test/setup.ts`

**Interfaces:**
- Consumes: none.
- Produces: `App(): JSX.Element`, shared CSS custom properties, and the test/build commands used by all later tasks.

- [ ] **Step 1: Scaffold the project and install dependencies**

Run:

```powershell
npm create vite@latest . -- --template react-ts
npm install react-router-dom
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Keep the existing `docs/` and `.gitignore`. Add scripts `dev`, `build`, `lint`, `test`, and `test:run` to `package.json`; `test:run` must execute `vitest run`.

- [ ] **Step 2: Write the failing application-shell test**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

it('renders the Core Adaptógenos navigation', () => {
  render(<MemoryRouter><App /></MemoryRouter>);
  expect(screen.getByRole('link', { name: /core adaptógenos/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /tienda/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /carrito/i })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test:run -- src/app/App.test.tsx`

Expected: FAIL because `App` and the navigation do not exist.

- [ ] **Step 4: Implement the shell and tokens**

`App.tsx` must render a skip link, header, `<main id="contenido">`, and footer. Define routes for all spec paths with temporary semantic headings so navigation never reaches a blank screen. Use these exact core tokens:

```css
:root {
  --ink: #0c0b2e;
  --violet: #24205e;
  --violet-soft: #3a3479;
  --moon: #f7f3ff;
  --lime: #c9ff4a;
  --mineral: #ff779c;
  --mist: #aaa6c5;
  --danger: #ff6b6b;
  --radius-sm: 0.75rem;
  --radius-md: 1.5rem;
  --radius-pill: 999px;
  --content: min(1180px, calc(100vw - 2rem));
  --font-display: Georgia, 'Times New Roman', serif;
  --font-ui: Inter, Arial, sans-serif;
}
```

Set dark color scheme, visible `:focus-visible`, 44 px minimum control height, fluid type with `clamp()`, and a reduced-motion media query.

- [ ] **Step 5: Verify the shell**

Run: `npm run test:run -- src/app/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json vite.config.ts tsconfig*.json index.html src
git commit -m "feat: scaffold lunar storefront shell"
```

---

### Task 2: Commerce provider and demo catalog

**Files:**
- Create: `src/commerce/types.ts`
- Create: `src/commerce/CommerceProvider.ts`
- Create: `src/commerce/LocalCommerceProvider.ts`
- Create: `src/commerce/LocalCommerceProvider.test.ts`
- Create: `src/data/products.ts`

**Interfaces:**
- Consumes: TypeScript project from Task 1.
- Produces: `Product`, `ProductFormat`, `RitualMoment`, `CommerceProvider.listProducts(filters?)`, `CommerceProvider.getProduct(slug)`, and singleton `commerce`.

- [ ] **Step 1: Define the public catalog contract in a failing test**

```ts
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
```

- [ ] **Step 2: Run the provider test to verify it fails**

Run: `npm run test:run -- src/commerce/LocalCommerceProvider.test.ts`

Expected: FAIL because the provider modules do not exist.

- [ ] **Step 3: Implement types and provider**

Use this contract:

```ts
export type ProductFormat = 'extracto' | 'mezcla' | 'cacao';
export type RitualMoment = 'mañana' | 'cotidiano' | 'noche';

export interface Product {
  id: string;
  slug: string;
  name: string;
  formula: string;
  format: ProductFormat;
  moments: RitualMoment[];
  price: number;
  size: string;
  ingredients: string[];
  lot: string;
  color: 'lime' | 'mineral' | 'lavender';
  featured: boolean;
  description: string;
}

export interface ProductFilters {
  format?: ProductFormat;
  moment?: RitualMoment;
}

export interface CommerceProvider {
  listProducts(filters?: ProductFilters): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | undefined>;
}
```

Create exactly six clearly fictional products: `Órbita 01`, `Pulso 02`, `Umbral 03`, `Halo 04`, `Nébula 05`, and `Savia 06`. Use MXN integer prices and neutral composition-focused descriptions. `listProducts` returns copies and applies both filters when present.

- [ ] **Step 4: Verify the provider**

Run: `npm run test:run -- src/commerce/LocalCommerceProvider.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/commerce src/data
git commit -m "feat: add replaceable local commerce provider"
```

---

### Task 3: Persistent cart domain

**Files:**
- Create: `src/cart/types.ts`
- Create: `src/cart/cartReducer.ts`
- Create: `src/cart/cartReducer.test.ts`
- Create: `src/cart/storage.ts`
- Create: `src/cart/storage.test.ts`
- Create: `src/cart/CartContext.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `Product` from Task 2.
- Produces: `CartItem`, `CartState`, `cartReducer`, `loadCart`, `saveCart`, and `useCart()` with `items`, `count`, `subtotal`, `add`, `setQuantity`, `remove`, and `clear`.

- [ ] **Step 1: Write failing reducer and storage tests**

```ts
import { cartReducer, initialCartState } from './cartReducer';
import { loadCart } from './storage';

it('adds the same product by increasing quantity', () => {
  const once = cartReducer(initialCartState, { type: 'add', productId: 'orbita-01', quantity: 1 });
  const twice = cartReducer(once, { type: 'add', productId: 'orbita-01', quantity: 2 });
  expect(twice.items).toEqual([{ productId: 'orbita-01', quantity: 3 }]);
});

it('returns an empty cart for corrupt persisted data', () => {
  localStorage.setItem('coreadaptogenos-cart', '{broken');
  expect(loadCart()).toEqual({ items: [] });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/cart`

Expected: FAIL because cart modules do not exist.

- [ ] **Step 3: Implement reducer and defensive persistence**

Supported actions are `add`, `setQuantity`, `remove`, `clear`. Clamp quantity to integers from 1 through 20; `setQuantity` with zero removes the item. `loadCart` accepts only an object with an `items` array containing string `productId` and valid numeric `quantity`; all other input returns `{ items: [] }`.

`CartProvider` must derive subtotal by joining current items with products from `commerce.listProducts()`, persist after reducer changes, and expose a non-blocking `storageWarning` string if `localStorage.setItem` throws.

- [ ] **Step 4: Verify cart logic**

Run: `npm run test:run -- src/cart`

Expected: PASS.

- [ ] **Step 5: Wire the provider and commit**

Wrap `<App />` with `<CartProvider>` in `main.tsx`.

```powershell
git add src/cart src/main.tsx
git commit -m "feat: add resilient persistent cart"
```

---

### Task 4: Homepage, catalog, and product detail

**Files:**
- Create: `src/components/layout/SiteHeader.tsx`
- Create: `src/components/layout/SiteFooter.tsx`
- Create: `src/components/product/ProductCard.tsx`
- Create: `src/components/product/ProductVisual.tsx`
- Create: `src/components/product/ProductGrid.tsx`
- Create: `src/pages/HomePage.tsx`
- Create: `src/pages/ShopPage.tsx`
- Create: `src/pages/ProductPage.tsx`
- Create: `src/pages/NotFoundPage.tsx`
- Create: `src/pages/storefront.test.tsx`
- Create: `src/styles/storefront.css`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `commerce`, `Product`, and `useCart()`.
- Produces: routed customer-facing discovery flow and reusable `ProductCard({ product })`.

- [ ] **Step 1: Write a failing discovery-flow test**

```tsx
it('moves from the catalog to a product and adds it to the cart', async () => {
  const user = userEvent.setup();
  renderTestApp('/tienda');
  await user.click(await screen.findByRole('link', { name: /órbita 01/i }));
  expect(await screen.findByRole('heading', { name: /órbita 01/i })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /agregar al carrito/i }));
  expect(screen.getByRole('link', { name: /carrito, 1 producto/i })).toBeInTheDocument();
});
```

Create `renderTestApp(route)` in the test using `MemoryRouter`, `CartProvider`, and `App`.

- [ ] **Step 2: Run the storefront test to verify it fails**

Run: `npm run test:run -- src/pages/storefront.test.tsx`

Expected: FAIL because the real pages and product flow do not exist.

- [ ] **Step 3: Implement the approved Botica lunar storefront**

Homepage order:

1. asymmetric hero with “Tu ritual empieza adentro”, a primary catalog link, and one abstract bottle composition;
2. three neutral ritual-moment links;
3. featured horizontal product rail;
4. “Materia / Método / Lote” process section;
5. editorial journal teaser and final call to action.

Catalog filters use native buttons with `aria-pressed`. Product cards use tall arched visuals, formula numbers, format, name, size, price, and a text link; do not use 4:3 photography tiles or species-colored badges. Product detail includes composition, ingredients, lot, quantity, and add action. Unknown slugs render `NotFoundPage` with a catalog link.

- [ ] **Step 4: Verify discovery and accessibility semantics**

Run: `npm run test:run -- src/pages/storefront.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/app src/components src/pages src/styles/storefront.css
git commit -m "feat: build lunar catalog discovery flow"
```

---

### Task 5: Cart page and mini-cart feedback

**Files:**
- Create: `src/components/cart/CartLine.tsx`
- Create: `src/components/cart/AddToCartToast.tsx`
- Create: `src/pages/CartPage.tsx`
- Create: `src/pages/CartPage.test.tsx`
- Create: `src/styles/cart.css`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `useCart()` and `commerce.listProducts()`.
- Produces: editable cart UI and checkout navigation.

- [ ] **Step 1: Write the failing cart interaction test**

```tsx
it('updates quantity, removes a line, and exposes checkout', async () => {
  const user = userEvent.setup();
  renderCartWithItem('orbita-01', 1);
  await user.click(await screen.findByRole('button', { name: /aumentar órbita 01/i }));
  expect(screen.getByText('2', { selector: '[data-quantity]' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /elegir cómo pedir/i })).toHaveAttribute('href', '/checkout');
  await user.click(screen.getByRole('button', { name: /eliminar órbita 01/i }));
  expect(screen.getByText(/tu carrito está en pausa/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the cart-page test to verify it fails**

Run: `npm run test:run -- src/pages/CartPage.test.tsx`

Expected: FAIL because the cart page does not exist.

- [ ] **Step 3: Implement the cart UI**

Use stepper buttons labeled per product, an always-visible formatted MXN subtotal, a neutral note that shipping is confirmed later, and a single primary action to `/checkout`. Empty state text is “Tu carrito está en pausa” with a link to `/tienda`. Announce add/remove changes through an `aria-live="polite"` toast.

- [ ] **Step 4: Verify the cart page**

Run: `npm run test:run -- src/pages/CartPage.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/cart src/pages/CartPage* src/styles/cart.css src/app/App.tsx
git commit -m "feat: add editable cart experience"
```

---

### Task 6: WhatsApp and simulated normal checkout

**Files:**
- Create: `src/checkout/order.ts`
- Create: `src/checkout/order.test.ts`
- Create: `src/checkout/whatsapp.ts`
- Create: `src/checkout/whatsapp.test.ts`
- Create: `src/pages/CheckoutChoicePage.tsx`
- Create: `src/pages/WhatsAppReviewPage.tsx`
- Create: `src/pages/NormalCheckoutPage.tsx`
- Create: `src/pages/CheckoutSuccessPage.tsx`
- Create: `src/pages/checkout-flow.test.tsx`
- Create: `src/styles/checkout.css`
- Create: `.env.example`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: resolved cart lines from Tasks 2–5.
- Produces: `createOrderId(now, random)`, `buildWhatsAppMessage(order)`, `buildWhatsAppUrl(phone, message)`, manual review route, and simulated standard checkout route.

- [ ] **Step 1: Write failing order-message tests**

```ts
it('builds a readable encoded WhatsApp order', () => {
  const message = buildWhatsAppMessage({
    id: 'CA-260907-AB12',
    lines: [{ name: 'Órbita 01', size: '30 ml', quantity: 2, unitPrice: 690 }],
    subtotal: 1380,
  });
  expect(message).toContain('Pedido CA-260907-AB12');
  expect(message).toContain('2 × Órbita 01');
  expect(message).toContain('$1,380.00 MXN');
  expect(buildWhatsAppUrl('5215512345678', message)).toMatch(/^https:\/\/wa\.me\/5215512345678\?text=/);
});

it('rejects a missing phone number', () => {
  expect(() => buildWhatsAppUrl('', 'pedido')).toThrow('WhatsApp no configurado');
});
```

- [ ] **Step 2: Run checkout-domain tests to verify they fail**

Run: `npm run test:run -- src/checkout`

Expected: FAIL because checkout utilities do not exist.

- [ ] **Step 3: Implement deterministic order utilities**

`createOrderId` returns `CA-YYMMDD-XXXX`, where `XXXX` is four uppercase alphanumeric characters supplied through the injected random function. `buildWhatsAppMessage` includes the greeting, order ID, every line, subtotal, and “Confírmame disponibilidad, envío y forma de pago, por favor.” `buildWhatsAppUrl` strips spaces, plus signs, and punctuation from the phone before validation and uses `encodeURIComponent` exactly once.

- [ ] **Step 4: Implement checkout routes**

`/checkout` presents two distinct cards: WhatsApp is primary and “Pago en línea” is secondary. WhatsApp review lists the full order before opening the external link. Read the number from `import.meta.env.VITE_WHATSAPP_NUMBER`; `.env.example` contains `VITE_WHATSAPP_NUMBER=5215512345678` and labels it as demo data in an adjacent comment.

If no valid phone exists, show a “Copiar pedido” button using `navigator.clipboard.writeText`. The normal checkout asks only for name, email, phone, street, city, state, postal code, shipping option, and a fake payment selector named “Pago simulado”; never ask for a card number. Successful validation routes to `/checkout/listo` and states that no order or payment was transmitted.

- [ ] **Step 5: Write and run the two route-flow tests**

The test must add a product, visit `/checkout`, assert both choices, open the WhatsApp review and inspect the generated link. A second test selects normal checkout, submits empty fields to verify accessible errors, fills required fields, and reaches the simulated confirmation.

Run: `npm run test:run -- src/pages/checkout-flow.test.tsx src/checkout`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add .env.example src/checkout src/pages/Checkout* src/pages/WhatsAppReviewPage.tsx src/pages/NormalCheckoutPage.tsx src/styles/checkout.css src/app/App.tsx
git commit -m "feat: add manual and simulated checkout paths"
```

---

### Task 7: Supporting pages, responsive polish, and release verification

**Files:**
- Create: `src/pages/AboutPage.tsx`
- Create: `src/pages/JournalPage.tsx`
- Create: `src/components/layout/MobileMenu.tsx`
- Create: `src/app/full-flow.test.tsx`
- Create: `README.md`
- Modify: `src/components/layout/SiteHeader.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/styles/storefront.css`
- Modify: `src/styles/cart.css`
- Modify: `src/styles/checkout.css`

**Interfaces:**
- Consumes: all earlier public interfaces.
- Produces: complete prototype, setup instructions, responsive navigation, and release-level verification evidence.

- [ ] **Step 1: Write the failing full-flow test**

```tsx
it('completes the recommended manual ordering journey', async () => {
  const user = userEvent.setup();
  renderTestApp('/');
  await user.click(screen.getByRole('link', { name: /explorar fórmulas/i }));
  await user.click(await screen.findByRole('link', { name: /órbita 01/i }));
  await user.click(screen.getByRole('button', { name: /agregar al carrito/i }));
  await user.click(screen.getByRole('link', { name: /carrito, 1 producto/i }));
  await user.click(screen.getByRole('link', { name: /elegir cómo pedir/i }));
  await user.click(screen.getByRole('link', { name: /pedir por whatsapp/i }));
  expect(await screen.findByRole('heading', { name: /revisa tu pedido/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the full-flow test to verify gaps**

Run: `npm run test:run -- src/app/full-flow.test.tsx`

Expected: FAIL until navigation labels and final routes are consistently wired.

- [ ] **Step 3: Finish supporting pages and mobile navigation**

`AboutPage` contains origin, extraction-process demonstration, traceability principles, and a professional-review disclaimer. `JournalPage` contains three clearly fictional article cards without medical claims. `MobileMenu` is a full-screen dialog with close button, Escape handling, focus return, and body scroll lock.

Add responsive rules for 360, 768, and 1180 px behavior without introducing fixed-width overflow. Ensure decorative orbit elements use `aria-hidden="true"` and meaningful product information remains text.

- [ ] **Step 4: Document local use and WooCommerce handoff**

`README.md` must include:

```text
npm install
Copy-Item .env.example .env.local
npm run dev
npm run test:run
npm run build
```

Explain that `LocalCommerceProvider` is demo-only, `VITE_WHATSAPP_NUMBER` must be replaced, payment is not real, and a later `WooCommerceProvider` should implement the existing interface using Store API.

- [ ] **Step 5: Run all automated verification**

Run each command independently:

```powershell
npm run lint
npm run test:run
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 6: Run browser smoke checks**

Start `npm run dev -- --host 127.0.0.1`, then inspect at 360 × 800, 768 × 1024, and 1440 × 1000. Verify navigation, filters, product detail, quantity editing, WhatsApp review, fallback copy action, simulated checkout validation, keyboard focus, and reduced motion. Record any corrections in the affected CSS/component files and rerun Step 5.

- [ ] **Step 7: Compare against the prohibited reference patterns**

Confirm the final prototype has none of these CoreMushroom traits: cream/forest base palette, Fraunces/Figtree pairing, 4:3 white product cards, species-colored badges, format-tile homepage, botanical illustrations, or copied copy/assets. Add the result to `README.md` under “Identidad independiente”.

- [ ] **Step 8: Commit**

```powershell
git add README.md src
git commit -m "feat: complete responsive storefront prototype"
```
