const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Fail fast if IP is not whitelisted (5s vs 30s)
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`MongoDB connection error: ${err.message}`);
        console.error("IMPORTANT: If you see 'SSL alert number 80' or timeouts, check your MongoDB Atlas IP Whitelist.");
        console.error("Visit: https://cloud.mongodb.com/v2 -> Security -> Network Access -> Add Current IP Address");

        // Retry logic: Try again in 5 seconds
        console.log("Retrying connection in 5 seconds...");
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;
