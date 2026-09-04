import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed sample TaskPlanet posts if empty
    const { Post } = await import('./models/Post.js');
    const count = await Post.countDocuments();
    if (count === 0) {
      console.log('🌱 Database empty, automatically seeding initial TaskPlanet data...');
      const { seedDatabase } = await import('./utils/seed.js');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`🌐 API accessible at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
