import {
  EVENT_ADD_TO_CART,
  EVENT_CART_UPDATED,
  EVENT_CHECKOUT_COMPLETED,
  addToCartEventSchema,
  cartUpdatedEventSchema,
  checkoutCompletedEventSchema,
  type AddToCartEvent,
  type CartUpdatedEvent,
  type CheckoutCompletedEvent
} from '@tokomicro/contracts';

/**
 * Event bus kecil di atas CustomEvent.
 *
 * Remote tidak saling mengimpor. Mereka hanya sepakat pada nama event dan
 * bentuk payload — kontrak yang divalidasi dengan Zod di sisi penerima.
 */

function dispatch<T>(name: string, detail: T): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function listen<T>(
  name: string,
  handler: (detail: T) => void,
  parser: { safeParse(value: unknown): { success: true; data: T } | { success: false } }
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    const parsed = parser.safeParse(detail);
    if (!parsed.success) {
      console.warn(`[shared] payload event "${name}" tidak valid dan diabaikan.`);
      return;
    }
    handler(parsed.data);
  };

  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}

export function emitAddToCart(payload: AddToCartEvent): void {
  dispatch(EVENT_ADD_TO_CART, payload);
}

export function onAddToCart(handler: (payload: AddToCartEvent) => void): () => void {
  return listen(EVENT_ADD_TO_CART, handler, addToCartEventSchema);
}

export function emitCartUpdated(payload: CartUpdatedEvent): void {
  dispatch(EVENT_CART_UPDATED, payload);
}

export function onCartUpdated(handler: (payload: CartUpdatedEvent) => void): () => void {
  return listen(EVENT_CART_UPDATED, handler, cartUpdatedEventSchema);
}

export function emitCheckoutCompleted(payload: CheckoutCompletedEvent): void {
  dispatch(EVENT_CHECKOUT_COMPLETED, payload);
}

export function onCheckoutCompleted(
  handler: (payload: CheckoutCompletedEvent) => void
): () => void {
  return listen(EVENT_CHECKOUT_COMPLETED, handler, checkoutCompletedEventSchema);
}

/**
 * Sinkronisasi keranjang lintas tab. BroadcastChannel tidak tersedia di semua
 * browser lama, jadi pemanggil harus menyiapkan fallback.
 */
export function createCartChannel(
  onMessage: (payload: AddToCartEvent) => void
): { post: (payload: AddToCartEvent) => void; close: () => void } | null {
  if (typeof BroadcastChannel === 'undefined') return null;

  const channel = new BroadcastChannel('tokomicro-cart');
  channel.onmessage = (event: MessageEvent<unknown>) => {
    const parsed = addToCartEventSchema.safeParse(event.data);
    if (parsed.success) onMessage(parsed.data);
  };

  return {
    post: (payload) => channel.postMessage(payload),
    close: () => channel.close()
  };
}
