import { browser } from '$app/environment';

let loaderInstance = null;

export async function getGoogleMapsLoader() {
	if (!browser) return null; // Avoid running on server
	if (!loaderInstance) {
		const { Loader } = await import('@googlemaps/js-api-loader');
		loaderInstance = new Loader({
			apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
			version: 'weekly',
			libraries: ['places'] // Required for PlaceAutocompleteElement and Directions
		});
	}
	return loaderInstance;
}
