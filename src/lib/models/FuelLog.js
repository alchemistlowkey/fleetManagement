import mongoose from 'mongoose';

const fuelLogSchema = new mongoose.Schema(
	{
		vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
		driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
		liters: { type: Number, required: true },
		cost: { type: Number, required: true },
		date: { type: Date, required: true },
		fuelStation: { type: String, default: '' },
		mileage: { type: Number, required: true }
	},
	{ timestamps: true }
);

// Index for frequent queries
fuelLogSchema.index({ vehicleId: 1, driverId: 1, date: 1 });

const FuelLog = mongoose.models.FuelLog || mongoose.model('FuelLog', fuelLogSchema);

export default FuelLog;
