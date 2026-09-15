import "./bootstrap";
import "../css/app.css";
import { createInertiaApp } from "@inertiajs/react";
import type { ResolvedComponent } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";

const appName =
  (import.meta.env.VITE_APP_NAME as string) || "Logistics Management System";

createInertiaApp({
  title: (title) => `${title} — ${appName}`,
  resolve: (name) =>
    resolvePageComponent(
      `./Pages/${name}.tsx`,
      // Test files live next to the code they cover but must never
      // ship to production (the glob below is bundled eagerly).
      import.meta.glob(['./Pages/**/*.tsx', '!./Pages/**/*.test.{ts,tsx}']),
    ) as Promise<ResolvedComponent>,
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(<App {...props} />);
  },
  progress: {
    color: "#6366f1",
  },
});
