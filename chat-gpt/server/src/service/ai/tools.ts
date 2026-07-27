import { tool } from "langchain"
import { contextDao } from "../../dao/context.dao.js"
import * as z from "zod"


export const getMemoryTool = tool(
    contextDao.readContextByUser,
    {
        name: "getMemory",
        description: "Retrieves the context for a given user.",
        schema: z.object({
            userId: z.string().describe("The ID of the user whose context is to be retrieved."),
        }),
    }
)

export const updateMemoryTool = tool(
    contextDao.updateContextByUser,
    {
        name: "updateMemory",
        description: "Overrides or create new context for a given user.",
        schema: z.object({
            userId: z.string().describe("The ID of the user whose context is to be updated."),
            description: z.string().describe("The new context description for the user."),
        }),
    }
)