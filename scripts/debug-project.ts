
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

// Define minimal schemas inline to avoid import resolution issues in standalone script
const ProjectSchema = new mongoose.Schema({
    name: String,
    key: String,
    developers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { strict: false });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String
}, { strict: false });

// Use existing models if defined (unlikely in standalone) or create new
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function debugProject() {
    try {
        await mongoose.connect(MONGODB_URI!);
        console.log('Connected to MongoDB');

        // Find project by name "Lahiru Harshana" as seen in screenshot
        // Using simple regex for safety
        const project = await Project.findOne({ name: /Lahiru Harshana/i });

        if (!project) {
            console.log("Project 'Lahiru Harshana' not found.");
            return;
        }

        console.log('--- Project Metadata ---');
        console.log(`ID: ${project._id}`);
        console.log(`Name: ${project.name}`);
        console.log(`Key: ${project.key}`);
        console.log(`Developers (Raw IDs):`, project.developers);

        const populatedProject = await Project.findById(project._id).populate('developers', 'name email');
        console.log('--- Populated Developers ---');

        // @ts-ignore
        if (populatedProject?.developers && populatedProject.developers.length > 0) {
            // @ts-ignore
            console.log(JSON.stringify(populatedProject.developers, null, 2));
        } else {
            console.log('No developers found after populate().');

            // Check if the IDs actually exist in User collection
            if (project.developers && project.developers.length > 0) {
                console.log('Checking if User IDs exist in User collection...');
                const users = await User.find({ _id: { $in: project.developers } });
                console.log(`Found ${users.length} matching users in User collection.`);
                users.forEach((u: any) => console.log(`- ${u.name} (${u._id})`));

                if (users.length === 0) {
                    console.log("WARNING: The User IDs in the project do NOT match any users in the database.");
                } else if (users.length < project.developers.length) {
                    console.log("WARNING: Some User IDs in the project are missing from the database.");
                }
            } else {
                console.log("Project has no developers assigned in the DB.");
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugProject();
