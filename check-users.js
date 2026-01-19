
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkUsers() {
    try {
        const uri = process.env.MONGODB_URI;
        console.log("Connecting to DB...");
        // Mask password for log
        console.log("URI:", uri.replace(/:([^:@]+)@/, ':****@'));

        await mongoose.connect(uri);
        console.log("Connected successfully!");

        const usersCollection = mongoose.connection.collection('users');
        const count = await usersCollection.countDocuments();
        console.log(`User count: ${count}`);

        if (count > 0) {
            const users = await usersCollection.find({}, { projection: { email: 1, role: 1, name: 1 } }).toArray();
            console.log("Users found:");
            users.forEach(u => console.log(`- ${u.email} (${u.role})`));
        } else {
            console.log("No users found in the database. Please register first.");
        }

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkUsers();
