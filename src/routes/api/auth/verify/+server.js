import User from '$lib/models/User.js';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	try {
		const { email, otp } = await request.json();

		if (!email || !otp) {
			return json({ success: false, message: 'Email and OTP are required' }, { status: 400 });
		}

		const user = await User.findOne({ email });
		if (!user) {
			return json({ success: false, message: 'User not found' }, { status: 404 });
		}

		if (user.isAccountVerified) {
			return json({ success: false, message: 'Account already verified' }, { status: 400 });
		}

		if (user.verifyOtp !== otp || user.verifyOtpExpireAt < new Date()) {
			return json({ success: false, message: 'Invalid or expired OTP' }, { status: 400 });
		}

		user.isAccountVerified = true;
		user.verifyOtp = '';
		user.verifyOtpExpireAt = null;
		await user.save();

		return json(
			{
				success: true,
				message: 'Email verified! Please log in.',
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role
			},
			{ status: 200 }
		);
	} catch (err) {
		return json(
			{ success: false, message: 'Verification failed', details: err.message },
			{ status: 500 }
		);
	}
}
