import Trip from '$lib/models/Trip.js';
import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET({ request }) {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ success: false, message: 'Unauthorized' }, { status: 401 });
		}
		const token = authHeader.split(' ')[1];
		jwt.verify(token, JWT_SECRET);

		const trips = await Trip.find().populate('vehicle driver');
		return json({ success: true, trips }, { status: 200 });
	} catch (err) {
		return json(
			{ success: false, message: err.message || 'Failed to fetch trips' },
			{ status: 401 }
		);
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
