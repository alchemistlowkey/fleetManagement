import Vehicle from '$lib/models/Vehicle.js';
import { json } from '@sveltejs/kit';
import { adminOnly } from '../../../hooks.server.js';

export async function GET({ url }) {
	const pathParts = url.pathname.split('/').filter(Boolean);
	const vehicleId = pathParts[pathParts.length - 1];

	if (vehicleId === 'vehicles') {
		const vehicles = await Vehicle.find().populate('assignedDriver');
		return json({ success: true, vehicles }, { status: 200 });
	}

	const vehicle = await Vehicle.findById(vehicleId).populate('assignedDriver');
	if (!vehicle) {
		return json({ success: false, message: 'Vehicle not found' }, { status: 404 });
	}
	return json({ success: true, vehicle }, { status: 200 });
}

export const POST = adminOnly(async ({ request }) => {
	const data = await request.json();
	const vehicle = new Vehicle(data);
	await vehicle.save();
	return json({ success: true, message: 'Vehicle added', vehicle }, { status: 201 });
});
