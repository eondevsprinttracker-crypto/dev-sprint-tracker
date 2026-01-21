import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    photoURL?: string;
    role: 'PM' | 'Developer' | 'QA';
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name'],
            trim: true,
            maxlength: [100, 'Name cannot be more than 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email',
            ],
        },
        password: {
            type: String,
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't return password by default
            // Not required - Google users won't have a password
        },
        googleId: {
            type: String,
            sparse: true, // Allow null values but unique when set
            // Not required - PM users won't have a googleId
        },
        photoURL: {
            type: String,
        },
        role: {
            type: String,
            enum: {
                values: ['PM', 'Developer', 'QA'],
                message: 'Role must be PM, Developer, or QA',
            },
            required: [true, 'Please specify the role'],
        },
    },
    {
        timestamps: true,
    }
);

// Custom validation: user must have either password or googleId
UserSchema.path('password').validate(function (value) {
    // If no password, must have googleId
    if (!value && !this.googleId) {
        return false;
    }
    return true;
}, 'User must have either a password or a Google ID');

// Clear cached model during hot reload
if (mongoose.models.User) {
    delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
