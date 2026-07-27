import { ContextModel, type ContextDocument } from "./models/context.model.js";

class ContextDao {
    /**
     * Reads the context description for a given user.
     * @param userId - The ID of the user.
     * @returns The context description if found, otherwise a default message.
     */
    async readContextByUser({ userId }: { userId: string }): Promise<string> {
        const contextDoc: ContextDocument | null = await ContextModel.findOne({ user: userId }).lean();
        if (contextDoc) {
            return contextDoc.description;
        } else {
            return "No context found for the user.";
        }
    }


    /**
     * Updates the context description for a given user. If the context does not exist, it creates a new one.
     * @param userId - The ID of the user.
     * @param description - The new context description.
     * @returns A success message.
     */
    async updateContextByUser({ userId, description }: { userId: string, description: string }): Promise<string> {

        const contextDoc: ContextDocument | null = await ContextModel.findOneAndUpdate(
            { user: userId },
            { description },
            { new: true, upsert: true }
        )

        return "Context updated successfully.";
    }

}

export const contextDao = new ContextDao();