export type RequestMessage = {
    message: string;
    conversationId?: string;
}

export type Message = {
    author: "user" | "ai" | "tool";
    content: string;
    conversation: string;
    toolCalls?: {
        arguments?: Record<string, unknown>;
        id?: string | null;
        name?: string | null;
    }[];
    toolCallId?: string | null;
}


export type MongoMessage = Message & {
    _id: string;
    createdAt: Date;
    updatedAt: Date;

}