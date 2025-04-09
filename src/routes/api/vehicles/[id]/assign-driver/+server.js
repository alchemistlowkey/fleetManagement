import Driver from '$lib/models/Driver.js';
import Vehicle from '$lib/models/Vehicle.js';
import { json } from '@sveltejs/kit';
import { adminOnly } from '../../../../../hooks.server';

export const PUT = adminOnly(async ({ request, params }) => {
	const { driverId } = await request.json();
	const vehicleId = params.id;

	const vehicle = await Vehicle.findById(vehicleId);
	if (!vehicle) {
		console.error('Vehicle not found for ID:', vehicleId);
		return json({ success: false, message: 'Vehicle not found' }, { status: 404 });
	}

	if (!driverId) {
		if (vehicle.assignedDriver) {
			await Driver.findByIdAndUpdate(vehicle.assignedDriver, {
				assignedVehicle: null
			});
		}
		vehicle.assignedDriver = null;
		await vehicle.save();
		return json(
			{
				success: true,
				message: 'Driver unassigned successfully',
				vehicle: await Vehicle.findById(vehicleId).populate('assignedDriver')
			},
			{ status: 200 }
		);
	}

	const driver = await Driver.findById(driverId);
	if (!driver) {
		console.error('Driver not found for ID:', driverId);
		return json({ success: false, message: 'Driver not found' }, { status: 404 });
	}

	const existingAssignment = await Vehicle.findOne({
		assignedDriver: driverId,
		_id: { $ne: vehicleId }
	});
	if (existingAssignment) {
		return json(
			{
				success: false,
				message: 'This driver is already assigned to another vehicle'
			},
			{ status: 400 }
		);
	}

	if (vehicle.assignedDriver && vehicle.assignedDriver.toString() !== driverId) {
		await Driver.findByIdAndUpdate(vehicle.assignedDriver, {
			assignedVehicle: null
		});
	}

	vehicle.assignedDriver = driverId;
	driver.assignedVehicle = vehicleId;

	await Promise.all([vehicle.save(), driver.save()]);

	const updatedVehicle = await Vehicle.findById(vehicleId).populate('assignedDriver');

	return json(
		{
			success: true,
			message: 'Driver assigned successfully',
			vehicle: updatedVehicle
		},
		{ status: 200 }
	);
});
