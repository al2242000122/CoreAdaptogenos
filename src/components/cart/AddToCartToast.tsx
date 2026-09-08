type AddToCartToastProps = {
  message: string;
};

export function AddToCartToast({ message }: AddToCartToastProps) {
  return (
    <p className="cart-toast" aria-live="polite" role="status">
      {message}
    </p>
  );
}
