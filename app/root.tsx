import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { LIST_PATHS } from "./lib/last-list";

// Icons come from art/icon.png via `npm run icon`. iOS ignores the manifest's
// icons and uses apple-touch-icon for the home screen.
export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "icon", type: "image/png", href: "/favicon-32.png", sizes: "32x32" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Instrument+Serif:ital@0;1&family=Mr+Dafoe&display=swap",
  },
];

export const meta: Route.MetaFunction = () => [
  { title: "Shrimp School" },
  { name: "description", content: "Learn jiu-jitsu moves step by step and keep a journal of how they land." },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Here rather than in meta(), which a route's own meta() replaces */}
        <meta name="theme-color" content="#f3f3f1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Shrimp School" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        {/* The list pages restore by URL, not history entry, so the move page's
            back link lands where you left off. Everything else keeps the default. */}
        <ScrollRestoration getKey={(location) => (LIST_PATHS.includes(location.pathname) ? location.pathname + location.search : location.key)} />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-[clamp(5rem,20vw,12rem)]">{message}</h1>
      <p className="mt-4 font-serif text-3xl">{details}</p>
      <a href="/" className="font-label mt-8 inline-block bg-ink px-5 py-3 text-white">
        Back to the moves
      </a>
      {stack && (
        <pre className="mt-8 w-full overflow-x-auto p-4 text-left text-sm">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
