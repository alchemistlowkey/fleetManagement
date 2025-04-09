import Driver from '$lib/models/Driver.js';
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

		const driver = await Driver.findById(params.id);
		if (!driver) {
			console.error('Driver not found for ID:', params.id);
			return json({ success: false, message: 'Driver not found' }, { status: 404 });
		}

		return json({ success: true, driver }, { status: 200 });
	} catch (err) {
		console.error('Error in GET /api/drivers/[id]:', err.stack);
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
		const driver = await Driver.findByIdAndUpdate(params.id, data, { new: true });
		if (!driver) {
			console.error('Driver not found for ID:', params.id);
			return json({ success: false, message: 'Driver not found' }, { status: 404 });
		}

		return json({ success: true, message: 'Driver updated', driver }, { status: 200 });
	} catch (err) {
		console.error('Error in PUT /api/drivers/[id]:', err.stack);
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

		const driver = await Driver.findByIdAndDelete(params.id);
		if (!driver) {
			console.error('Driver not found for ID:', params.id);
			return json({ success: false, message: 'Driver not found' }, { status: 404 });
		}

		return json({ success: true, message: 'Driver deleted' }, { status: 200 });
	} catch (err) {
		console.error('Error in DELETE /api/drivers/[id]:', err.stack);
		return json({ success: false, message: err.message }, { status: 500 });
	}
}
