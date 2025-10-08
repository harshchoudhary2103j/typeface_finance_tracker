require('express-async-errors');
const express = require('express');


const connectDB = require('./config/db');
const config = require('./config/env');

const authRouter = require('./routes/auth');

const errorHandlerMiddleware = require('./middlewares/error-handler');
const notFoundMiddleware = require('./middlewares/not-found');

const app = express();



// Middlewares
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Authentication service is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/auth', authRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);



const start = async () => {
    try {
        await connectDB();
        console.log('Connected to database');
        app.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });
    }
    catch (err){
        console.error(err);
    }
}

start();