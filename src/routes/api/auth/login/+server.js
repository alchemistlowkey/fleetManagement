import User from '$lib/models/User.js';
import { json } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST({ request, cookies }) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json({ success: false, message: 'Email and password are required' }, { status: 400 });
		}

		const user = await User.findOne({ email });
		if (!user) {
			return json({ success: false, message: 'Invalid credentials' }, { status: 401 });
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return json({ success: false, message: 'Invalid credentials' }, { status: 401 });
		}

		// Generate JWT
		const token = jwt.sign(
			{ id: user._id, email: user.email, role: user.role },
			JWT_SECRET,
			{ expiresIn: '1h' } // Token expires in 1 hour
		);

		cookies.set('token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60, // 1 hour
			path: '/'
		});

		return json(
			{
				success: true,
				message: 'Login successful',
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				token,
				isAccountVerified: user.isAccountVerified || false
			},
			{ status: 200 }
		);
	} catch (err) {
		return json({ success: false, message: 'Login failed', details: err.message }, { status: 500 });
	}
}
