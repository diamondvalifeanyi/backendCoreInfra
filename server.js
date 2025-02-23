import { db, testConnection } from './config/pgDB.js';

export async function startServer(app, PORT) {
  try {
    // Test the database connection
    await testConnection();

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

export async function shutdownServer() {
  try {
    await db.end(); 
    console.log('Database pool closed.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to shut down server gracefully:', err);
    process.exit(1);
  }
}