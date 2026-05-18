"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "luti_cart_v1";

const CartContext = createContext(null);

function normalizeQty(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.floor(parsed));
}

function sanitizeItem(raw) {
  const slug = typeof raw?.slug === "string" ? raw.slug.trim() : "";
  const nomeProduto = typeof raw?.nomeProduto === "string" ? raw.nomeProduto.trim() : "";
  const precoCentavos = Math.round(Number(raw?.precoCentavos));
  const estoque = Math.max(0, Math.floor(Number(raw?.estoque ?? 0)));
  const quantity = normalizeQty(raw?.quantity);
  const imagemUrl = typeof raw?.imagemUrl === "string" ? raw.imagemUrl.trim() : "";

  if (!slug || !nomeProduto || !Number.isFinite(precoCentavos) || precoCentavos <= 0) {
    return null;
  }

  return {
    slug,
    nomeProduto,
    precoCentavos,
    estoque,
    quantity: estoque > 0 ? Math.min(quantity, estoque) : quantity,
    imagemUrl,
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsReady(true);
        return;
      }
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        setIsReady(true);
        return;
      }
      setItems(parsed.map(sanitizeItem).filter(Boolean));
    } catch {
      setItems([]);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [isReady, items]);

  function addItem(input) {
    const item = sanitizeItem(input);
    if (!item) {
      return;
    }

    setItems((previous) => {
      const index = previous.findIndex((entry) => entry.slug === item.slug);
      if (index < 0) {
        return [...previous, item];
      }
      const copy = [...previous];
      const existing = copy[index];
      const nextQty = normalizeQty(existing.quantity + item.quantity);
      const maxQty = existing.estoque > 0 ? existing.estoque : nextQty;
      copy[index] = {
        ...existing,
        ...item,
        quantity: Math.min(nextQty, maxQty),
      };
      return copy;
    });
  }

  function updateQuantity(slug, quantity) {
    const slugStr = typeof slug === "string" ? slug.trim() : "";
    if (!slugStr) {
      return;
    }
    setItems((previous) =>
      previous.map((item) => {
        if (item.slug !== slugStr) {
          return item;
        }
        const maxQty = item.estoque > 0 ? item.estoque : 99;
        return { ...item, quantity: Math.min(maxQty, normalizeQty(quantity)) };
      }),
    );
  }

  function removeItem(slug) {
    const slugStr = typeof slug === "string" ? slug.trim() : "";
    if (!slugStr) {
      return;
    }
    setItems((previous) => previous.filter((item) => item.slug !== slugStr));
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = useMemo(
    () => items.reduce((acc, item) => acc + normalizeQty(item.quantity, 0), 0),
    [items],
  );
  const subtotalCentavos = useMemo(
    () => items.reduce((acc, item) => acc + item.precoCentavos * normalizeQty(item.quantity, 0), 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      isCartOpen,
      isReady,
      totalItems,
      subtotalCentavos,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
    }),
    [isCartOpen, isReady, items, subtotalCentavos, totalItems],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider.");
  }
  return context;
}
