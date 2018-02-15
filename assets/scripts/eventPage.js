// this is a partial copy of the class in classes/Helper.js
class Helper {
    static setBadgeText(rating) {
        const colors = {
            '?': '#dfdfdf',
            '1': '#e95b4c',
            '2': '#f66840',
            '3': '#ee8c59',
            '4': '#eeab54',
            '5': '#fed154',
            '6': '#e1ee4c',
            '7': '#aac730',
            '8': '#42b8a3',
            '9': '#17dfb1',
            '10': '#29d799'
        };
        let value = '?';

        if (rating) {
            value = Math.floor(Number(rating)).toString();
        }

        chrome.browserAction.setBadgeBackgroundColor({color: colors[value]});
        chrome.browserAction.setBadgeText({text: String(value)});
    }

    static parseDomain(url) {
        const anchor = document.createElement('a');
        anchor.href = url;

        if ((anchor.protocol === 'chrome:')
            || (anchor.protocol === 'chrome-extension:')
            || (anchor.hostname.indexOf('localhost') !== -1)) {
            chrome.browserAction.disable();
            chrome.browserAction.setBadgeText({text: ''});
            return null;
        } else {
            chrome.browserAction.enable();
            return anchor.hostname;
        }
    }
}

// using the domain required by manifest as API URL
const API_HOST = chrome.runtime.getManifest().permissions[0];
let domain = null;

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        getRating(tab.url);
    });
});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (changeInfo.url) {
        getRating(changeInfo.url);
    }
});

function getRating(tabUrl) {
    if (!Helper.parseDomain(tabUrl)) {
        return;
    }

    fetch(
        new Request(API_HOST + '/?full_url=' + encodeURIComponent(tabUrl)),
        {
            method: 'GET',
            cache: 'no-cache',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
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

        Helper.setBadgeText(response.data);
    });
}
