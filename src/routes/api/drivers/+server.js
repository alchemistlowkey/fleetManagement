import Driver from '$lib/models/Driver.js';
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

		const pathParts = url.pathname.split('/').filter(Boolean); // Remove empty strings
		const driverId = pathParts[pathParts.length - 1]; // Last part of the path

		if (driverId === 'drivers') {
			const drivers = await Driver.find().populate('assignedVehicle');
			return json({ success: true, drivers }, { status: 200 });
		}

		const driver = await Driver.findById(driverId).populate('assignedVehicle');
		if (!driver) return json({ success: false, message: 'Driver not found' }, { status: 404 });
		return json({ success: true, driver }, { status: 200 });
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
