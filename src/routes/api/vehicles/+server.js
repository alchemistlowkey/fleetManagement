import Vehicle from '$lib/models/Vehicle.js';
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

		const vehicles = await Vehicle.find().populate('assignedDriver');
		return json({ success: true, vehicles }, { status: 200 });
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
		const decoded = jwt.verify(token, JWT_SECRET);
		if (decoded.role !== 'Admin') {
			return json({ success: false, message: 'Admin access required' }, { status: 403 });
		}

		const data = await request.json();
		const vehicle = new Vehicle(data);
		await vehicle.save();

		return json({ success: true, message: 'Vehicle added', vehicle }, { status: 201 });
	} catch (err) {
		return json(
			{ success: false, message: 'Failed to add vehicle', details: err.message },
			{ status: 500 }
		);
	}
}
