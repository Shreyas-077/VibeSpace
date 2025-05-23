import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error(error);
    }
};