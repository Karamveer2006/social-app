import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { connectDB, disconnectDB } from '../config/db.js';

dotenv.config();

const sampleUsers = [
  {
    name: 'Aarav Sharma',
    username: 'aarav_s',
    email: 'aarav@example.com',
    password: 'Password123!',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'Digital nomad, task hunter & tech enthusiast.',
  },
  {
    name: 'Priya Patel',
    username: 'priya_p',
    email: 'priya@example.com',
    password: 'Password123!',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Full Stack Dev | TaskPlanet community member 🚀',
  },
  {
    name: 'Rohan Verma',
    username: 'rohan_v',
    email: 'rohan@example.com',
    password: 'Password123!',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    bio: 'Mobile gamer & content creator.',
  },
  {
    name: 'Ananya Gupta',
    username: 'ananya_g',
    email: 'ananya@example.com',
    password: 'Password123!',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Design lover & coffee addict ☕',
  },
];

export const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    console.log('🧹 Clearing existing users and posts...');
    await User.deleteMany({});
    await Post.deleteMany({});

    console.log('👥 Creating sample users...');
    const createdUsers = [];
    for (const u of sampleUsers) {
      const created = await User.create(u);
      createdUsers.push(created);
    }

    console.log('📝 Creating sample posts...');
    const postsData = [
      {
        author: {
          userId: createdUsers[0]._id,
          username: createdUsers[0].username,
          name: createdUsers[0].name,
          avatar: createdUsers[0].avatar,
        },
        content: 'Excited to announce my first milestone on the community feed! The new task updates are super rewarding. What tasks are you all working on today? 🚀✨',
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
        likes: [
          {
            userId: createdUsers[1]._id,
            username: createdUsers[1].username,
            name: createdUsers[1].name,
            avatar: createdUsers[1].avatar,
          },
          {
            userId: createdUsers[2]._id,
            username: createdUsers[2].username,
            name: createdUsers[2].name,
            avatar: createdUsers[2].avatar,
          },
        ],
        comments: [
          {
            userId: createdUsers[1]._id,
            username: createdUsers[1].username,
            name: createdUsers[1].name,
            avatar: createdUsers[1].avatar,
            text: 'Congratulations Aarav! Keep shining! 🎉',
          },
          {
            userId: createdUsers[3]._id,
            username: createdUsers[3].username,
            name: createdUsers[3].name,
            avatar: createdUsers[3].avatar,
            text: 'Love the energy! Working on social tasks right now 🙌',
          },
        ],
      },
      {
        author: {
          userId: createdUsers[1]._id,
          username: createdUsers[1].username,
          name: createdUsers[1].name,
          avatar: createdUsers[1].avatar,
        },
        content: 'Just completed designing a responsive social feed layout. The combination of clean typography and instant reactive interactions makes all the difference! 💻🎨 #UIUX #WebDev',
        imageUrl: '', // Text-only post test case!
        likes: [
          {
            userId: createdUsers[0]._id,
            username: createdUsers[0].username,
            name: createdUsers[0].name,
            avatar: createdUsers[0].avatar,
          },
        ],
        comments: [
          {
            userId: createdUsers[0]._id,
            username: createdUsers[0].username,
            name: createdUsers[0].name,
            avatar: createdUsers[0].avatar,
            text: 'Looking forward to seeing the live version!',
          },
        ],
      },
      {
        author: {
          userId: createdUsers[2]._id,
          username: createdUsers[2].username,
          name: createdUsers[2].name,
          avatar: createdUsers[2].avatar,
        },
        content: '', // Image-only post test case!
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
        likes: [
          {
            userId: createdUsers[0]._id,
            username: createdUsers[0].username,
            name: createdUsers[0].name,
            avatar: createdUsers[0].avatar,
          },
          {
            userId: createdUsers[1]._id,
            username: createdUsers[1].username,
            name: createdUsers[1].name,
            avatar: createdUsers[1].avatar,
          },
          {
            userId: createdUsers[3]._id,
            username: createdUsers[3].username,
            name: createdUsers[3].name,
            avatar: createdUsers[3].avatar,
          },
        ],
        comments: [
          {
            userId: createdUsers[3]._id,
            username: createdUsers[3].username,
            name: createdUsers[3].name,
            avatar: createdUsers[3].avatar,
            text: 'Incredible tech setup! Where did you get the motherboard?',
          },
        ],
      },
      {
        author: {
          userId: createdUsers[3]._id,
          username: createdUsers[3].username,
          name: createdUsers[3].name,
          avatar: createdUsers[3].avatar,
        },
        content: 'Morning coffee & good vibes to kickstart a productive weekend. Remember to take breaks and stay hydrated! ☕🌿',
        imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
        likes: [
          {
            userId: createdUsers[1]._id,
            username: createdUsers[1].username,
            name: createdUsers[1].name,
            avatar: createdUsers[1].avatar,
          },
        ],
        comments: [],
      },
    ];

    for (const p of postsData) {
      const post = new Post(p);
      await post.save();
    }

    console.log('✅ Seed data successfully inserted into MongoDB!');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Active MongoDB Collections (${collections.length}):`, collections.map(c => c.name));

    return { users: createdUsers, posts: postsData };
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
};

// If run directly via node
if (process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
