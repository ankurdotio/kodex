import { ChatMistralAI } from "@langchain/mistralai"
import { createAgent, HumanMessage, AIMessage, ToolMessage } from "langchain"
import { env } from "../config/env"
import * as z from "zod"
import { model } from "mongoose"
import { MongoMessage } from "../types/chat"
import { getMemoryTool, updateMemoryTool, getWebResultTool } from "./ai/tools.js"

const smallModel = new ChatMistralAI({
    model: "mistral-small-latest",
    apiKey: env.mistralApiKey
})
const mediumModel = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: env.mistralApiKey
})

export async function getConversationTitle({ message }: { message: string }): Promise<string> {

    const agent = createAgent({
        model: smallModel,
        responseFormat: z.object({
            title: z.string().max(30).describe("The title of the conversation, max 30 characters")
        }),
        systemPrompt: `You are an assistant that generates a concise title for a conversation based on the user's first message.`
    })

    const response = await agent.invoke({
        messages: [
            new HumanMessage(message)
        ]
    })

    return response.structuredResponse.title

}

export async function getStream({ messages, userId }: { messages: MongoMessage[], userId: string }): Promise<ReadableStream> {

    const agent = createAgent({
        model: smallModel,
        tools: [getMemoryTool, updateMemoryTool, getWebResultTool],
        systemPrompt: `
        Read memory context to make the conversation more personalized.
        Mandatory: Update the memory whenever you notice a fact that will be relevant for weeks/months and then respond to the user.
        
        Use the web search tool to look up information on the web when you don't know the answer to a question. Always use the web search tool when you are unsure about an answer. If you find relevant information, use it to respond to the user. If you don't find relevant information, respond with "I couldn't find any relevant information on that topic."

        Current Date: ${new Date().toISOString().split("T")[0]}
        
        `
    })

    const stream = await agent.stream(
        {
            messages: messages.map((message) => {
                if (message.author === "user") {
                    return new HumanMessage(message.content)
                } else if (message.author === "ai") {
                    return new AIMessage({
                        content: message.content,
                        tool_calls: message.toolCalls?.map((toolCall) => ({
                            name: toolCall.name || "",
                            args: toolCall.arguments || {},
                            id: toolCall.id || ""
                        }))
                    })
                } else {
                    return new ToolMessage({
                        content: message.content,
                        tool_call_id: message.toolCallId || "",
                    })
                }
            })
        },
        {
            streamMode: ["messages", "values"],
            configurable: {
                userId: userId
            }
        }
    )
    return stream
}