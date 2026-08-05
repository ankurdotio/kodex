import { MistralAIEmbeddings, ChatMistralAI } from "@langchain/mistralai"
import { config } from "dotenv"
import { SystemMessage, HumanMessage } from "langchain";
import { Pinecone } from '@pinecone-database/pinecone'

config()

const userPrompt = "tell me about Arav internship program"


// –––––––––––––––––– initialize MistralAIEmbeddings –––––––––––––––––– //

const embeddings = new MistralAIEmbeddings({
    model: "mistral-embed",
    apiKey: process.env.MISTRALAI_API_KEY
});

const vector = await embeddings.embedQuery(userPrompt)


// –––––––––––––––––– Pinecone Vector store –––––––––––––––––– //

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const index = pc.Index("kodex-arav")

const response = await index.query({
    vector: vector,
    includeMetadata: true,
    topK: 2
})

console.log(response.matches)


// –––––––––––––––––– LLM –––––––––––––––––– //

const mistralSmall = new ChatMistralAI({
    model: "mistral-small-latest",
    apiKey: process.env.MISTRALAI_API_KEY
})

const aiResponse = await mistralSmall.invoke([
    new SystemMessage(`
        Context : ${response.matches.map(match => match.metadata.text).join("\n\n")}
        `),
    new HumanMessage(userPrompt)
])

console.log(aiResponse)