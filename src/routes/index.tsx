import { createFileRoute } from "@tanstack/react-router";
import { SettlProvider } from "@/components/settl/store";
import { SettlApp } from "@/components/settl/app";

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Settl — Your people. Clear tabs." },
    { name: "description", content: "A thoughtful shared-expense companion. Split expenses, bring your groups over, and settle up with your people." },
    { property: "og:title", content: "Settl — Your people. Clear tabs." },
    { property: "og:description", content: "Shared moments, clearly split. Meet Settl, your thoughtful expense companion." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return <SettlProvider><SettlApp /></SettlProvider>;
}
