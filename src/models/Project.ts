import mongoose, { Schema, Document, Model } from 'mongoose';

// Project status enumeration
export type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'Archived';

// Project interface
export interface IProject extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    key: string; // Unique project key (e.g., "DEV", "WEB")
    status: ProjectStatus;
    color: string; // Theme color for project (hex)
    startDate: Date;
    targetEndDate?: Date;
    actualEndDate?: Date;
    developers: mongoose.Types.ObjectId[]; // Team members assigned
    createdBy: mongoose.Types.ObjectId; // PM who created it
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
    {
        name: {
            type: String,
            required: [true, 'Please provide a project name'],
            trim: true,
            maxlength: [100, 'Project name cannot be more than 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot be more than 500 characters'],
            default: '',
        },
        key: {
            type: String,
            required: [true, 'Please provide a project key'],
            unique: true,
            uppercase: true,
            trim: true,
            minlength: [2, 'Key must be at least 2 characters'],
            maxlength: [6, 'Key cannot be more than 6 characters'],
            match: [/^[A-Z]+$/, 'Key must contain only letters'],
        },
        status: {
            type: String,
            enum: {
                values: ['Active', 'On Hold', 'Completed', 'Archived'],
                message: 'Invalid project status',
            },
            default: 'Active',
        },
        color: {
            type: String,
            default: '#f97316', // Default orange
            match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'],
        },
        startDate: {
            type: Date,
            required: [true, 'Please provide a start date'],
        },
        targetEndDate: {
            type: Date,
        },
        actualEndDate: {
            type: Date,
        },
        developers: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Project must have a creator'],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
ProjectSchema.index({ createdBy: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ key: 1 }, { unique: true });
ProjectSchema.index({ developers: 1 });

// Prevent recompilation of model during hot reloads
const Project: Model<IProject> =
    mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
