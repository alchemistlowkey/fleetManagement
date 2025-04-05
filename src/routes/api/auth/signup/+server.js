import { json } from '@sveltejs/kit';
import User from '$lib/models/User';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

function generateOtp() {
	return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS
	}
});

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
		const otpExpireAt = new Date(Date.now() + 10 * 60 * 1000);

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
			text: `Your OTP is ${otp}. It expires in 10 minutes.`
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
