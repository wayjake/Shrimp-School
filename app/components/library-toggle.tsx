import { useFetcher } from "react-router";

// Adds a move to your library or takes it out. Posts intent=library-add or
// library-remove to the current route's action, which hands it to
// handleLibraryIntent. Shows the new state straight away rather than waiting
// for the round trip.
export function LibraryToggle({
  moveId,
  inLibrary,
  name,
  className = "",
}: {
  moveId: string;
  inLibrary: boolean;
  // For the label read to screen readers, e.g. "Add Kimura to my library"
  name: string;
  className?: string;
}) {
  const fetcher = useFetcher();
  const pending = fetcher.formData?.get("intent");
  const picked = pending ? pending === "library-add" : inLibrary;

  return (
    <fetcher.Form method="post" className={className}>
      <input type="hidden" name="moveId" value={moveId} />
      <button
        name="intent"
        value={picked ? "library-remove" : "library-add"}
        aria-label={picked ? `Remove ${name} from my library` : `Add ${name} to my library`}
        className={`group font-label inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
          picked ? "bg-ink text-white hover:bg-red" : "bg-white text-ink hover:bg-blue hover:text-white"
        }`}
      >
        {picked ? (
          <>
            <svg viewBox="0 0 20 20" className="size-4 group-hover:hidden" aria-hidden="true">
              <path d="M4 10.5 8 14.5 16 5.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
            </svg>
            <svg viewBox="0 0 20 20" className="hidden size-4 group-hover:block" aria-hidden="true">
              <path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="2.6" />
            </svg>
            <span className="group-hover:hidden">In my library</span>
            <span className="hidden group-hover:inline">Remove</span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
              <path d="M10 3v14M3 10h14" fill="none" stroke="currentColor" strokeWidth="2.6" />
            </svg>
            Add to my library
          </>
        )}
      </button>
    </fetcher.Form>
  );
}
