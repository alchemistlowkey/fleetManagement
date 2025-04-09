import Driver from '$lib/models/Driver.js';
import { json } from '@sveltejs/kit';
import { adminOnly } from '../../../../hooks.server.js';

export async function GET({ params }) {
	const driver = await Driver.findById(params.id);
	if (!driver) {
		console.error('Driver not found for ID:', params.id);
		return json({ success: false, message: 'Driver not found' }, { status: 404 });
	}
	return json({ success: true, driver }, { status: 200 });
}

export const PUT = adminOnly(async ({ request, params }) => {
	const data = await request.json();
	const driver = await Driver.findByIdAndUpdate(params.id, data, { new: true });
	if (!driver) {
		console.error('Driver not found for ID:', params.id);
		return json({ success: false, message: 'Driver not found' }, { status: 404 });
	}
	return json({ success: true, message: 'Driver updated', driver }, { status: 200 });
});

export const DELETE = adminOnly(async ({ params }) => {
	const driver = await Driver.findByIdAndDelete(params.id);
	if (!driver) {
		console.error('Driver not found for ID:', params.id);
		return json({ success: false, message: 'Driver not found' }, { status: 404 });
	}
	return json({ success: true, message: 'Driver deleted' }, { status: 200 });
});
