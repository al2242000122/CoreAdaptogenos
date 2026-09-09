export const MIN_PRODUCT_QUANTITY = 1;
export const MAX_PRODUCT_QUANTITY = 20;

export const normalizeProductQuantity = (quantity: number): number => {
  if (!Number.isFinite(quantity)) return MIN_PRODUCT_QUANTITY;
  return Math.min(
    MAX_PRODUCT_QUANTITY,
    Math.max(MIN_PRODUCT_QUANTITY, Math.trunc(quantity)),
  );
};
