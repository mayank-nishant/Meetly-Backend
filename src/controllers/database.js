import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const dbUser = process.env.MONGO_DB_USER;
    const rawPass = process.env.MONGO_DB_PASS;

    if (!dbUser || !rawPass) {
      throw new Error('Missing MONGO_DB_USER or MONGO_DB_PASS in .env');
    }

    const encodedPass = encodeURIComponent(rawPass);

    const uri = `mongodb+srv://${dbUser}:${encodedPass}@cluster0.y4j2wu6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

    await mongoose.connect(uri);

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
  }
};
