import Trip from '$lib/models/Trip.js';
import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET({ request, url }) {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			console.error('No or invalid Authorization header in GET');
			return json({ success: false, message: 'Unauthorized' }, { status: 401 });
		}
		const token = authHeader.split(' ')[1];

		try {
			jwt.verify(token, JWT_SECRET);
		} catch (jwtErr) {
			console.error('JWT verification failed in GET:', jwtErr.message);
			return json({ success: false, message: 'Invalid token' }, { status: 401 });
		}

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
	} catch (err) {
		console.error('Error in GET /api/trips:', err.stack);
		return json({ success: false, message: err.message }, { status: 500 });
	}
}

// POST and PUT remain unchanged for this fix
export async function POST({ request }) {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ success: false, message: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		if (!JWT_SECRET) {
			throw new Error('JWT_SECRET is not defined in environment variables');
		}
		const decoded = jwt.verify(token, JWT_SECRET);
		if (decoded.role !== 'Admin') {
			return json({ success: false, message: 'Admin access required' }, { status: 403 });
		}

		const data = await request.json();

		const trip = new Trip(data);
		await trip.save();

		return json({ success: true, message: 'Trip added', trip }, { status: 201 });
	} catch (err) {
		console.error('Error in POST /api/trips:', err.stack);
		return json(
			{ success: false, message: 'Failed to add trip', details: err.message || 'Unknown error' },
			{ status: 500 }
		);
	}
}
