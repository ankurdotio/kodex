import { ChatMistralAI } from "@langchain/mistralai"
import { createAgent, HumanMessage } from "langchain"
import env from "../config/env.js"
import * as z from "zod"
import { model } from "mongoose"

const smallModel = new ChatMistralAI({
    model: "mistral-small-latest",
    apiKey: env.MISTRAL_API_KEY
})
const mediumModel = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: env.MISTRAL_API_KEY
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

export async function getStream({ message }: { message: string }): Promise<ReadableStream> {
    const stream = await mediumModel.stream(message)
    return stream
}