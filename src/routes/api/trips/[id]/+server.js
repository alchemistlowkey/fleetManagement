import Trip from '$lib/models/Trip.js';
import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET({ request, params }) {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ success: false, message: 'Unauthorized' }, { status: 401 });
		}
		const token = authHeader.split(' ')[1];
		jwt.verify(token, JWT_SECRET);

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
	} catch (err) {
		console.error('Error in GET /api/trips/[id]:', err.stack);
		return json({ success: false, message: err.message }, { status: 500 });
	}
}

export async function PUT({ request, params }) {
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

		const data = await request.json();
		// Rename vehicle and driver to vehicleId and driverId to match schema
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
	} catch (err) {
		console.error('Error in PUT /api/trips/[id]:', err.stack);
		return json({ success: false, message: err.message }, { status: 500 });
	}
}

export async function DELETE({ request, params }) {
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

		const trip = await Trip.findByIdAndDelete(params.id);
		if (!trip) {
			console.error('Trip not found for ID:', params.id);
			return json({ success: false, message: 'Trip not found' }, { status: 404 });
		}

		return json({ success: true, message: 'Trip deleted' }, { status: 200 });
	} catch (err) {
		console.error('Error in DELETE /api/trips/[id]:', err.stack);
		return json({ success: false, message: err.message }, { status: 500 });
	}
}
