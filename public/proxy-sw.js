self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  let target = '';
  if (url.hostname === 'firestore.googleapis.com') {
    target = 'firestore';
  } else if (url.hostname === 'identitytoolkit.googleapis.com') {
    target = 'auth';
  } else if (url.hostname === 'securetoken.googleapis.com') {
    target = 'token';
  }

  if (target) {
    // Redirect to local proxy path defined in vercel.json
    const proxyUrl = `/api/proxy/${target}${url.pathname}${url.search}`;
    
    event.respondWith(
      (async () => {
        const headers = new Headers(event.request.headers);
        
        // Ensure we handle CORS correctly by making it a same-origin request to our server
        const modifiedRequest = new Request(proxyUrl, {
          method: event.request.method,
          headers: headers,
          body: event.request.method !== 'GET' && event.request.method !== 'HEAD' ? await event.request.blob() : null,
          redirect: 'follow'
        });

        return fetch(modifiedRequest);
      })()
    );
  }
});
