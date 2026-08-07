import { createAgent } from "langchain"
import { ChatMistralAI } from "@langchain/mistralai"
import { tool, HumanMessage } from "langchain"
import * as z from "zod"


const smallModel = new ChatMistralAI({
    model: "mistral-small-latest",
    apiKey: process.env.MISTRAL_API_KEY
})

const largeModel = new ChatMistralAI({
    model: "mistral-large-latest",
    apiKey: process.env.MISTRAL_API_KEY
})

const codeModel = new ChatMistralAI({
    model: "codestral-latest",
    apiKey: process.env.MISTRAL_API_KEY
})


const coderAgent = createAgent({
    model: codeModel,
    systemPrompt: `
    You are a coding assistant. You will be given a coding problem and you will provide a solution in the form of code. You will also provide an explanation of the code.

    You always think of edge cases and provide a solution that is robust and handles all possible scenarios.
    `
})


const reviewAgent = createAgent({
    model: smallModel,
    systemPrompt: `
    You are a code reviewer. You will be given a piece of code and you will provide a review of the code. 
    
    You will provide feedback on the code quality, readability, and maintainability.


    You will score the code on a scale of 1 to 10, with 10 being the best. You will also provide a list of issues found in the code and suggestions for improvement.
    `
})

const coderAgentTool = tool(
    async ({ problem }) => {
        const response = await coderAgent.invoke({
            messages: [
                new HumanMessage(problem)
            ]
        })
        return response.messages.at(-1).text
    },
    {
        name: "coderAgentTool",
        description: "This tool is used to get a code solution from the coder agent for a given coding problem.",
        schema: z.object({
            problem: z.string().describe("The coding problem to be solved.")
        })
    }
)

const reviewAgentTool = tool(
    async ({ code }) => {
        const response = await reviewAgent.invoke({
            messages: [
                new HumanMessage(code)
            ]
        })

        return response.messages.at(-1).text
    },
    {
        name: "reviewAgentTool",
        description: "Use this tool to get the review of the code from the review agent.",
        schema: z.object({
            code: z.string().describe("The code to be reviewed.")
        })
    }
)


const managerAgent = createAgent({
    model: largeModel,
    systemPrompt: `
    You are a Senior Developer. You will be given a coding problem and you will assign the problem to the coder agent.

    Mandatory:  Use review agent to review the code provided by the coder agent. You will then provide feedback to the coder agent based on the review.


    Provide result to user only if the score of the code is greater than 9.
    `,
    tools: [ coderAgentTool, reviewAgentTool ]
})

export default managerAgent