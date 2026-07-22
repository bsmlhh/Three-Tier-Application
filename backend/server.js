import app from "./app.js";
import connectDB from './config/db.js'
import { PORT } from "./config/utils.js";
import { connectToRedis } from "./services/redis.js";
import { seedDatabase } from "./seed.js";

const port = PORT || 5000

// Connect to redis
connectToRedis()

//Connect to Mongodb
connectDB()
  .then(async () => {
    // Auto-seed demo posts on first run (no-op if the collection already has data).
    try {
      await seedDatabase();
    } catch (err) {
      console.log("Seeding skipped:", err.message);
    }
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection failed:", error);
  })