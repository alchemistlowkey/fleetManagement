import Driver from '$lib/models/Driver.js';
import { json } from '@sveltejs/kit';
import { adminOnly } from '../../../hooks.server';

export async function GET({ url }) {
	const pathParts = url.pathname.split('/').filter(Boolean);
	const driverId = pathParts[pathParts.length - 1];

	if (driverId === 'drivers') {
		const drivers = await Driver.find().populate('assignedVehicle');
		return json({ success: true, drivers }, { status: 200 });
	}

	const driver = await Driver.findById(driverId).populate('assignedVehicle');
	if (!driver) {
		return json({ success: false, message: 'Driver not found' }, { status: 404 });
	}
	return json({ success: true, driver }, { status: 200 });
}

export const POST = adminOnly(async ({ request }) => {
	const data = await request.json();
	const driver = new Driver(data);
	await driver.save();
	return json({ success: true, message: 'Driver added', driver }, { status: 201 });
});
