// DB layer is disabled for Cloudflare Workers deploy target.
// Backend persistence will be re-added via Lovable Cloud in a later phase.
// For now this is an in-memory no-op stub so client code and dev SSR work.

const memory: { agents: Record<string, unknown>[]; messages: Record<string, unknown>[] } = {
  agents: [],
  messages: [],
};

export async function query<T = Record<string, unknown>>(
  _sql: string,
  _params?: unknown[]
): Promise<T[]> {
  return [] as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  _sql: string,
  _params?: unknown[]
): Promise<T | null> {
  return null;
}

export default { memory };
