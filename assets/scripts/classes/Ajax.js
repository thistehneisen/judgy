class Ajax {
    constructor(apiHost) {
        // manifest.json requires the URL to have a trailing slash.
        // We need to get rid of it, because all requests give a proper path in form of "/foo/bar" (with leading slash).
        this.apiHost = apiHost.replace(/\/*$/, '');
    }

    /**
     * @param method String
     * @param path String - may include GET parameters
     * @param form [Element] - the form whose fields to submit; only for requests that allow a body
     * @return Promise
     */
    makeRequest(method, path, form) {
        method = method.toUpperCase();

        if (method === 'GET') {
            form = undefined;
        }

        // using the Fetch API
        return fetch(
            new Request(this.apiHost + path),
            {
                method,
                cache: 'no-cache',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                },
                body: (form ? new $(form).serialize() : undefined)
            }
        ).then((response) => {
            if (!response.ok && (response.status !== 500)) {
                // 500 errors have a custom response value in JSON
                throw {error: response.statusText};
            }

            return response.json();
        }).then((response) => {
            if (!response.ok) {
                throw {error: response.error};
            }

            return response;
        }).catch((e) => {
            // standard logging
            console.error(e.error || e);
            // re-throw to trigger any other catch() blocks instead of then()
            throw e;
        });
    }
    
    static normalizeHost(apiHost) {
        let lastChar;
        
        while (lastChar = apiHost.substr(-1) === '/') {
            
        }
    }
};
