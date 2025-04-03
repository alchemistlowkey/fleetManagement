import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
	{
		type: { type: String, enum: ['maintenance', 'fuel', 'license', 'other'], required: true },
		message: { type: String, required: true },
		vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
		driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
		status: { type: String, enum: ['unread', 'read'], default: 'unread' },
		priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
	},
	{ timestamps: true }
);

// Index for frequent queries
alertSchema.index({ vehicleId: 1, driverId: 1, status: 1 });

const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema);

export default Alert;
