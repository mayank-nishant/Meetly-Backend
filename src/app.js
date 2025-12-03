import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './controllers/database.js';
import { connectToSocket } from './controllers/socketManager.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/users', userRoutes);

const PORT = process.env.PORT || 8000;

const start = async () => {
  try {
    connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.log('Server connection failed', err);
  }
};

start();

app.get('/home', (req, res) => {
  res.json({ message: 'Hi' });
});
