import { McpServer } from "@modelcontextprotocol/server"
import * as z from "zod/v4"


export function getMcpServer() {

    const mcpServer = new McpServer({
        name: "Kodex MCP Server",
        version: "1.0.0",
    })

    // name,description,function
    mcpServer.registerTool(
        "get_weather",
        {
            title: "Get Weather",
            description: "Get the current Weather for a given City",
            inputSchema: z.object({
                city: z.string().describe("City Name"),
            }),
            outputSchema: z.object({
                temperature: z.number().describe("Temperature in Celsius"),
                description: z.string().describe("Weather Description"),
            })
        },
        async ({ city }) => {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            temperature: 25,
                            description: "Sunny",
                        })
                    }
                ],
                structuredContent: {
                    temperature: 25,
                    description: "Sunny",
                }
            }
        }
    )

    

    return mcpServer;
}