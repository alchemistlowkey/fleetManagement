import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		role: { type: String, enum: ['Admin', 'Operator'], default: 'Operator' },
		verifyOtp: { type: String, default: '' },
		verifyOtpExpireAt: { type: Date, default: null },
		isAccountVerified: { type: Boolean, default: false },
		resetOtp: { type: String, default: '' },
		resetOtpExpireAt: { type: Date, default: null }
	},
	{ timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
