import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
import {
  getDashboardSummary,
  addExpense,
  toggleExpenseDelete,
  updateProfile,
  addFriend,
  addGroup,
  settleWithPerson,
} from "./server/ledger";

// API Router for Hisab backend
async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (!pathname.startsWith("/api/")) {
    return null;
  }

  const jsonHeaders = {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: jsonHeaders, status: 204 });
  }

  try {
    if (pathname === "/api/v1/dashboard" && request.method === "GET") {
      const dashboard = getDashboardSummary();
      return new Response(JSON.stringify(dashboard), { headers: jsonHeaders });
    }

    if (pathname === "/api/v1/expenses") {
      if (request.method === "GET") {
        const dashboard = getDashboardSummary();
        const includeDeleted = url.searchParams.get("deleted") === "true";
        const group = url.searchParams.get("group");
        let list = dashboard.expenses;
        if (!includeDeleted) {
          list = list.filter((e) => !e.deleted);
        }
        if (group) {
          list = list.filter((e) => e.group === group);
        }
        return new Response(JSON.stringify({ expenses: list }), { headers: jsonHeaders });
      }

      if (request.method === "POST") {
        const body = await request.json();
        const created = addExpense(body);
        return new Response(JSON.stringify(created), { headers: jsonHeaders, status: 201 });
      }
    }

    if (pathname.startsWith("/api/v1/expenses/") && pathname.endsWith("/toggle-delete") && request.method === "POST") {
      const parts = pathname.split("/");
      const id = parts[4];
      const updated = toggleExpenseDelete(id);
      if (!updated) {
        return new Response(JSON.stringify({ error: "Expense not found" }), { headers: jsonHeaders, status: 404 });
      }
      return new Response(JSON.stringify(updated), { headers: jsonHeaders });
    }

    if (pathname === "/api/v1/settle" && request.method === "POST") {
      const { person } = await request.json();
      if (!person) {
        return new Response(JSON.stringify({ error: "Person is required" }), { headers: jsonHeaders, status: 400 });
      }
      const res = settleWithPerson(person);
      return new Response(JSON.stringify(res), { headers: jsonHeaders });
    }

    if (pathname === "/api/v1/profile") {
      if (request.method === "GET") {
        const dashboard = getDashboardSummary();
        return new Response(JSON.stringify(dashboard.profile), { headers: jsonHeaders });
      }
      if (request.method === "POST" || request.method === "PUT") {
        const body = await request.json();
        const updated = updateProfile(body);
        return new Response(JSON.stringify(updated), { headers: jsonHeaders });
      }
    }

    if (pathname === "/api/v1/friends" && request.method === "POST") {
      const { name } = await request.json();
      const friends = addFriend(name);
      return new Response(JSON.stringify({ friends }), { headers: jsonHeaders });
    }

    if (pathname === "/api/v1/groups" && request.method === "POST") {
      const body = await request.json();
      const groups = addGroup(body);
      return new Response(JSON.stringify({ groups }), { headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: "Not Found" }), { headers: jsonHeaders, status: 404 });
  } catch (err) {
    console.error("API error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error", message: String(err) }), {
      headers: jsonHeaders,
      status: 500,
    });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const apiResponse = await handleApiRequest(request);
      if (apiResponse) {
        return apiResponse;
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
