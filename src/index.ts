
addEventListener('fetch', event => {
	event.respondWith(fetchScript(event))
})

async function storeRefererHash(referer: string, hash: string) {
	const expirationTtl = 86400;
  
	await REFERER_HASH_MAPPING.put(referer, hash, { expirationTtl });
}

async function getHashByReferer(referer: string) {
	const hash = await REFERER_HASH_MAPPING.get(referer);
	return hash;
}


async function fetchScript(event: FetchEvent): Promise<Response> {
	
	const targetScript = new URL(event.request.url.split(`${event.request.headers.get("host")}`)[1].replace(/^\/+/, ''));
	const cache = caches.default
	let response = await cache.match(event.request)
	let referrer = event.request.headers.get("referrer") || "ha"

	const hash = await getHashByReferer(referrer)
	console.log("Referer hash", hash)
	if (!response) {
		response = await fetch(targetScript)
		const responseClone = response.clone()

		if (response.status === 200) {
			const responseBuffer = await responseClone.arrayBuffer()
			const hash = await generateHash(responseBuffer)
	
			console.log("Script hash", hash)
			response = new Response(response.body, response)
			response.headers.append('Cache-Control', 'public, max-age=86400') 
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
