/* eslint-disable no-unused-vars */
import connectDB from '$lib/config/mongodb';
import jwt from 'jsonwebtoken';
import Driver from '$lib/models/Driver';
import Vehicle from '$lib/models/Vehicle';
import Trip from '$lib/models/Trip';

let dbConnected = false;

async function initializeDB() {
	if (!dbConnected) {
		try {
			await connectDB();
			dbConnected = true;
		} catch (err) {
			console.error('Failed to initialize database:', err.message);
		}
	}
}

initializeDB();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function handle({ event, resolve }) {
	if (!dbConnected) {
		await initializeDB();
	}

	const token = event.cookies.get('token');
	if (token) {
		try {
			const decoded = jwt.verify(token, JWT_SECRET);
			event.locals.user = decoded;
		} catch (err) {
			console.error(err);
			event.cookies.delete('token', { path: '/' });
		}
	}

	const response = await resolve(event);
	return response;
}
