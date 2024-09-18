
addEventListener('fetch', event => {
	event.respondWith(fetchScript(event))
})

const EXPIRATION_TTL = 500;

async function storeRefererHash(referer: string, hash: string) {
	const expirationTtl = 86400000;
  
	await REFERER_HASH_MAPPING.put(referer, hash, { EXPIRATION_TTL });
}

async function getHashByReferer(referer: string) {
	const hash = await REFERER_HASH_MAPPING.get(referer);
	return hash;
}


async function fetchScript(event: FetchEvent): Promise<Response> {
	
	const targetScript = new URL(event.request.url.split(`${event.request.headers.get("host")}`)[1].replace(/^\/+/, ''));
	const cache = caches.default
	let response = await cache.match(event.request)
	let referrer = event.request.headers.get("referrer") || "none"

	const hash = await getHashByReferer(referrer)
	console.log("Referer hash", hash)
	
	if (true) {
		response = await fetch(targetScript)
		const responseClone = response.clone()

		if (response.status === 200) {
			const responseBuffer = await responseClone.arrayBuffer()
			const hash = await generateHash(responseBuffer)
	
			console.log("Script hash", hash)
			response = new Response(response.body, response)
			event.waitUntil(cache.put(event.request, response.clone()))
			event.waitUntil(storeRefererHash(referrer, hash))
		} else {
			return new Response('Script not found', { status: 404 })
		}
	}

	return response
}

async function generateHash(data: ArrayBuffer) {
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
	return hashHex;
}
