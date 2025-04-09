import Driver from '$lib/models/Driver.js';
import Vehicle from '$lib/models/Vehicle.js';
import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

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
	} catch (err) {
		console.error('Error in PUT /api/vehicles/[id]/assign-driver:', err.stack);
		return json(
			{
				success: false,
				message: err.message
			},
			{ status: 500 }
		);
	}
}
