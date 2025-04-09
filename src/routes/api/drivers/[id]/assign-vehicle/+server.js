import Driver from '$lib/models/Driver.js';
import Vehicle from '$lib/models/Vehicle.js';
import { json } from '@sveltejs/kit';
import { adminOnly } from '../../../../../hooks.server';

export const PUT = adminOnly(async ({ request, params }) => {
	// Get vehicleId from request body
	const { vehicleId } = await request.json();
	const driverId = params.id;

	// Find the driver
	const driver = await Driver.findById(driverId);
	if (!driver) {
		console.error('Driver not found for ID:', driverId);
		return json({ success: false, message: 'Driver not found' }, { status: 404 });
	}

	// If unassigning vehicle
	if (!vehicleId) {
		if (driver.assignedVehicle) {
			// Update vehicle to remove assignment
			await Vehicle.findByIdAndUpdate(driver.assignedVehicle, {
				assignedDriver: null,
				status: 'active'
			});
		}
		driver.assignedVehicle = null;
		await driver.save();
		return json(
			{
				success: true,
				message: 'Vehicle unassigned successfully',
				driver: await Driver.findById(driverId).populate('assignedVehicle')
			},
			{ status: 200 }
		);
	}

	// Check if vehicle exists
	const vehicle = await Vehicle.findById(vehicleId);
	if (!vehicle) {
		console.error('Vehicle not found for ID:', vehicleId);
		return json({ success: false, message: 'Vehicle not found' }, { status: 404 });
	}

	// Check if vehicle is already assigned to another driver
	const existingAssignment = await Driver.findOne({
		assignedVehicle: vehicleId,
		_id: { $ne: driverId }
	});
	if (existingAssignment) {
		return json(
			{
				success: false,
				message: 'This vehicle is already assigned to another driver'
			},
			{ status: 400 }
		);
	}

	// If driver had a previous vehicle, unassign it
	if (driver.assignedVehicle && driver.assignedVehicle.toString() !== vehicleId) {
		await Vehicle.findByIdAndUpdate(driver.assignedVehicle, {
			assignedDriver: null,
			status: 'active'
		});
	}

	// Assign vehicle to driver and update vehicle status
	driver.assignedVehicle = vehicleId;
	vehicle.assignedDriver = driverId;
	vehicle.status = 'active';

	await Promise.all([driver.save(), vehicle.save()]);

	const updatedDriver = await Driver.findById(driverId).populate('assignedVehicle');

	return json(
		{
			success: true,
			message: 'Vehicle assigned successfully',
			driver: updatedDriver
		},
		{ status: 200 }
	);
});
