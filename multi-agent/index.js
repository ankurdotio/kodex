import "dotenv/config";
import manager from "./agents.js"
import { HumanMessage } from "langchain"



const response = await manager.invoke({
    messages: [
        new HumanMessage("Write a function to reverse a string in JavaScript.")
    ]
})

console.log(response)


