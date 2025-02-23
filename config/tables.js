import { db } from '../config/pgDB.js'; 

export async function createCardsTable() {
  try {
    await db.query(`
      -- Create ENUM type for status
      DO $$ BEGIN
        CREATE TYPE card_status AS ENUM ('pending', 'inProgress', 'ready', 'acknowledged');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- Create ENUM type for actions
      DO $$ BEGIN
        CREATE TYPE card_action AS ENUM (
          'downloadForProduction', 
          'markAsInProgress', 
          'markAsReady', 
          'sendToDispatch', 
          'markAsAcknowledged'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- Create the cards table
      CREATE TABLE IF NOT EXISTS cards (
          id SERIAL PRIMARY KEY,
          batch_id INT NOT NULL UNIQUE CHECK (batch_id BETWEEN 100000000 AND 999999999), -- 9-digit number
          branch_name VARCHAR(100) NOT NULL,
          initiator VARCHAR(100) NOT NULL,
          card_type VARCHAR(50) NOT NULL,
           charges MONEY NOT NULL DEFAULT 0,
          quantity INT NOT NULL CHECK (quantity > 0),
          date_requested TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expiry_date TIMESTAMP GENERATED ALWAYS AS (date_requested + INTERVAL '3 years') STORED, 
          status card_status DEFAULT 'pending',
          actions card_action, -- Use ENUM type for actions
          cvv VARCHAR(255) NOT NULL,
          serial_number VARCHAR(255) NOT NULL,
          email VARCHAR(100) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          -- Additional constraints
          CONSTRAINT positive_charges CHECK (charges >= 0::MONEY)
      );

    `);
    console.log('Table "cards" created or already exists.');
  } catch (err) {
    console.error('Error creating "cards" table:', err);
    throw err;
  }
}


export async function createCardsProfile() {
  try {
    await db.query(`
      -- Create the Profile table
      CREATE TABLE IF NOT EXISTS profile (
          id SERIAL PRIMARY KEY,
          cardName VARCHAR(100) NOT NULL,
          cardScheme VARCHAR(100) NOT NULL,
          description VARCHAR(50) NOT NULL,
          Branch VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expiry_date TIMESTAMP GENERATED ALWAYS AS (created_at + INTERVAL '3 years') STORED, 
          BIN VARCHAR(255) NOT NULL,
          currency VARCHAR(3) NOT NULL CHECK (currency IN ('NGN'))
      );

    `);
    console.log('Table "profile" created or already exists.');
  } catch (err) {
    console.error('Error creating "profile" table:', err);
    throw err;
  }
}


