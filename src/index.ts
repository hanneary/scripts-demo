/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

addEventListener('fetch', event => {
	event.respondWith(fetchScript(event))
})

async function fetchScript(event: FetchEvent): Promise<Response> {
	
	const targetScript = new URL(event.request.url.split(`${event.request.headers.get("host")}`)[1].replace(/^\/+/, ''));
	const cache = caches.default
	let response = await cache.match(event.request)
	
	if (!response) {
		response = await fetch(targetScript)


		if (response.status === 200) {

		response = new Response(response.body, response)
		response.headers.append('Cache-Control', 'public, max-age=86400') 
			event.waitUntil(cache.put(event.request, response.clone()))
		} else {
			return new Response('Script not found', { status: 404 })
		}
	}

	return response
}

