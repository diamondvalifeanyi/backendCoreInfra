# Project Name
Backend: Card Management System

## Description
A backend system for managing card-related operations, including a dashboard, card request flow, and card profile flow. Built with Node.js, Express.js, and PostgreSQL.

## Features
Dashboard – Displays card-related information.

Card Request Flow – Allows users to request a new card.

Card Profile Flow – Shows details of an issued card.

## Installation
Clone the repository:
bash
Copy
git clone https://github.com
cd lapo-backend

## Install dependencies:
bash
Copy
npm install

## Usage
Set up PostgreSQL and update ./config/pgDB.js with your database credentials.
## Start the server:
bash
Copy
npm start
Verify by visiting http://localhost:4000/.

## Configuration
Add a .env file:

env
Copy
db_Host=localhost
db_User=your_db_user
db_Password=your_db_password
db_Name=your_db_name
db_Port=your_postgres_port
port=4000
ENCRYPTION_KEY
IV

The encryption key for this was hardcoded in the env, you can do same for yours or generate dynamically as you code.

## API Endpoints
Card Management
Create a card: POST /api/cards

Get card details: GET /api/cards/:batch_id

Card Profile
Create profile: POST /api/profile

Get profile by BIN: GET /api/profile/:bin

Dashboard
Get dashboard data: GET /api/dashboard/:batch_id

//used bin number and batch_id to get detailsfor card and profile//

## License











