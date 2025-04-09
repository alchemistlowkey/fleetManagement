import Trip from '$lib/models/Trip.js';
import { json } from '@sveltejs/kit';
import { adminOnly } from '../../../../hooks.server.js';

export async function GET({ params }) {
	const trip = await Trip.findById(params.id).populate('vehicleId driverId');
	if (!trip) {
		console.error('Trip not found for ID:', params.id);
		return json({ success: false, message: 'Trip not found' }, { status: 404 });
	}

	const transformedTrip = {
		...trip.toObject(),
		vehicle: trip.vehicleId,
		driver: trip.driverId,
		vehicleId: undefined,
		driverId: undefined
	};
	return json({ success: true, trip: transformedTrip }, { status: 200 });
}

export const PUT = adminOnly(async ({ request, params }) => {
	const data = await request.json();
	const updateData = {
		...data,
		vehicleId: data.vehicle,
		driverId: data.driver,
		vehicle: undefined,
		driver: undefined
	};
	const trip = await Trip.findByIdAndUpdate(params.id, updateData, { new: true }).populate(
		'vehicleId driverId'
	);
	if (!trip) {
		console.error('Trip not found for ID:', params.id);
		return json({ success: false, message: 'Trip not found' }, { status: 404 });
	}

	const transformedTrip = {
		...trip.toObject(),
		vehicle: trip.vehicleId,
		driver: trip.driverId,
		vehicleId: undefined,
		driverId: undefined
	};
	return json({ success: true, message: 'Trip updated', trip: transformedTrip }, { status: 200 });
});

export const DELETE = adminOnly(async ({ params }) => {
	const trip = await Trip.findByIdAndDelete(params.id);
	if (!trip) {
		console.error('Trip not found for ID:', params.id);
		return json({ success: false, message: 'Trip not found' }, { status: 404 });
	}

	return json({ success: true, message: 'Trip deleted' }, { status: 200 });
});
