# mcp-sistat-si

Statistical Office of the Republic of Slovenia (SURS) — SiStat PxWeb MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `subjects` | Navigate the SiStat table tree. Nodes are folders (type "l") or tables (type "t", id ends in ".px"). Root lists tables directly. |
| `table_meta` | Table definition (dimensions, valid values). Path is the .px table id, e.g. "0156101S.px". |
| `query_table` | Pull data from a table (max 50,000,000 cells). path is the .px table id; body is a PxWeb query object. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "sistat-si": {
      "url": "https://gateway.pipeworx.io/sistat-si/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Sistat Si data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
