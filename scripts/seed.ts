import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

// User Schema (simplified for seeding)
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ["PM", "Developer"] },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seed() {
    if (!MONGODB_URI) {
        console.error("❌ MONGODB_URI not found in environment");
        process.exit(1);
    }

    try {
        console.log("🌱 Starting database seed...");

        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // Clear existing users (optional - comment out to keep existing data)
        // await User.deleteMany({});
        // console.log("🗑️  Cleared existing users");

        // Hash passwords
        const pmPassword = await bcrypt.hash("pm123456", 12);
        const devPassword = await bcrypt.hash("dev123456", 12);

        // Create PM user
        const pmUser = await User.findOneAndUpdate(
            { email: "pm@test.com" },
            {
                name: "Project Manager",
                email: "pm@test.com",
                password: pmPassword,
                role: "PM",
            },
            { upsert: true, new: true }
        );
        console.log("✅ PM user created:", pmUser.email);

        // Create Developer user
        const devUser = await User.findOneAndUpdate(
            { email: "dev@test.com" },
            {
                name: "Test Developer",
                email: "dev@test.com",
                password: devPassword,
                role: "Developer",
            },
            { upsert: true, new: true }
        );
        console.log("✅ Developer user created:", devUser.email);

        console.log("\n🎉 Seed completed successfully!");
        console.log("\n📋 Test Credentials:");
        console.log("   PM Login:        pm@test.com / pm123456");
        console.log("   Developer Login: dev@test.com / dev123456");

    } catch (error) {
        console.error("❌ Seed error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
        process.exit(0);
    }
}

seed();
