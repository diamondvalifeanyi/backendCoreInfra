// db.js
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database configuration
const pool = new Pool({
  user: process.env.db_User,
  host: process.env.db_Host,
  database: process.env.db_Name,
  password: process.env.db_Password,
  port: process.env.db_Port,
  ssl: {
    rejectUnauthorized: false,
  },
});

// errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test the database connection
export async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() AS current_time');
    console.log('Database connection successful. Current time:', res.rows[0].current_time);
  } catch (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
}

// Export the database object and testConnection function
export const db = {
  query: async (text, params) => {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (err) {
      console.error('Error executing query:', err);
      throw err;
    }
  },
  end: () => pool.end(),
};

// import pg from 'pg';
// import dotenv from 'dotenv';

// dotenv.config(); 

// const { Pool } = pg;

// // Database configuration
// const pool = new Pool({
//   user: process.env.db_User,
//   host: process.env.db_Host,
//   database: process.env.db_Name,
//   password: process.env.db_Password,
//   port: process.env.db_Port,
// });

// // Listen for pool errors
// pool.on('error', (err) => {
//   console.error('Unexpected error on idle client', err);
// });

// // Export the database object
// export const db = {
//   query: async (text, params) => {
//     try {
//       const result = await pool.query(text, params);
//       return result;
//     } catch (err) {
//       console.error('Error executing query:', err);
//       throw err; 
//     }
//   },
//   end: () => pool.end(),
// };