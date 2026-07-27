import { ChatMistralAI } from "@langchain/mistralai"
import { createAgent, HumanMessage, AIMessage } from "langchain"
import { env } from "../config/env"
import * as z from "zod"
import { model } from "mongoose"
import { MongoMessage } from "../types/chat"
import { getMemoryTool, updateMemoryTool } from "./ai/tools.js"

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
        model: mediumModel,
        tools: [getMemoryTool, updateMemoryTool],
        systemPrompt: `
        Read memory context to make the conversation more personalized.
        Mandatory: Update the memory whenever you notice a fact that will be relevant for weeks/months and then respond to the user.

         current userid ${userId}`
    })

    const stream = await agent.stream({
        messages: messages.map((message) => {
            if (message.author === "user") {
                return new HumanMessage(message.content)
            } else {
                return new AIMessage(message.content)
            }
        })
    }, {
        streamMode: "messages",
    }
    )
    return stream
}