interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Statistical Office of the Republic of Slovenia (SURS) — SiStat PxWeb MCP.
 *
 * Keyless PxWeb v1 API. Base: https://pxweb.stat.si/SiStatData/api/v1/en
 * Note the extra /Data/ segment after /en that holds the table tree.
 *
 * Tree nodes: type "l" = folder, type "t" = table. The SiStat root (/Data/)
 * is flat — it lists ~4,700 tables directly (no folders), but the PxWeb API
 * still supports nested sub-paths the same way as any PxWeb instance.
 *
 * Tables are addressed by their .px id (e.g. "0156101S.px"). GET the .px path
 * for metadata (dimensions + valid values); POST a PxWeb query body to it for
 * data. Query limits (from /en/?config): maxCells/maxValues 50,000,000,
 * maxCalls 500 per 10s window.
 */


const BASE = 'https://pxweb.stat.si/SiStatData/api/v1/en/Data';
const UA = 'pipeworx-mcp-sistat-si/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'subjects',
    description: 'Navigate the SiStat table tree. Nodes are folders (type "l") or tables (type "t", id ends in ".px"). Root lists tables directly.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Sub-path under /Data/ (default empty = root).' } },
    },
  },
  {
    name: 'table_meta',
    description: 'Table definition (dimensions, valid values). Path is the .px table id, e.g. "0156101S.px".',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'e.g. "0156101S.px" (include the .px suffix)' } },
      required: ['path'],
    },
  },
  {
    name: 'query_table',
    description: 'Pull data from a table (max 50,000,000 cells). path is the .px table id; body is a PxWeb query object.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'e.g. "0156101S.px"' },
        body: { type: 'object', description: '{query: [{code, selection: {filter, values}}], response: {format: "json-stat2"}}' },
      },
      required: ['path', 'body'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'subjects': {
      const path = (args.path as string | undefined)?.replace(/^\/+|\/+$/g, '') ?? '';
      return sistatGet(path ? `/${path}` : '');
    }
    case 'table_meta':
      return sistatGet(`/${reqStr(args, 'path', '"0156101S.px"').replace(/^\/+|\/+$/g, '')}`);
    case 'query_table': {
      const path = reqStr(args, 'path', '"0156101S.px"').replace(/^\/+|\/+$/g, '');
      const body = args.body;
      if (!body || typeof body !== 'object') throw new Error('body must be a PxWeb query object.');
      const res = await fetch(`${BASE}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': UA },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`SiStat: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
      return res.json();
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function sistatGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`SiStat: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
