import Trip from '$lib/models/Trip.js';
import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET({ request, url }) {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ success: false, message: 'Unauthorized' }, { status: 401 });
		}
		const token = authHeader.split(' ')[1];
		jwt.verify(token, JWT_SECRET);

		const tripId = url.pathname.split('/').pop();
		if (tripId !== '+server.js') {
			const trip = await Trip.findById(tripId).populate('vehicle driver');
			if (!trip) return json({ success: false, message: 'Trip not found' }, { status: 404 });
			return json({ success: true, trip }, { status: 200 });
		}

		const trips = await Trip.find().populate('vehicle driver');
		return json({ success: true, trips }, { status: 200 });
	} catch (err) {
		return json({ success: false, message: err.message }, { status: 401 });
	}
}

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
		console.log('Received trip data:', data);

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

export async function PUT({ request, url }) {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ success: false, message: 'Unauthorized' }, { status: 401 });
		}
		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, JWT_SECRET);
		if (decoded.role !== 'Admin') {
			return json({ success: false, message: 'Admin access required' }, { status: 403 });
		}

		const tripId = url.pathname.split('/').pop();
		const data = await request.json();
		const trip = await Trip.findByIdAndUpdate(tripId, data, { new: true });
		if (!trip) return json({ success: false, message: 'Trip not found' }, { status: 404 });

		return json({ success: true, message: 'Trip updated', trip }, { status: 200 });
	} catch (err) {
		return json({ success: false, message: err.message }, { status: 500 });
	}
}
