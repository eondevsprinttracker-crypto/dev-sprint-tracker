import mongoose, { Schema, Document, Model } from 'mongoose';

// Comment interface for embedded comments
export interface IComment {
    user: mongoose.Types.ObjectId;
    text: string;
    timestamp: Date;
}

// Task complexity enumeration
export type TaskComplexity = 'Easy' | 'Medium' | 'Hard';

// Task status enumeration
export type TaskStatus = 'Todo' | 'In Progress' | 'Pending QA' | 'Pending Review' | 'Completed' | 'Changes Requested';

// QA Review status enumeration
export type QAReviewStatus = 'Pending' | 'Approved' | 'Failed';

// Task priority enumeration
export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';

// Points mapping for complexity
export const COMPLEXITY_POINTS: Record<TaskComplexity, number> = {
    Easy: 1,
    Medium: 3,
    Hard: 5,
};

export interface ITask extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    description: string;
    project?: mongoose.Types.ObjectId; // Optional project reference
    sprint?: mongoose.Types.ObjectId; // Optional sprint reference
    assignedTo: mongoose.Types.ObjectId;
    assignedQA?: mongoose.Types.ObjectId; // QA engineer assigned to review
    createdBy: mongoose.Types.ObjectId;
    status: TaskStatus;
    priority: TaskPriority;
    complexity: TaskComplexity;
    points: number;
    storyPoints: number; // Separate from complexity points for sprint planning
    estimatedHours: number;
    actualHours: number;
    order: number; // For drag-and-drop ordering within sprint
    scheduledStartDate?: Date;
    scheduledEndDate?: Date;
    timerStartTime?: Date;
    totalSecondsSpent: number;
    isTimerRunning: boolean;
    efficiencyBonus: number;
    proofUrl: string;
    isBlocked: boolean;
    blockerNote: string;
    weekNumber: number;
    comments: IComment[];
    startedAt?: Date;
    // QA-specific fields
    qaReviewStatus?: QAReviewStatus;
    qaReviewNotes?: string;
    qaReviewedAt?: Date;
    bugsFound: number;
    qaTimeSpent: number; // Seconds spent on QA review
    qaTimerStartTime?: Date;
    isQATimerRunning: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: [true, 'Comment text is required'],
            trim: true,
            maxlength: [1000, 'Comment cannot be more than 1000 characters'],
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const TaskSchema = new Schema<ITask>(
    {
        title: {
            type: String,
            required: [true, 'Please provide a task title'],
            trim: true,
            maxlength: [200, 'Title cannot be more than 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [2000, 'Description cannot be more than 2000 characters'],
            default: '',
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            // Optional - tasks can exist without a project
        },
        sprint: {
            type: Schema.Types.ObjectId,
            ref: 'Sprint',
            // Optional - tasks can exist without a sprint (backlog)
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Please assign the task to a developer'],
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Task must have a creator'],
        },
        status: {
            type: String,
            enum: {
                values: ['Todo', 'In Progress', 'Pending QA', 'Pending Review', 'Completed', 'Changes Requested'],
                message: 'Invalid task status',
            },
            default: 'Todo',
        },
        assignedQA: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            // Optional - tasks can be reviewed by PM directly
        },
        qaReviewStatus: {
            type: String,
            enum: {
                values: ['Pending', 'Approved', 'Failed'],
                message: 'Invalid QA review status',
            },
        },
        qaReviewNotes: {
            type: String,
            trim: true,
            maxlength: [2000, 'QA notes cannot be more than 2000 characters'],
            default: '',
        },
        qaReviewedAt: {
            type: Date,
        },
        bugsFound: {
            type: Number,
            default: 0,
            min: [0, 'Bugs found cannot be negative'],
        },
        qaTimeSpent: {
            type: Number,
            default: 0,
            min: [0, 'QA time spent cannot be negative'],
        },
        qaTimerStartTime: {
            type: Date,
            default: null,
        },
        isQATimerRunning: {
            type: Boolean,
            default: false,
        },
        priority: {
            type: String,
            enum: {
                values: ['Critical', 'High', 'Medium', 'Low'],
                message: 'Priority must be Critical, High, Medium, or Low',
            },
            default: 'Medium',
        },
        complexity: {
            type: String,
            enum: {
                values: ['Easy', 'Medium', 'Hard'],
                message: 'Complexity must be Easy, Medium, or Hard',
            },
            required: [true, 'Please specify task complexity'],
        },
        points: {
            type: Number,
            enum: [1, 3, 5],
            default: 1,
        },
        storyPoints: {
            type: Number,
            default: 1,
            min: [1, 'Story points must be at least 1'],
            max: [21, 'Story points cannot exceed 21'],
        },
        order: {
            type: Number,
            default: 0,
        },
        estimatedHours: {
            type: Number,
            required: [true, 'Please provide estimated hours'],
            min: [0.5, 'Estimated time must be at least 0.5 hours'],
            max: [100, 'Estimated time cannot exceed 100 hours'],
        },
        actualHours: {
            type: Number,
            default: 0,
            min: [0, 'Actual hours cannot be negative'],
        },
        scheduledStartDate: {
            type: Date,
        },
        scheduledEndDate: {
            type: Date,
        },
        timerStartTime: {
            type: Date,
            default: null,
        },
        totalSecondsSpent: {
            type: Number,
            default: 0,
        },
        isTimerRunning: {
            type: Boolean,
            default: false,
        },
        efficiencyBonus: {
            type: Number,
            default: 0,
        },
        proofUrl: {
            type: String,
            default: '',
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        blockerNote: {
            type: String,
            trim: true,
            maxlength: [500, 'Blocker note cannot be more than 500 characters'],
            default: '',
        },
        weekNumber: {
            type: Number,
            required: [true, 'Week number is required'],
            min: [1, 'Week number must be at least 1'],
            max: [53, 'Week number cannot exceed 53'],
        },
        startedAt: {
            type: Date,
        },
        comments: [CommentSchema],
    },
    {
        timestamps: true,
    }
);

// Note: Points are calculated at task creation time based on complexity
// Use COMPLEXITY_POINTS[complexity] when creating a new task

// Index for efficient queries
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ weekNumber: 1 });
TaskSchema.index({ isBlocked: 1 });
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ sprint: 1, status: 1 });
TaskSchema.index({ sprint: 1, order: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ assignedQA: 1, status: 1 }); // QA review queries

// Prevent recompilation of model during hot reloads
const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
