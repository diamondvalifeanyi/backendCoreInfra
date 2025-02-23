 import express from 'express';
import bodyParser from 'body-parser';
import cardRoutes from './routes/route.js'; 
import { startServer, shutdownServer } from './server.js';
import { db } from './config/pgDB.js';

const app = express();
const PORT = process.env.PORT || 3000; 

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', cardRoutes);

app.get('/', (req, res) => {
    res.send('Hello, world!');
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

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
  });


// Start the server
startServer(app, PORT);

// Handle graceful shutdown
process.on('SIGINT', shutdownServer);
process.on('SIGTERM', shutdownServer);