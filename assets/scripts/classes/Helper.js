class Helper {
    static applyVote(vote) {
        $('main.ratings .top .actions .vote-' + vote).addClass('active');
    }

    static applyPageRating(rating) {
        let className = 'value-0', ratingValue = '?';

        if (rating) {
            ratingValue = (Math.round(rating * 10) / 10);
            className = 'value-' + Math.floor(Number(ratingValue));
        }

        $('main.ratings .top .rating .value').addClass(className)
            .text(ratingValue);
        Helper.setBadgeText(rating);
    }

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

        if ((anchor.protocol === 'chrome')
            || (anchor.protocol === 'chrome-extension')
            || (anchor.hostname.indexOf('localhost') !== -1)) {
            chrome.browserAction.disable();
            return '';
        } else {
            chrome.browserAction.enable();
            return anchor.hostname;
        }
    }

    static updateComments(html) {
        $('main.ratings .comments').html(html);
    }
}
