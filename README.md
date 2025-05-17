# Driver Location Tracker

This project simulates driver location updates and stores them using a Node.js + MongoDB + Redis backend.

## Prerequisites

- Node.js and npm installed
- MongoDB running locally on mongodb://localhost:27017
- Redis running and accessible
- Install dependencies by running:

npm install

## How to Use

To use this project:

Start the backend server:
npx ts-node index.ts

Start the simulator in another terminal:
npx ts-node simulator.ts

⚠️ Do not run multiple instances of simulator.ts unless you change its port (default is 3000), or you will get EADDRINUSE errors.
