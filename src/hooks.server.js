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
			throw new Error('Database connection failed');
		}
	}
}

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT and attach user to locals
async function authenticate(event) {
	const token =
		event.cookies.get('token') ||
		event.request.headers.get('Authorization')?.replace('Bearer ', '');
	if (!token) {
		throw new Error('Unauthorized');
	}
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		event.locals.user = decoded;
	} catch (err) {
		console.error('JWT verification failed:', err.message);
		event.cookies.delete('token', { path: '/' });
		throw new Error('Invalid token');
	}
}

// Middleware to enforce Admin role
function requireAdmin(event) {
	if (!event.locals.user || event.locals.user.role !== 'Admin') {
		throw new Error('Admin access required');
	}
}

export async function handle({ event, resolve }) {
	await initializeDB();

	// Public routes that don't require authentication
	const publicRoutes = [
		'/api/auth/login',
		'/api/auth/signup',
		'/api/auth/verify',
		'/api/auth/resend-otp'
	];

	try {
		// Only authenticate if the route is under /api but not a public route
		if (event.url.pathname.startsWith('/api') && !publicRoutes.includes(event.url.pathname)) {
			await authenticate(event);
		}
	} catch (err) {
		return new Response(JSON.stringify({ success: false, message: err.message }), {
			status: err.message === 'Unauthorized' || err.message === 'Invalid token' ? 401 : 500
		});
	}

	const response = await resolve(event);
	return response;
}

// Export a helper to enforce admin-only routes in specific APIs
export function adminOnly(fn) {
	return async (event) => {
		requireAdmin(event);
		return fn(event);
	};
}
