import Router from './classes/Router.js';
import App from './classes/App.js';

// ################## INIT ##################

// using the domain required by manifest as API URL
const API_HOST = chrome.runtime.getManifest().permissions[0];
const APP = new App(API_HOST, '#handlebars_iframe');

chrome.tabs.query({
    active: true,
    currentWindow: true
}, (tabs) => {
    APP.init(tabs[0].url);
});

// ################## EVENT LISTENERS ##################

window.addEventListener('hashchange', Router.route, false);

if (window.location.hash !== '') {
    Router.route();
}

$(document)
    .on('submit', 'main.login form', function (e) {
        e.preventDefault();
        APP.login(this);
    })
    .on('submit', 'main.registration form', function (e) {
        e.preventDefault();
        APP.register(this);
    })
    .on('submit', 'main.password-recovery form', function (e) {
        e.preventDefault();
        APP.recoverPassword(this);
    });

$('main.ratings .top .actions')
    .on('click', '.add-comment', function () {
        let $commentBlock = $('main.ratings .comments > .comment.new');

        if ($commentBlock.is(':visible')) {
            $commentBlock.hide()
                .find('form textarea').val('');
            $(this).removeClass('active');
        } else {
            $commentBlock.find('.head .name').text(APP.getDisplayName());
            $commentBlock.show();
            $(this).addClass('active');
        }
    })
    .on('click', '.vote', function () {
        APP.voteForPage($(this).data('value'));
    });

$('main.ratings .comments')
    .on('click', '.comment .child-count', function () {
        $(this).closest('.comment')
            .find('.children')
            .toggleClass('open');
    })
    .on('click', '.comment .add-comment', function () {
        let $button = $(this);
        let $children = $button.closest('.comment').find('.children');
        let $commentBlock = $children.find('.comment.new');

        if ($commentBlock.is(':visible')) {
            $commentBlock.hide()
                .find('form textarea').val('');
            $button.removeClass('active');
        } else {
            $commentBlock.find('.head .name').text(APP.getDisplayName());
            $commentBlock.show();
            $button.addClass('active');
            $children.show();
        }
    })
    .on('submit', '.comment.new form', function (e) {
        e.preventDefault();

        let $form = $(this);
        let $textarea = $form.find('textarea');
        $textarea.val($textarea.val().trim());

        if ($textarea.val() === '') {
            return;
        }

        let $parentId = $textarea.siblings('input[name=parent_id]');
        let parentId = undefined;

        if ($parentId.length) {
            parentId = $parentId.val();
        }

        APP.commentOnPage(this, parentId);
    })
    .on('click', '.vote', function () {
        let $button = $(this);
        let $body = $button.closest('.body');
        let $comment = $button.closest('.comment');

        if ($body.hasClass('voted')) {
            return;
        }

        APP.voteForComment($comment.data('id'), $button.data('value')).then((vote) => {
            $body.addClass('voted voted-' + vote);
        });
    });
