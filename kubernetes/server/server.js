import express from 'express';
import morgan from 'morgan';

const app = express();

app.use(morgan('dev'));


app.get('/api', (req, res) => {
    res.status(200).json({ message: 'API is working!' });
});

app.get("/health", (req, res) => {
    res.status(200).json({ message: 'Server is healthy!' });
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})