import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;
const startCronJob = (name, intervalMs, jobFn) => {
  const run = async () => {
    try {
      await jobFn();
    } catch (err) {
      console.error(`[cron:${name}]`, err);
    }
  };

  const timer = setInterval(run, intervalMs);
  return () => clearInterval(timer);
};

// ** run server with mongoose
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    startCronJob('heartbeat', 60 * 60 * 1000, async () => {
      console.log(`[cron:heartbeat] ${new Date().toISOString()}`);
    });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));
