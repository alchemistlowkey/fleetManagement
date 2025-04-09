import Vehicle from '$lib/models/Vehicle.js';
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

		const vehicle = await Vehicle.findById(params.id);
		if (!vehicle) {
			console.error('Vehicle not found for ID:', params.id);
			return json({ success: false, message: 'Vehicle not found' }, { status: 404 });
		}

		return json({ success: true, vehicle }, { status: 200 });
	} catch (err) {
		console.error('Error in GET /api/vehicles/[id]:', err.stack);
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
		const vehicle = await Vehicle.findByIdAndUpdate(params.id, data, { new: true });
		if (!vehicle) {
			console.error('Vehicle not found for ID:', params.id);
			return json({ success: false, message: 'Vehicle not found' }, { status: 404 });
		}

		return json({ success: true, message: 'Vehicle updated', vehicle }, { status: 200 });
	} catch (err) {
		console.error('Error in PUT /api/vehicles/[id]:', err.stack);
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

		const vehicle = await Vehicle.findByIdAndDelete(params.id);
		if (!vehicle) {
			console.error('Vehicle not found for ID:', params.id);
			return json({ success: false, message: 'Vehicle not found' }, { status: 404 });
		}

		return json({ success: true, message: 'Vehicle deleted' }, { status: 200 });
	} catch (err) {
		console.error('Error in DELETE /api/vehicles/[id]:', err.stack);
		return json({ success: false, message: err.message }, { status: 500 });
	}
}
