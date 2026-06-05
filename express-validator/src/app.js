import express from 'express';
import indexRoutes from './routes/index.routes.js';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

/**
 * mounting all the routes
 */
app.use('/api', indexRoutes);



export default app;