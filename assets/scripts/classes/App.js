import Ajax from './Ajax.js';
import Renderer from './Renderer.js';
import Helper from './Helper.js';

export default class App {
    constructor(apiHost, sandboxIframeSelector) {
        this.apiHost = apiHost;
        this.domain = '';
        this.data = {};
        this.ajax = new Ajax(apiHost);
        this.renderer = new Renderer(sandboxIframeSelector);
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

    loadRatings() {
        self = this;
        chrome.bookmarks.getTree(function(node){self.processBookmark(node);});
        this.ajax.makeRequest('GET', '/data?domain=' + encodeURIComponent(this.domain)).then((response) => {
            this.data = response.data;
            Helper.applyVote(this.data.vote);
            Helper.applyPageRating(this.data.rating);
            this.updateComments(this.data.comments);
            $('header').removeClass('not-logged-in').addClass('logged-in');
            window.location.hash = '#ratings';
        }).catch((e) => {
            console.error('Failed to load data', e);
            $('header').addClass('not-logged-in').removeClass('logged-in');
            window.location.hash = '#login';
        });
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
                $.post(self.apiHost+'/bookmarks', {'url':bookmark.url,'title':bookmark.title}, function(response){
                    console.log(response);
                });
            }
    
            if (bookmark.children) {
                self.processBookmark(bookmark.children);
            }
        }
    }
}