import express from 'express';
import mongoose from 'mongoose';
import { redisClient } from './redisClient';
import { DriverLocationModel } from './driver_location.model';

const app = express();
const port = 3001;
const mongoUrl = 'mongodb://localhost:27017/ride_hailing';

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.post('/location', async (req, res) => {
  console.log('POST /location called');
  const { driver_id, latitude, longitude } = req.body;

  if (!driver_id || !latitude || !longitude) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const uniqueKey = `${driver_id}-${latitude}-${longitude}`;
  const exists = await DriverLocationModel.findOne({ requestId: uniqueKey });

  if (exists) {
    return res.status(200).json({
      message: 'Duplicate request_id — already stored',
      existingTimestamp: exists.timestamp?.toISOString()
    });
  }

  try {
    const timestamp = new Date();
    const newLocation = new DriverLocationModel({
      driverId: driver_id,
      latitude,
      longitude,
      timestamp,
      requestId: uniqueKey
    });

    await newLocation.save();
    res.status(200).json({ message: 'Location stored' });
  } catch (err) {
    res.status(500).json({ message: 'Error storing location', error: err });
  }
});

app.get('/location/:driver_id', async (req, res) => {
  const { driver_id } = req.params;

  try {
    const latestLocation = await DriverLocationModel.findOne({ driverId: driver_id })
      .sort({ timestamp: -1 });

    if (!latestLocation) {
      return res.status(404).json({ message: 'No location found for driver' });
    }

    res.json(latestLocation);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching location', error: err });
  }
});

// Start server only after MongoDB and Redis are connected
async function startServer() {
  try {
    await redisClient.connect();
    console.log('Connected to Redis!');

    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB!');

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

startServer();

export { redisClient };
