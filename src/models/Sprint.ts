import mongoose, { Schema, Document, Model } from 'mongoose';

// Sprint status enumeration
export type SprintStatus = 'Planning' | 'Active' | 'Completed' | 'Cancelled';

// Sprint interface
export interface ISprint extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    goal: string;
    project: mongoose.Types.ObjectId;
    startDate: Date;
    endDate: Date;
    status: SprintStatus;
    capacity: number; // Planned story points
    velocity: number; // Completed story points (calculated)
    retrospective: string;
    createdBy: mongoose.Types.ObjectId;
    order: number; // For ordering sprints
    createdAt: Date;
    updatedAt: Date;
}

const SprintSchema = new Schema<ISprint>(
    {
        name: {
            type: String,
            required: [true, 'Please provide a sprint name'],
            trim: true,
            maxlength: [100, 'Sprint name cannot be more than 100 characters'],
        },
        goal: {
            type: String,
            trim: true,
            maxlength: [500, 'Sprint goal cannot be more than 500 characters'],
            default: '',
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Sprint must belong to a project'],
        },
        startDate: {
            type: Date,
            required: [true, 'Please provide a start date'],
        },
        endDate: {
            type: Date,
            required: [true, 'Please provide an end date'],
        },
        status: {
            type: String,
            enum: {
                values: ['Planning', 'Active', 'Completed', 'Cancelled'],
                message: 'Invalid sprint status',
            },
            default: 'Planning',
        },
        capacity: {
            type: Number,
            default: 0,
            min: [0, 'Capacity cannot be negative'],
        },
        velocity: {
            type: Number,
            default: 0,
            min: [0, 'Velocity cannot be negative'],
        },
        retrospective: {
            type: String,
            trim: true,
            maxlength: [2000, 'Retrospective cannot be more than 2000 characters'],
            default: '',
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sprint must have a creator'],
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
SprintSchema.index({ project: 1, status: 1 });
SprintSchema.index({ createdBy: 1 });
SprintSchema.index({ startDate: 1, endDate: 1 });
SprintSchema.index({ project: 1, order: 1 });

// Virtual to check if sprint is currently active based on dates
SprintSchema.virtual('isCurrentlyActive').get(function () {
    const now = new Date();
    return this.status === 'Active' && this.startDate <= now && this.endDate >= now;
});

// Virtual to calculate days remaining
SprintSchema.virtual('daysRemaining').get(function () {
    if (this.status === 'Completed' || this.status === 'Cancelled') return 0;
    const now = new Date();
    const end = new Date(this.endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
});

// Virtual to calculate sprint duration in days
SprintSchema.virtual('durationDays').get(function () {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included in JSON
SprintSchema.set('toJSON', { virtuals: true });
SprintSchema.set('toObject', { virtuals: true });

// Prevent recompilation of model during hot reloads
const Sprint: Model<ISprint> =
    mongoose.models.Sprint || mongoose.model<ISprint>('Sprint', SprintSchema);

export default Sprint;
