// simulator.ts
import express from 'express';
import mongoose from 'mongoose';
import { Location } from './location.model';
import fs from 'fs';
import axios from 'axios';
import { DriverLocationModel } from './driver_location.model';
import { redisClient } from './redisClient';

const app = express();
const port = process.argv[2] ? parseInt(process.argv[2]) : 3000; // This simulator can run its own port or just run as script

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/driver-tracker')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

let T0 = new Date(); // Start time (T₀)
const lastTimestamps = new Map<string, Date>();
let existingTimestamp: boolean = false;
let loopTimeOffSec: number[] = [];
const LOCK_KEY = 'driver_location_log_lock';
const LOCK_EXPIRE = 300; // Lock expires in 300 seconds

const insertDriverLocationLogs = async () => {

  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    // await redisClient.del(LOCK_KEY);
    // console.log('don dee');
    // return 'done';
    const isLocked = await redisClient.exists(LOCK_KEY);
    if (isLocked) {
      console.log('Lock exists. Exiting...');
      return;
    }

    await redisClient.set(LOCK_KEY, '1', { EX: LOCK_EXPIRE });

    const data = fs.readFileSync('driver_location_log.json', 'utf-8');
    type DriverLog = {
      driver_id: string;
      latitude: number;
      longitude: number;
      time_offset_sec: number;
    };
    const logs: DriverLog[] = JSON.parse(data);

    logs.sort((a, b) => {
      if (a.driver_id < b.driver_id) return -1;
      if (a.driver_id > b.driver_id) return 1;
      return a.time_offset_sec - b.time_offset_sec;
    });

    let index = 0;
    for (const log of logs) {
      const { driver_id, latitude, longitude, time_offset_sec } = log;
      loopTimeOffSec.push(time_offset_sec);
      if (loopTimeOffSec.length > 2) loopTimeOffSec.shift();

      const baseTimestamp = lastTimestamps.get(driver_id) ?? T0;
      const timestamp = new Date(baseTimestamp.getTime() + time_offset_sec * 1000);

      const locationData = {
        driver_id,
        latitude,
        longitude,
        time_offset_sec,
        timestamp
      };

      let delay = 0;
      if (loopTimeOffSec.length === 2) {
        delay = (loopTimeOffSec[1] - loopTimeOffSec[0]) * 1000;
      }
      if (existingTimestamp === true) {
        delay = 0;
        existingTimestamp = false;
      }

      if (delay > 0) {
        console.log(`Waiting ${delay}ms before sending driver ${driver_id}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      try {
        const response = await axios.post('http://localhost:3001/location', locationData); // Make sure this points to the API server
        if (response.status === 200) {
          if (response.data?.existingTimestamp) {
            const existingTimestampStr = response.data.existingTimestamp;
            const existingTimestampDate = new Date(existingTimestampStr);
            lastTimestamps.set(driver_id, existingTimestampDate);
            existingTimestamp = true;
            console.log(`Duplicate. Using existing timestamp ${existingTimestampDate} for driver: ${driver_id}`);
          } else {
            lastTimestamps.set(driver_id, T0);
          }
        }
      } catch (err) {
        console.error(`Error sending update for ${driver_id}:`, err);
      }

      const isLast = index === logs.length - 1;
      if (isLast) {
        await redisClient.del(LOCK_KEY);
        console.log('All logs done. Lock released.');
      }

      index++;
    }
  } catch (err) {
    console.error('Error in log ingestion:', err);
  }
};

// Start ingestion when simulator starts
insertDriverLocationLogs();

app.listen(port, () => {
  console.log(`Simulator running on port ${port}`);
});
