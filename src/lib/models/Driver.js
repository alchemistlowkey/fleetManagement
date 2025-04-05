import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
	{
		driverName: { type: String, required: true },
		driverEmail: { type: String, required: true, unique: true },
		phone: { type: String, required: true },
		licenseNumber: { type: String, required: true, unique: true },
		assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
		status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
		schedule: [
			{
				startTime: { type: Date, required: true },
				endTime: { type: Date, required: true },
				tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null }
			}
		]
	},
	{ timestamps: true }
);

const Driver = mongoose.models.Driver || mongoose.model('Driver', driverSchema);

export default Driver;
