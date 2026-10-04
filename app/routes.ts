import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/library.tsx"),
    route("moves/new", "routes/move-new.tsx"),
    route("moves/:moveId", "routes/move.tsx"),
    route("moves/:moveId/edit", "routes/move-edit.tsx"),
    route("journal", "routes/journal.tsx"),
    route("journal/new", "routes/journal-new.tsx"),
    route("journal/:entryId/edit", "routes/journal-edit.tsx"),
  ]),

  // Uploaded photos and clips, from uploads/
  route("media/:file", "routes/media.ts"),
] satisfies RouteConfig;
