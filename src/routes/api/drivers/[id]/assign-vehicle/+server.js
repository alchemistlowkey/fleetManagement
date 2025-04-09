import Driver from '$lib/models/Driver.js';
import Vehicle from '$lib/models/Vehicle.js';
import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function PUT({ request, params }) {
	try {
		// Authentication check
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ success: false, message: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, JWT_SECRET);
		if (decoded.role !== 'Admin') {
			return json({ success: false, message: 'Admin access required' }, { status: 403 });
		}

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
		vehicle.status = 'active'; // or you might want a different status like 'assigned'

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
	} catch (err) {
		console.error('Error in PUT /api/drivers/[id]/assign-vehicle:', err.stack);
		return json(
			{
				success: false,
				message: err.message
			},
			{ status: 500 }
		);
	}
}
