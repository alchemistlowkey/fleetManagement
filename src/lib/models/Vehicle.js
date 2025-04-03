import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
	{
		plateNumber: { type: String, required: true, unique: true },
		make: { type: String, required: true },
		model: { type: String, required: true },
		year: { type: Number, required: true, min: 1900, max: new Date().getFullYear() },
		vin: { type: String, required: true, unique: true },
		status: { type: String, enum: ['active', 'inactive', 'inMaintenance'], default: 'active' },
		mileage: { type: Number, default: 0 },
		fuelType: { type: String, enum: ['CNG', 'petrol', 'diesel', 'electric'], required: true },
		location: {
			lat: { type: Number, default: 0 },
			lng: { type: Number, default: 0 }
		},
		assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null }
	},
	{ timestamps: true }
);

const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
