import { createFileRoute } from "@tanstack/react-router";
import { SettlProvider } from "@/components/settl/store";
import { SettlApp } from "@/components/settl/app";

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Hisab — Your people. Clear hisab." },
    { name: "description", content: "A modern shared-expense companion. Split expenses, bring your groups over, and keep clean balances with friends." },
    { property: "og:title", content: "Hisab — Your people. Clear hisab." },
    { property: "og:description", content: "Smart group splits and clear tabs. Meet Hisab." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return <SettlProvider><SettlApp /></SettlProvider>;
}
