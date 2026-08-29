import express from 'express';
import type { Request, Response } from 'express';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { getMcpServer } from '../mcp/mcp.server.js';


const app = express();


app.use(express.json());


// every MCP request lands on this ONE endpoint
const node = toNodeHandler(createMcpHandler(() => getMcpServer()));
app.all('/mcp', (req, res) => void node(req, res, req.body));

export default app;