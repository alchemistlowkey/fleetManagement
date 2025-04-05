import { json } from '@sveltejs/kit';
import { generateOtp } from '$lib/config/generateOtp.js';
import User from '$lib/models/User.js';
import { transporter } from '$lib/config/transporter.js';
import { EMAIL_VERIFY_TEMPLATE } from '$lib/config/emailTemplates.js';

export async function POST({ request }) {
	try {
		const { email } = await request.json();
		const user = await User.findOne({ email });
		if (!user) {
			return json({ success: false, message: 'User not found' }, { status: 404 });
		}

		if (user.isAccountVerified) {
			return json({ success: false, message: 'User already verified' }, { status: 400 });
		}

		const otp = generateOtp();
		user.verifyOtp = otp; // Match the field used in /verify
		user.verifyOtpExpireAt = Date.now() + 1 * 60 * 1000; // 1 minute
		await user.save();

		await transporter.sendMail({
			from: process.env.EMAIL_USER,
			to: email,
			subject: 'Verify Your Email',
			html: EMAIL_VERIFY_TEMPLATE.replace('{{otp}}', otp).replace('{{email}}', email)
		});

		console.log(`Sending your new OTP ${otp} to ${email}`);

		return json({ success: true, message: 'OTP resent successfully' }, { status: 200 });
	} catch (err) {
		return json({ success: false, message: err.message }, { status: 500 });
	}
}
