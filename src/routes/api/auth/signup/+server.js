import { json } from '@sveltejs/kit';
import User from '$lib/models/User';
import bcrypt from 'bcrypt';
import { EMAIL_VERIFY_TEMPLATE } from '$lib/config/emailTemplates.js';
import { generateOtp } from '$lib/config/generateOtp.js';
import { transporter } from '$lib/config/transporter.js';

export async function POST({ request }) {
	try {
		const { name, email, password } = await request.json();

		// Validate input
		if (!name || !email || !password) {
			return json({ success: false, message: 'All fields are required' }, { status: 400 });
		}

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return json({ success: false, message: 'Email already exists' }, { status: 400 });
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10);

		const otp = generateOtp();
		const otpExpireAt = new Date(Date.now() + 1 * 60 * 1000);

		// Create new user
		const user = new User({
			name,
			email,
			password: hashedPassword,
			role: 'Operator',
			verifyOtp: otp,
			verifyOtpExpireAt: otpExpireAt,
			isAccountVerified: false
		});

		await user.save();

		await transporter.sendMail({
			from: process.env.EMAIL_USER,
			to: email,
			subject: 'Verify Your Email',
			// text: `Your OTP is ${otp}. It expires in 4 minutes.`,
			html: EMAIL_VERIFY_TEMPLATE.replace('{{otp}}', otp).replace('{{email}}', email)
		});

		console.log(`Sending OTP ${otp} to ${email}`);

		// Return success response with user data
		return json(
			{
				success: true,
				message: 'Sign up successful! Please verify your email.',
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role
			},
			{ status: 201 }
		);
	} catch (err) {
		return json(
			{ success: false, message: 'Signup failed', details: err.message },
			{ status: 500 }
		);
	}
}
