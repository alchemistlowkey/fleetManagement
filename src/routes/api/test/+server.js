import { json } from '@sveltejs/kit';

export async function GET() {
	try {
		return json({ success: true, message: 'Database connected successfully' }, { status: 200 });
	} catch (err) {
		return json(
			{ success: false, message: 'Database connection failed', details: err.message },
			{ status: 500 }
		);
	}
}
