require('dotenv').config();
const mongoose = require('mongoose');

async function unblacklistDemo() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[MongoDB] Connected');

  const result = await mongoose.connection.db.collection('users').updateMany(
    { isBlacklisted: true },
    { $set: { isBlacklisted: false, blacklistedAt: null } }
  );

  console.log(`[Done] Unblacklisted ${result.modifiedCount} user(s)`);
  process.exit(0);
}

unblacklistDemo().catch(err => { console.error(err); process.exit(1); });
