import { Outlet, useMatches } from "react-router";
import { SiteHeader } from "~/components/site-header";
import { Sticker } from "~/components/sticker";

// Route modules opt in with `export const handle: PageHandle`
export type PageHandle = { dark?: boolean; hideSticker?: boolean };

export default function Layout() {
  const matches = useMatches();
  const handle = (matches.at(-1)?.handle ?? {}) as PageHandle;
  const dark = !!handle.dark;

  return (
    <div className={`min-h-dvh ${dark ? "bg-ink text-white" : "bg-paper text-ink"}`}>
      <SiteHeader dark={dark} />
      <main className="px-4 pt-10 pb-36 sm:px-7 sm:pt-14">
        <Outlet />
      </main>
      {!handle.hideSticker && <Sticker />}
    </div>
  );
}
