import jwt from 'jsonwebtoken';


export const authMiddleware = (req, res, next) => {

    const token = req.cookies.token;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user; // { id: "user_id", email: "user_email" }

    next();
}