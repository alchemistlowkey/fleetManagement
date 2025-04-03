import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema(
	{
		vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
		description: { type: String, required: true },
		cost: { type: Number, required: true },
		date: { type: Date, required: true },
		mechanic: { type: String, default: '' },
		status: { type: String, enum: ['scheduled', 'completed', 'pending'], default: 'pending' },
		mileageAtMaintenance: { type: Number, required: true }
	},
	{ timestamps: true }
);

// Index for frequent queries
maintenanceSchema.index({ vehicleId: 1, date: 1 });

const Maintenance = mongoose.models.Maintenance || mongoose.model('Maintenance', maintenanceSchema);

export default Maintenance;
