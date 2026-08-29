import { ChatMistralAI } from "@langchain/mistralai"
import { createAgent, HumanMessage } from "langchain"
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { config } from "dotenv";

config()


const client = new MultiServerMCPClient({
    mcpServers: {
        weather: {
            url: "http://localhost:3000/mcp"
        }
    }
})

const tools = await client.getTools()

const model = new ChatMistralAI({
    model: "mistral-small-latest",
    apiKey: process.env.MISTRALAI_API_KEY
})

const agent = createAgent({
    model,
    tools
})

const response = await agent.invoke({
    messages: [
        new HumanMessage("Weather of Bhopal, India"),
    ]
})

console.log(response)