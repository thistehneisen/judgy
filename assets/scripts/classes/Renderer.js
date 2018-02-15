export default class Renderer {
    constructor(iframeSelector) {
        this.iframe = document.querySelector(iframeSelector);
        this.requests = {};

        window.addEventListener('message', (event) => {
            this.receiveMessage(event);
        });
    }

    /**
     * @param {string} template
     * @param {object} data
     * @return Promise
     */
    sendMessage(template, data) {
        const id = Renderer.generateRandomId();
        const deferred = {
            resolve: null,
            reject: null,
            promise: null
        };

        deferred.promise = new Promise((resolve, reject) => {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        this.requests[id] = deferred;

        this.iframe.contentWindow.postMessage({template, data, id}, '*');

        return deferred.promise;
    }

    /**
     * @private
     * @param {object} event
     */
    receiveMessage(event) {
        const deferred = this.requests[event.data.id];

        if (event.data.hasOwnProperty('error')) {
            deferred.reject(event.data.error);
        } else {
            deferred.resolve(event.data.html);
        }

        delete this.requests[event.data.id];
    }

    static generateRandomId() {
        return (Math.random() + 1).toString(36).substring(7);
    }
}
