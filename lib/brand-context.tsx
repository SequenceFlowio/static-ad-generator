"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Brand } from "@/types";

interface BrandContextValue {
  brand: Brand | null;
  brands: Brand[];
  setBrand: (b: Brand) => void;
  loading: boolean;
}

const BrandContext = createContext<BrandContextValue>({
  brand: null,
  brands: [],
  setBrand: () => {},
  loading: true,
});

const STORAGE_KEY = "sf-selected-brand-id";

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brand, setBrandState] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/brands")
      .then(r => r.json())
      .then(d => {
        const list: Brand[] = Array.isArray(d) ? d : [];
        setBrands(list);
        try {
          const savedId = localStorage.getItem(STORAGE_KEY);
          if (savedId) {
            const found = list.find(b => b.id === savedId);
            if (found) { setBrandState(found); setLoading(false); return; }
          }
        } catch {}
        if (list.length > 0) setBrandState(list[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function setBrand(b: Brand) {
    setBrandState(b);
    try { localStorage.setItem(STORAGE_KEY, b.id); } catch {}
  }

  return (
    <BrandContext.Provider value={{ brand, brands, setBrand, loading }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
