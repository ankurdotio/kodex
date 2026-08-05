import { PDFParse } from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { MistralAIEmbeddings } from "@langchain/mistralai"
import { Pinecone } from '@pinecone-database/pinecone'
import fs from 'fs/promises';
import { config } from "dotenv"

config()


const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const fileBuffer = await fs.readFile("./story.pdf")

const Uint8ArrayData = new Uint8Array(fileBuffer);

const parse = new PDFParse(Uint8ArrayData);


const data = await parse.getText()

console.log(data.text)

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 400,
    chunkOverlap: 100,
})

const parts = await splitter.splitText(`${data.text}`)

const embeddings = new MistralAIEmbeddings({
    model: "mistral-embed",
    apiKey: process.env.MISTRALAI_API_KEY
});

const vectors = await embeddings.embedDocuments(parts)


const vectorsData = vectors.map((vector, index) => ({
    text: parts[ index ],
    vector: vector
}))




const index = pc.Index("kodex-arav")

const vectorsStored = await index.upsert({
    records: vectorsData.map(vec => {

        return {
            id: `${Math.random() * 100000000000}`,
            metadata: {
                text: vec.text
            },
            values: vec.vector
        }

    })
})


console.log(vectorsStored)