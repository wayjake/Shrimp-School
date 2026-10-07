import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { CATEGORY_LABEL, isCategory } from "./moves";

// The library or catalog view you last browsed, filter included, so a move
// page can send you back to it. Cards pass it as link state, which is there on
// the first render. sessionStorage covers a reload or a trip through the edit
// page, where the state is gone.
const KEY = "shrimp:last-list";

// The two list pages, the only URLs worth returning to
export const LIST_PATHS = ["/", "/catalog"];

export function useRememberList() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, pathname + search);
    } catch {}
  }, [pathname, search]);
}

export function useLastList() {
  const state = useLocation().state as { list?: string } | null;
  const [stored, setStored] = useState<string | null>(null);
  useEffect(() => {
    try {
      setStored(sessionStorage.getItem(KEY));
    } catch {}
  }, []);
  const list = state?.list ?? stored;
  if (!list) return null;

  const url = new URL(list, "http://x");
  if (!LIST_PATHS.includes(url.pathname)) return null;
  const type = url.searchParams.get("type");
  const place = url.pathname === "/catalog" ? "Catalog" : "My library";
  return { to: list, label: isCategory(type) ? `${place} · ${CATEGORY_LABEL[type]}` : place };
}
