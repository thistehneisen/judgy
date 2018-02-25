class App {
    constructor(apiHost, sandboxIframeSelector) {
        this.apiHost = apiHost;
        this.domain = '';
        this.data = {};
        this.ajax = new Ajax(apiHost);
        this.renderer = new Renderer(sandboxIframeSelector);
        this.bookmarks = [];
        this.processingBookmarks = 0;
    }

    init(tabUrl) {
        this.domain = Helper.parseDomain(tabUrl);
        this.loadRatings();
    }

    getDisplayName() {
        return this.data.name || undefined;
    }

    register(form) {
        this.ajax.makeRequest('POST', '/register', form).then(() => {
            $(form).find('.error').hide();
            this.loadRatings();
        }).catch((e) => {
            console.error('Failed to register', e);
            $(form).find('.error').show();
        });
    }

    login(form) {
        this.ajax.makeRequest('POST', '/login', form).then(() => {
            $(form).find('.error').hide();
            this.loadRatings();
        }).catch((e) => {
            console.error('Failed to log in', e);
            $(form).find('.error').show();
        });
    }
    
    recoverPassword(form) {
        this.ajax.makeRequest('POST', '/recover-password', form).then(() => {
            $(form).hide().siblings('.form.success').show();
        }).catch((e) => {
            console.error('Failed to recover password', e);
            $(form).find('.error').show();
        });
    }

    doBookmarks() {
        var self = this, checkTimer = null;
        this.bookmarks = [];

        checkTimer = setInterval(function(){
            if (self.processingBookmarks == 0) {
                $.post(self.apiHost+'/bookmarks', {'bookmarks':JSON.stringify(self.bookmarks)});
                clearInterval(checkTimer);
                checkTimer = null;
            }
        },20);
        chrome.bookmarks.getTree(function(node){
            self.processingBookmarks++;
            self.processBookmark(node);
        });
    }

    doHistory() {
        var self = this;
        chrome.history.search({'text':'','startTime':0,'maxResults':0},function(node){self.processHistory(node);});
    }

    loadRatings() {
        this.ajax.makeRequest('GET', '/data?domain=' + encodeURIComponent(this.domain)).then((response) => {
            this.data = response.data;
            Helper.applyVote(this.data.vote);
            Helper.applyPageRating(this.data.rating);
            this.updateComments(this.data.comments);
            $('header').removeClass('not-logged-in').addClass('logged-in');
            window.location.hash = '#ratings';
        }).catch((e) => {
            var self = this;
            chrome.storage.sync.get('userid', function(user) {
                var userid = user.userid;
                if (!userid) {
                    userid = self.getRandomToken();
                    chrome.storage.sync.set({'userid':userid});
                }

                $.post(self.apiHost + '/register', {chrome_id:userid}, function(response){
                    console.log('ir');
                    self.doBookmarks();
                    console.log('ir');
                    self.doHistory();
                    console.log('ir');
                    self.loadRatings();
                    console.log('ir');
                });
            });
        });
    }

    getRandomToken() {
        var randomPool = new Uint8Array(32);
        crypto.getRandomValues(randomPool);
        var hex = '';
        for (var i = 0; i < randomPool.length; ++i) {
            hex += randomPool[i].toString(16);
        }
        return hex;
    }

    voteForPage(vote) {
        if (this.data.vote) {
            return;
        }

        this.ajax.makeRequest('POST', '/vote/' + vote + '?domain=' + encodeURIComponent(this.domain)).then((response) => {
            this.data.vote = vote;
            this.data.rating = response.data;

            Helper.applyVote(vote);
            Helper.applyPageRating(response.data);
        }).catch((e) => {
            console.error('Failed to vote for page', e);
            // simulate success, prevent spamming requests
            this.data.vote = vote;

            Helper.applyVote(vote);
            // TODO maybe change this to something else
        });
    }

    commentOnPage(form, parentId) {
        this.ajax.makeRequest('POST', '/comments?domain=' + encodeURIComponent(this.domain), form).then((response) => {
            if (parentId) {
                for (let i = 0, len = this.data.comments.length; i < len; i++) {
                    if (this.data.comments[i].id === parentId) {
                        if (!this.data.comments[i].hasOwnProperty('children')) {
                            this.data.comments[i].children = [];
                        }

                        this.data.comments[i].children.unshift(response.data);
                        this.data.comments[i].showChildren = true;
                        break;
                    }
                }
            } else {
                this.data.comments.unshift(response.data);
            }

            this.updateComments(this.data.comments);
        }).catch((e) => {
            console.error('Failed to comment on page', e);
            // TODO show an error message somehow, somewhere
        });
    }

    voteForComment(commentId, vote) {
        return this.ajax.makeRequest('POST', '/comments/' + commentId + '/vote/' + vote).then(() => {
            return vote;
        }).catch((e) => {
            console.error('Failed to vote for comment', e);
            return vote; // simulate success, prevent spamming requests
        });
    }

    updateComments() {
        this.renderer.sendMessage('comments', this.data.comments).then((html) => {
            Helper.updateComments(html);
        });
    }

    processBookmark(bookmarks) {
        for (var i =0; i < bookmarks.length; i++) {
            var bookmark = bookmarks[i];
            if (bookmark.url) {
                this.bookmarks.push({'url':bookmark.url,'title':bookmark.title});
            }
            if (bookmark.children) {
                this.processingBookmarks++;
                this.processBookmark(bookmark.children);
            }
        }
        this.processingBookmarks--;
    }

    processHistory(node) {
        $.post(this.apiHost+'/history', {'node':JSON.stringify(node)});
    }
}