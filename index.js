// imports

import express from 'express';
import bodyParser from 'body-parser';
import cardRoutes from './routes/route.js'; 
import { startServer, shutdownServer } from './server.js';
import { db } from './config/pgDB.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000; 

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// get filePath directory, for docs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', cardRoutes);

app.get('/', (req, res) => {
    res.send('Hello, world!');
  });

  app.get('/documentation', (req, res) => {
    // Send the .txt file as a response
    res.sendFile(path.join(__dirname, 'public', 'api.txt'));
  });

  app.get('/coreinfra', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CoreInfraHQ Assessment</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f9;
            color: #333;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            text-align: center;
            background-color: #fff;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #007bff;
          }
          p {
            font-size: 1.2rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to CoreInfraHQ</h1>
          <p>Backend API service for CoreInfraHQ Assessment</p>
        </div>
      </body>
      </html>
    `);
  });

app.get('/time', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() AS current_time');
    res.json({ currentTime: result.rows[0].current_time });
  } catch (err) {
    console.error('Error fetching time:', err);
    res.status(500).json({ error: 'Failed to fetch current time' });
  }
});

// error log
app.use((err, req, res, next) => {
    console.error(err.stack);
    console.log(err.message);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
    // next()
  });

  


// Start the server
startServer(app, PORT);

// Handle graceful shutdown
process.on('SIGINT', shutdownServer);
process.on('SIGTERM', shutdownServer);