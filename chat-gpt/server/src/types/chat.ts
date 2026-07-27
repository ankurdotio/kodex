export type RequestMessage = {
    message: string;
    conversationId?: string;
}

export type Message = {
    author: "user" | "ai";
    content: string;
    conversation: string;
}


export type MongoMessage = Message & {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}