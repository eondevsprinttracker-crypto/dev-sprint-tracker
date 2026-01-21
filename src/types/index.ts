import { IUser } from '@/models/User';
import { ITask, IComment, TaskComplexity, TaskStatus } from '@/models/Task';

// Re-export model interfaces
export type { IUser, ITask, IComment, TaskComplexity, TaskStatus };

// User-related types
export interface UserSession {
    id: string;
    name: string;
    email: string;
    role: 'PM' | 'Developer' | 'QA';
}

// Safe user type (without password)
export interface SafeUser {
    _id: string;
    name: string;
    email: string;
    role: 'PM' | 'Developer' | 'QA';
    createdAt: Date;
    updatedAt: Date;
}

// Task-related types
export interface TaskWithUser extends Omit<ITask, 'assignedTo' | 'createdBy'> {
    assignedTo: SafeUser;
    createdBy: SafeUser;
}

// Comment with populated user
export interface CommentWithUser extends Omit<IComment, 'user'> {
    user: SafeUser;
}

// Dashboard statistics
export interface DeveloperStats {
    userId: string;
    name: string;
    totalPoints: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    averageEfficiency: number; // (estimatedHours / actualHours) * 100
}

export interface WeeklyLeaderboard {
    weekNumber: number;
    developers: DeveloperStats[];
}

// Task filters
export interface TaskFilters {
    status?: TaskStatus;
    assignedTo?: string;
    isBlocked?: boolean;
    weekNumber?: number;
    complexity?: TaskComplexity;
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Form types
export interface CreateTaskInput {
    title: string;
    description: string;
    assignedTo: string;
    complexity: TaskComplexity;
    estimatedHours: number;
    weekNumber: number;
}

export interface UpdateTaskStatusInput {
    taskId: string;
    status: TaskStatus;
    actualHours?: number;
    proofUrl?: string;
}

export interface AddCommentInput {
    taskId: string;
    text: string;
}

export interface BlockerInput {
    taskId: string;
    isBlocked: boolean;
    blockerNote?: string;
}
