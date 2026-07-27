import { Schema, model, type InferSchemaType, Types } from "mongoose";


const contextSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    description:{
        type: String,
        required: true,
        trim: true,
        minlength: 1
    }
}, {
    timestamps: true
});


export type ContextDocument = InferSchemaType<typeof contextSchema> & {
    _id: Types.ObjectId;
};

export const ContextModel = model("Context", contextSchema);