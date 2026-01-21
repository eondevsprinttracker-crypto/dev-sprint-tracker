import mongoose, { Schema, Document, Model } from 'mongoose';

// Project status enumeration
export type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'Archived';

// New enumerations for enhanced fields
export type ProjectCategory = 'Web' | 'Mobile' | 'Desktop' | 'API' | 'Data' | 'DevOps' | 'Other';
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ProjectVisibility = 'Private' | 'Team' | 'Public';
export type ProjectRiskLevel = 'Low' | 'Medium' | 'High';

// Project interface
export interface IProjectAttachment {
    name: string;
    url: string;
    publicId: string;
    type: 'image' | 'video' | 'pdf' | 'document' | 'other';
    size: number;
    uploadedAt: Date;
}

export interface IProject extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    key: string; // Unique project key (e.g., "DEV", "WEB")
    status: ProjectStatus;
    color: string; // Theme color for project (hex)

    // Enhanced fields
    category: ProjectCategory;
    priority: ProjectPriority;
    visibility: ProjectVisibility;
    riskLevel: ProjectRiskLevel;
    client?: string;
    repository?: string;
    tags: string[];
    notes?: string; // Internal PM notes
    attachments: IProjectAttachment[]; // File attachments

    // Timeline
    startDate: Date;
    targetEndDate?: Date;
    actualEndDate?: Date;

    // Team
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
            maxlength: [10000, 'Description cannot be more than 10000 characters'],
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
        // Enhanced fields
        category: {
            type: String,
            enum: {
                values: ['Web', 'Mobile', 'Desktop', 'API', 'Data', 'DevOps', 'Other'],
                message: 'Invalid project category',
            },
            default: 'Web',
        },
        priority: {
            type: String,
            enum: {
                values: ['Low', 'Medium', 'High', 'Critical'],
                message: 'Invalid project priority',
            },
            default: 'Medium',
        },
        visibility: {
            type: String,
            enum: {
                values: ['Private', 'Team', 'Public'],
                message: 'Invalid visibility setting',
            },
            default: 'Team',
        },
        riskLevel: {
            type: String,
            enum: {
                values: ['Low', 'Medium', 'High'],
                message: 'Invalid risk level',
            },
            default: 'Low',
        },
        attachments: [{
            name: {
                type: String,
                required: true,
                trim: true,
            },
            url: {
                type: String,
                required: true,
            },
            publicId: {
                type: String,
                required: true,
            },
            type: {
                type: String,
                enum: ['image', 'video', 'pdf', 'document', 'other'],
                default: 'other',
            },
            size: {
                type: Number,
                default: 0,
            },
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        }],
        client: {
            type: String,
            trim: true,
            maxlength: [100, 'Client name cannot be more than 100 characters'],
        },
        repository: {
            type: String,
            trim: true,
            maxlength: [500, 'Repository URL cannot be more than 500 characters'],
        },
        tags: [{
            type: String,
            trim: true,
            maxlength: [50, 'Tag cannot be more than 50 characters'],
        }],
        notes: {
            type: String,
            trim: true,
            maxlength: [2000, 'Notes cannot be more than 2000 characters'],
        },
        // Timeline
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
        // Team
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
ProjectSchema.index({ category: 1 });
ProjectSchema.index({ priority: 1 });
ProjectSchema.index({ tags: 1 });

// Prevent recompilation of model during hot reloads
const Project: Model<IProject> =
    mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
