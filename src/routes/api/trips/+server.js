import Trip from '$lib/models/Trip.js';
import { json } from '@sveltejs/kit';
import { adminOnly } from '../../../hooks.server.js';

export async function GET({ url }) {
	const pathParts = url.pathname.split('/').filter(Boolean);
	const tripId = pathParts[pathParts.length - 1];

	if (tripId === 'trips') {
		const trips = await Trip.find().populate('vehicleId driverId');
		const transformedTrips = trips.map((trip) => ({
			...trip.toObject(),
			vehicle: trip.vehicleId,
			driver: trip.driverId,
			vehicleId: undefined,
			driverId: undefined
		}));
		return json({ success: true, trips: transformedTrips }, { status: 200 });
	}

	const trip = await Trip.findById(tripId).populate('vehicleId driverId');
	if (!trip) {
		console.error('GET trip not found for ID:', tripId);
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

export const POST = adminOnly(async ({ request }) => {
	const data = await request.json();

	const trip = new Trip(data);
	await trip.save();

	return json({ success: true, message: 'Trip added', trip }, { status: 201 });
});
