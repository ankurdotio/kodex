import express from 'express';
import NoteModel from "./models/notes.model.js";
import mongoose from 'mongoose';
import userModel from './models/users.model.js';
import cookies from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { authMiddleware } from './middleware/auth.middleware.js';


const app = express();
app.use(express.json());
app.use(cookies());


/**
 * @route POST /api/auth/register
 * @description Register a new user need name and email in the request body
 * @access Public
 */
app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;

    // ---- Validation ----
    if (!name) {
        return res.status(400).json({ error: "Name is required" });
    }

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    if (!password) {
        return res.status(400).json({ error: "Password is required" });
    }

    if (name.trim().length < 3) {
        return res.status(400).json({ error: "Name must be at least 3 characters long" });
    }

    if (password.trim().length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // ---- If validation passes, create the user ----

    const newUser = await userModel.create({ name, email, password });


    const token = jwt.sign(
        { id: newUser._id, email: newUser.email },
        process.env.JWT_SECRET);


    res.cookie("token", token)

    return res.status(201).json({
        message: "User registered successfully",
        user: newUser
    });


})


/**
 * @route POST /api/auth/login
 * @description Login a user need email and password in the request body
 * @access Public
 */
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    // ---- Validation ----
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    if (!password) {
        return res.status(400).json({ error: "Password is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.trim().length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // ---- If validation passes, check if the user exists ----

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    if (!(await user.matchPassword(password))) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET);

    res.cookie("token", token)

    return res.status(200).json({
        message: "User logged in successfully",
        user
    });

})


/**
 * @route POST /api/notes
 * @description Create a new note need title and description in the request body
 * @access Public
 */
app.post("/api/notes", authMiddleware, async (req, res) => {
    const { title, description } = req.body;


    // ---- Validation ----
    if (!title) {
        return res.status(400).json({ error: "Title is required" });
    }

    if (!description) {
        return res.status(400).json({ error: "Description is required" });
    }

    if (title.trim().length < 3) {
        return res.status(400).json({ error: "Title must be at least 3 characters long" });
    }

    if (description.trim().length < 10) {
        return res.status(400).json({ error: "Description must be at least 10 characters long" });
    }

    // ---- If validation passes, create the note ----

    const newNote = await NoteModel.create({
        title,
        description,
        user: req.user.email
    });

    return res.status(201).json({
        message: "Note created successfully",
        note: newNote
    });
})


/**
 * @route GET /api/notes
 * @description Get all notes
 * @access Public
 */
app.get("/api/notes", authMiddleware, async (req, res) => {


    const notes = await NoteModel.find({
        user: req.user.email
    });

    return res.status(200).json({
        message: "Notes fetched successfully",
        notes
    });

})


/**
 * @route PATCH /api/notes/:id
 * @description Update a note by id require description in the request body
 * @access Public
 */
app.patch("/api/notes/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { description } = req.body;


    // ---- Validation ----
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid note ID" });
    }

    if (!description) {
        return res.status(400).json({ error: "Description is required" });
    }

    if (description.trim().length < 10) {
        return res.status(400).json({ error: "Description must be at least 10 characters long" });
    }

    const note = await NoteModel.findOne({
        _id: id,
        user: req.user.email
    });

    if (!note) {
        return res.status(404).json({ error: "Note not found" });
    }

    note.description = description;
    await note.save();

    return res.status(200).json({
        message: "Note updated successfully",
        note
    });
})


/**
 * @route DELETE /api/notes/:id
 * @description Delete a note by id
 * @access Public
 */
app.delete("/api/notes/:id", authMiddleware, async (req, res) => {

    const { id } = req.params;


    // ---- Check if id is valid mongoose ObjectId ----
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid note ID" });
    }

    // ---- Check if the note exists ----
    const note = await NoteModel.findOne({
        _id: id,
        user: req.user.email
    });

    if (!note) {
        return res.status(404).json({ error: "Note not found" });
    }

    // ---- If the note exists, delete it ----
    await NoteModel.findByIdAndDelete(id);

    return res.status(200).json({
        message: "Note deleted successfully"
    });

})


export default app;