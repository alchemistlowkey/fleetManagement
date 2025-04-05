import Driver from '$lib/models/Driver.js';
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

		const drivers = await Driver.find().populate('assignedVehicle');
		return json({ success: true, drivers }, { status: 200 });
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
		const driver = new Driver(data);
		await driver.save();

		return json({ success: true, message: 'Driver added', driver }, { status: 201 });
	} catch (err) {
		return json(
			{ success: false, message: 'Failed to add driver', details: err.message },
			{ status: 500 }
		);
	}
}
