type AddToCartToastProps = {
  message: string;
};

export function AddToCartToast({ message }: AddToCartToastProps) {
  if (!message) return null;

  return (
    <p className="cart-toast" aria-live="polite" role="status">
      {message}
    </p>
  );
}
