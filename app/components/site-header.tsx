import { Link, NavLink } from "react-router";

export function SiteHeader({ dark }: { dark: boolean }) {
  return (
    <header className="relative z-20 flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 pt-5 sm:px-7 sm:pt-6">
      <Link
        to="/"
        className={`font-script -mt-1 text-[2.6rem] leading-none sm:text-5xl ${dark ? "text-white" : "text-blue"}`}
      >
        Shrimp School
      </Link>

      <nav
        aria-label="Main"
        className="font-label order-last flex w-full justify-center sm:order-none sm:w-auto sm:absolute sm:left-1/2 sm:-translate-x-1/2"
      >
        <div className="flex gap-6 bg-white px-5 py-3 text-[0.95rem] text-ink">
          <NavItem to="/" end>
            My library
          </NavItem>
          <NavItem to="/catalog">Catalog</NavItem>
          <NavItem to="/journal">Journal</NavItem>
        </div>
      </nav>

      <Link
        to="/journal/new"
        className="group font-label flex items-center gap-2 bg-white px-4 py-2.5 text-[0.95rem] text-ink transition-colors hover:bg-blue hover:text-white"
      >
        <span className="size-2 rounded-full bg-blue group-hover:bg-white" aria-hidden="true" />
        Log a roll
      </Link>
    </header>
  );
}

function NavItem({ to, end, children }: { to: string; end?: boolean; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `underline-offset-[6px] decoration-2 hover:underline ${isActive ? "underline decoration-blue" : ""}`
      }
    >
      {children}
    </NavLink>
  );
}
