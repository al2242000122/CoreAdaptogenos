import { useLayoutEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
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
import { AboutPage } from '../pages/AboutPage';
import { JournalPage } from '../pages/JournalPage';
import { AddToCartToast } from '../components/cart/AddToCartToast';
import { useCart } from '../cart/CartContext';
import '../styles/storefront.css';
import '../styles/cart.css';
import '../styles/checkout.css';

function CartFeedback() {
  const { announcement } = useCart();
  return <AddToCartToast message={announcement} />;
}

export function App() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  const main = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    document.documentElement.scrollTo?.({ top: 0, left: 0, behavior: 'instant' });
    main.current?.focus({ preventScroll: true });
  }, [pathname]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <SiteHeader />

      <main ref={main} id="contenido" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tienda" element={<ShopPage />} />
          <Route path="/producto/:slug" element={<ProductPage />} />
          <Route path="/nosotros" element={<AboutPage />} />
          <Route path="/diario" element={<JournalPage />} />
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
