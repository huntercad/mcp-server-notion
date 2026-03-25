# MCP Server for Notion

A Model Context Protocol (MCP) server that enables AI agents to interact with Notion workspaces. Query pages, search content, create documents—all through natural language.

## Features

- 🔍 **Search** across your entire Notion workspace
- 📄 **Read** page content with full block support
- ✏️ **Create** new pages
- 🗂️ **Query** databases

## Quick Start

### 1. Install

```bash
cd ~/.openclaw/workspace/mcp-server-notion
npm install
npm run build
```

### 2. Get Notion Integration Token

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name it "MCP Server"
4. Copy the "Internal Integration Token"
5. **Important**: Share specific pages with your integration (click "Share" on any page, add your integration)

### 3. Configure Environment

```bash
export NOTION_TOKEN="your-integration-token-here"
```

### 4. Test

```bash
node dist/index.js
```

## Available Tools

### `notion_search`
Search across your Notion workspace.

**Input:**
```json
{
  "query": "quarterly roadmap",
  "page_size": 10
}
```

### `notion_get_page`
Retrieve content from a specific page.

**Input:**
```json
{
  "page_id": "abc123-def456-ghi789"
}
```

### `notion_create_page`
Create a new page.

**Input:**
```json
{
  "parent_page_id": "parent-page-id",
  "title": "New Project Idea",
  "content": "This is the project description..."
}
```

### `notion_query_database`
Query a database.

**Input:**
```json
{
  "database_id": "database-id-here",
  "page_size": 20
}
```

## Use Cases

### Knowledge Base Q&A
```
User: "What was decided about the pricing change?"
AI → notion_search: "pricing change meeting"
AI → notion_get_page: [meeting-notes-id]
AI → "The team decided to switch to usage-based pricing effective March 1."
```

### Project Management
```
User: "Show me all tasks in the product roadmap"
AI → notion_query_database: [tasks-db-id]
AI → Lists all tasks with status and assignees
```

## Security

- **Token Safety**: Never commit NOTION_TOKEN to version control
- **Least Privilege**: Only share specific pages with your integration
- **Local Only**: Server runs locally; tokens never leave your machine

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev
```

## Project Structure

```
mcp-server-notion/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT