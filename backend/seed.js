import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Post from './models/post.js';
import User from './models/user.js';
import { connectToRedis } from './services/redis.js';
import { deleteDataFromCache } from './utils/cache-posts.js';
import { REDIS_KEYS } from './utils/constants.js';

// Seed author (password satisfies the User model's complexity rules).
const SEED_USER = {
  userName: 'seeduser',
  fullName: 'Seed Author',
  email: 'seed@wanderlust.dev',
  password: 'Password@123',
  role: 'ADMIN',
};

// Reliable placeholder images (picsum serves a real image per seed, and the
// .jpg suffix keeps the app's image-extension checks happy).
const img = (seed) => `https://picsum.photos/seed/${seed}/1200/800.jpg`;

const POSTS = [
  {
    title: 'Chasing Sunsets in Santorini',
    categories: ['Travel', 'Beaches'],
    isFeaturedPost: true,
    description:
      'Whitewashed villages tumble toward the Aegean while the sky burns orange over the caldera. A slow evening walk through Oia is the kind of moment travel is made for.',
  },
  {
    title: 'Into the Heart of the Amazon',
    categories: ['Nature', 'Adventure'],
    isFeaturedPost: true,
    description:
      'The rainforest hums with life long before dawn. Paddling silent tributaries, you learn to read the water, the birdsong, and the green wall of the canopy.',
  },
  {
    title: 'A Weekend in Neon Tokyo',
    categories: ['City'],
    isFeaturedPost: true,
    description:
      'From the crossing at Shibuya to a quiet ramen counter at midnight, Tokyo rewards the curious wanderer with contrast at every corner.',
  },
  {
    title: 'Trekking the Dolomites',
    categories: ['Adventure', 'Nature'],
    isFeaturedPost: false,
    description:
      'Jagged limestone peaks glow pink at sunrise. The via ferrata cables give you the confidence to climb where the views are impossibly wide.',
  },
  {
    title: 'Hidden Beaches of the Algarve',
    categories: ['Beaches', 'Travel'],
    isFeaturedPost: false,
    description:
      'Golden cliffs hide coves you can only reach by kayak. The water is impossibly clear, and the afternoons stretch long and warm.',
  },
  {
    title: 'Ancient Wonders of Rome',
    categories: ['Landmarks', 'City'],
    isFeaturedPost: false,
    description:
      'Standing in the Colosseum at opening hour, before the crowds, you can almost hear two thousand years of history echo off the stone.',
  },
  {
    title: 'Northern Lights Over Iceland',
    categories: ['Nature', 'Adventure'],
    isFeaturedPost: false,
    description:
      'Wrapped against the cold, we waited on a black-sand plain until the sky rippled green. No photo does the aurora justice.',
  },
  {
    title: 'Coastal Roads of Big Sur',
    categories: ['Travel', 'Nature'],
    isFeaturedPost: false,
    description:
      'The Pacific unfurls beside the highway as it winds past cliffs and redwoods. Every pullout is an invitation to stop and stare.',
  },
];

/**
 * Insert the demo posts. Assumes Mongo (and optionally Redis) are already
 * connected — safe to call from server startup or the CLI runner below.
 * @param {{ force?: boolean }} [opts] force=true re-seeds even if posts exist.
 * @returns {Promise<number>} number of posts inserted (0 if skipped).
 */
export async function seedDatabase({ force = false } = {}) {
  const existing = await Post.estimatedDocumentCount();
  if (existing > 0 && !force) {
    return 0;
  }

  // Find or create the seed author.
  let author = await User.findOne({ email: SEED_USER.email });
  if (!author) {
    author = await User.create(SEED_USER);
    console.log(`Created seed user: ${author.email}`);
  }

  // Idempotent: clear this author's previous seed posts before re-inserting.
  await Post.deleteMany({ authorId: author._id });

  const now = Date.now();
  const docs = POSTS.map((p, i) => ({
    ...p,
    authorName: author.fullName,
    authorId: author._id,
    imageLink: img(p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    // Stagger timeOfPost so "latest" ordering is meaningful.
    timeOfPost: new Date(now - i * 86_400_000),
  }));

  const inserted = await Post.insertMany(docs);
  await User.findByIdAndUpdate(author._id, {
    $set: { posts: inserted.map((d) => d._id) },
  });

  // Invalidate cached (possibly empty) post lists so the new data shows at once.
  await Promise.all([
    deleteDataFromCache(REDIS_KEYS.ALL_POSTS),
    deleteDataFromCache(REDIS_KEYS.FEATURED_POSTS),
    deleteDataFromCache(REDIS_KEYS.LATEST_POSTS),
  ]);

  console.log(
    `Seeded ${inserted.length} posts (${inserted.filter((d) => d.isFeaturedPost).length} featured).`
  );
  return inserted.length;
}

// CLI entrypoint: `npm run seed`. Connects, force-seeds, then exits.
// Detects direct execution so importing this module does NOT run it.
const isDirectRun = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isDirectRun) {
  (async () => {
    try {
      await connectDB();
      await connectToRedis();
      await seedDatabase({ force: true });
      await mongoose.connection.close();
      process.exit(0);
    } catch (err) {
      console.error('Seeding failed:', err.message);
      await mongoose.connection.close().catch(() => {});
      process.exit(1);
    }
  })();
}
