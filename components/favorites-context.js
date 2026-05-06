"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";

export const FAVORITES_STORAGE_KEY = "luti:favorites";

const FavoritesContext = createContext(null);

function normalizeSlug(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readGuestFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestToStorage(list) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
}

function toGuestEntry(product) {
  const slug = normalizeSlug(product?.slug);
  const id = product?.id != null ? String(product.id) : slug;

  return {
    id,
    slug,
    nome: product.nome,
    descricao: product.descricao ?? "",
    imagem_url: product.imagem_url ?? "",
    preco: product.preco,
    estoque: product.estoque ?? 0,
    product_id: String(product.id),
  };
}

export function FavoritesProvider({ children }) {
  const { status } = useSession();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRemote = useCallback(async () => {
    const res = await fetch("/api/favorites", { credentials: "include" });
    if (!res.ok) {
      throw new Error("Falha ao carregar favoritos.");
    }
    const data = await res.json();
    setItems(Array.isArray(data.favorites) ? data.favorites : []);
  }, []);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      setItems(readGuestFromStorage());
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const guestList = readGuestFromStorage();
        const slugs = guestList
          .map((x) => (typeof x?.slug === "string" ? x.slug.trim() : ""))
          .filter(Boolean);

        if (slugs.length > 0) {
          await fetch("/api/favorites/merge", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slugs }),
          });
          window.localStorage.removeItem(FAVORITES_STORAGE_KEY);
        }

        if (!cancelled) {
          await loadRemote();
        }
      } catch {
        if (!cancelled) {
          try {
            await loadRemote();
          } catch {
            setItems([]);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, loadRemote]);

  const refresh = useCallback(async () => {
    if (status === "authenticated") {
      setLoading(true);
      try {
        await loadRemote();
      } finally {
        setLoading(false);
      }
      return;
    }
    if (status === "unauthenticated") {
      setItems(readGuestFromStorage());
    }
  }, [status, loadRemote]);

  const isFavorite = useCallback(
    (slug) => {
      const normalizedSlug = normalizeSlug(slug);
      if (!normalizedSlug) {
        return false;
      }
      return items.some((item) => normalizeSlug(item?.slug) === normalizedSlug);
    },
    [items],
  );

  const toggleFavorite = useCallback(
    async (product) => {
      const normalizedSlug = normalizeSlug(product?.slug);
      if (!normalizedSlug) {
        return { added: false, removed: false };
      }

      if (status === "unauthenticated") {
        let added = false;
        let removed = false;
        setItems((prev) => {
          const exists = prev.some((p) => normalizeSlug(p?.slug) === normalizedSlug);
          let next;
          if (exists) {
            next = prev.filter((p) => normalizeSlug(p?.slug) !== normalizedSlug);
            removed = true;
          } else {
            next = [...prev, toGuestEntry({ ...product, slug: normalizedSlug })];
            added = true;
          }
          writeGuestToStorage(next);
          return next;
        });
        return { added, removed };
      }

      if (status !== "authenticated") {
        return { added: false, removed: false };
      }

      const favorited = items.some((p) => normalizeSlug(p?.slug) === normalizedSlug);
      const row = items.find((p) => normalizeSlug(p?.slug) === normalizedSlug);
      const productIdForApi = row?.product_id || (product?.id != null ? String(product.id) : "");
      if (!productIdForApi) {
        return { added: false, removed: false };
      }

      try {
        if (favorited) {
          const res = await fetch(
            `/api/favorites?productId=${encodeURIComponent(productIdForApi)}`,
            { method: "DELETE", credentials: "include" },
          );
          if (!res.ok) {
            throw new Error("delete favorite");
          }
          await loadRemote();
          return { added: false, removed: true };
        }

        const res = await fetch("/api/favorites", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: String(product.id) }),
        });
        if (!res.ok) {
          throw new Error("post favorite");
        }
        await loadRemote();
        return { added: true, removed: false };
      } catch {
        return { added: false, removed: false };
      }
    },
    [status, items, loadRemote],
  );

  const removeBySlug = useCallback(
    async (slug, productIdFallback) => {
      const normalizedSlug = normalizeSlug(slug);
      if (!normalizedSlug) {
        return;
      }
      if (status === "unauthenticated") {
        setItems((prev) => {
          const next = prev.filter((p) => normalizeSlug(p?.slug) !== normalizedSlug);
          writeGuestToStorage(next);
          return next;
        });
        return;
      }
      if (status !== "authenticated") {
        return;
      }
      const row = items.find((p) => normalizeSlug(p?.slug) === normalizedSlug);
      const pid = row?.product_id || productIdFallback;
      if (!pid) {
        return;
      }
      try {
        const res = await fetch(`/api/favorites?productId=${encodeURIComponent(pid)}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          await loadRemote();
        }
      } catch {
        // noop
      }
    },
    [status, items, loadRemote],
  );

  const value = useMemo(
    () => ({
      items,
      loading: status === "loading" ? true : loading,
      isFavorite,
      toggleFavorite,
      removeBySlug,
      refresh,
      isAuthenticated: status === "authenticated",
    }),
    [items, loading, status, isFavorite, toggleFavorite, removeBySlug, refresh],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites deve ser usado dentro de FavoritesProvider.");
  }
  return ctx;
}
