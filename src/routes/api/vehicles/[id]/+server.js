import Vehicle from '$lib/models/Vehicle.js';
import { json } from '@sveltejs/kit';
import { adminOnly } from '../../../../hooks.server.js';

export async function GET({ params }) {
	const vehicle = await Vehicle.findById(params.id);
	if (!vehicle) {
		console.error('Vehicle not found for ID:', params.id);
		return json({ success: false, message: 'Vehicle not found' }, { status: 404 });
	}
	return json({ success: true, vehicle }, { status: 200 });
}

export const PUT = adminOnly(async ({ request, params }) => {
	const data = await request.json();
	const vehicle = await Vehicle.findByIdAndUpdate(params.id, data, { new: true });
	if (!vehicle) {
		console.error('Vehicle not found for ID:', params.id);
		return json({ success: false, message: 'Vehicle not found' }, { status: 404 });
	}
	return json({ success: true, message: 'Vehicle updated', vehicle }, { status: 200 });
});

export const DELETE = adminOnly(async ({ params }) => {
	const vehicle = await Vehicle.findByIdAndDelete(params.id);
	if (!vehicle) {
		console.error('Vehicle not found for ID:', params.id);
		return json({ success: false, message: 'Vehicle not found' }, { status: 404 });
	}
	return json({ success: true, message: 'Vehicle deleted' }, { status: 200 });
});
