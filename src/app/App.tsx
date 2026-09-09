import { Route, Routes } from 'react-router-dom';
import { SiteHeader } from '../components/layout/SiteHeader';
import { SiteFooter } from '../components/layout/SiteFooter';
import { HomePage } from '../pages/HomePage';
import { ShopPage } from '../pages/ShopPage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutSession } from '../checkout/CheckoutSession';
import { CheckoutChoicePage } from '../pages/CheckoutChoicePage';
import { WhatsAppReviewPage } from '../pages/WhatsAppReviewPage';
import { NormalCheckoutPage } from '../pages/NormalCheckoutPage';
import { CheckoutSuccessPage } from '../pages/CheckoutSuccessPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AddToCartToast } from '../components/cart/AddToCartToast';
import { useCart } from '../cart/CartContext';
import '../styles/storefront.css';
import '../styles/cart.css';
import '../styles/checkout.css';

type PlaceholderPageProps = {
  description: string;
  title: string;
};

function PlaceholderPage({ description, title }: PlaceholderPageProps) {
  return (
    <section aria-labelledby="page-title">
      <p className="eyebrow">Core Adaptógenos</p>
      <h1 id="page-title">{title}</h1>
      <p>{description}</p>
    </section>
  );
}

function CartFeedback() {
  const { announcement } = useCart();
  return <AddToCartToast message={announcement} />;
}

export function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <SiteHeader />

      <main id="contenido" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tienda" element={<ShopPage />} />
          <Route path="/producto/:slug" element={<ProductPage />} />
          <Route
            path="/nosotros"
            element={
              <PlaceholderPage
                title="Nosotros"
                description="Conoce nuestro proceso y principios de trazabilidad."
              />
            }
          />
          <Route
            path="/diario"
            element={
              <PlaceholderPage
                title="Diario"
                description="Notas para acompañar tu ritual cotidiano."
              />
            }
          />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutSession />}>
            <Route index element={<CheckoutChoicePage />} />
            <Route path="whatsapp" element={<WhatsAppReviewPage />} />
            <Route path="normal" element={<NormalCheckoutPage />} />
            <Route path="listo" element={<CheckoutSuccessPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <CartFeedback />
      </main>

      <SiteFooter />
    </div>
  );
}
