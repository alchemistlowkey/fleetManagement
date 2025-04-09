import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
	{
		vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
		driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
		startLocation: {
			lat: { type: Number, required: true },
			lng: { type: Number, required: true }
		},
		endLocation: {
			lat: { type: Number, required: true },
			lng: { type: Number, required: true }
		},
		distance: { type: Number, required: true },
		startTime: { type: Date, required: true },
		endTime: { type: Date },
		status: {
			type: String,
			enum: ['inProgress', 'completed', 'cancelled', 'scheduled'],
			default: 'scheduled'
		},
		fuelUsed: { type: Number, default: 0 } // in liters
	},
	{ timestamps: true }
);

// Indexes for frequent queries
tripSchema.index({ vehicleId: 1, driverId: 1, startTime: 1 });

const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);

export default Trip;
