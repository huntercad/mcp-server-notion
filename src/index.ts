#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@notionhq/client";

// Environment validation
const NOTION_TOKEN = process.env.NOTION_TOKEN;
if (!NOTION_TOKEN) {
  console.error("Error: NOTION_TOKEN environment variable is required");
  process.exit(1);
}

// Initialize Notion client
const notion = new Client({ auth: NOTION_TOKEN });

// Create MCP server
const server = new Server(
  {
    name: "mcp-server-notion",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "notion_search",
        description: "Search across your Notion workspace for pages and databases",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query string",
            },
            page_size: {
              type: "number",
              description: "Number of results to return (1-100)",
              default: 10,
            },
          },
        },
      },
      {
        name: "notion_get_page",
        description: "Retrieve the content of a specific Notion page",
        inputSchema: {
          type: "object",
          properties: {
            page_id: {
              type: "string",
              description: "The ID of the Notion page to retrieve",
            },
          },
          required: ["page_id"],
        },
      },
      {
        name: "notion_create_page",
        description: "Create a new page in Notion",
        inputSchema: {
          type: "object",
          properties: {
            parent_page_id: {
              type: "string",
              description: "ID of the parent page",
            },
            title: {
              type: "string",
              description: "Title of the new page",
            },
            content: {
              type: "string",
              description: "Content to add to the page",
            },
          },
          required: ["parent_page_id", "title"],
        },
      },
      {
        name: "notion_query_database",
        description: "Query a Notion database",
        inputSchema: {
          type: "object",
          properties: {
            database_id: {
              type: "string",
              description: "ID of the database to query",
            },
            page_size: {
              type: "number",
              description: "Number of results to return (1-100)",
              default: 10,
            },
          },
          required: ["database_id"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "notion_search": {
        const query = (args as any).query || "";
        const pageSize = (args as any).page_size || 10;
        
        const response = await notion.search({
          query,
          page_size: pageSize,
        });

        const results = response.results.map((item: any) => ({
          id: item.id,
          object: item.object,
          title: item.title?.[0]?.plain_text || item.id,
          url: item.url,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case "notion_get_page": {
        const pageId = (args as any).page_id;
        
        const page = await notion.pages.retrieve({ page_id: pageId });
        const blocks = await notion.blocks.children.list({ 
          block_id: pageId,
          page_size: 100,
        });

        const content = blocks.results
          .map((block: any) => {
            if (block.type === "paragraph") {
              return block.paragraph.rich_text.map((t: any) => t.plain_text).join("");
            }
            return "";
          })
          .filter((text: string) => text.length > 0)
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ page, content }, null, 2),
            },
          ],
        };
      }

      case "notion_create_page": {
        const parentId = (args as any).parent_page_id;
        const title = (args as any).title;
        const content = (args as any).content || "";

        const page = await notion.pages.create({
          parent: { page_id: parentId },
          properties: {
            title: {
              title: [{ text: { content: title } }],
            },
          },
          children: content ? [{
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content } }],
            },
          }] : undefined,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(page, null, 2),
            },
          ],
        };
      }

      case "notion_query_database": {
        const databaseId = (args as any).database_id;
        const pageSize = (args as any).page_size || 10;
        
        // @ts-ignore - query method exists at runtime
        const response = await notion.databases.query({
          database_id: databaseId,
          page_size: pageSize,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.results, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error: any) {
    console.error(`Error calling tool ${name}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message || error}`
    );
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Notion MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});