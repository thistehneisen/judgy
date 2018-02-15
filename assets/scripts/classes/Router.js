export default class Router {
    static route() {
        let $blocks = $('main').hide();
        const showBlock = ($block) => {
            $block.find('form').trigger('reset');
            $block.show();
        };

        switch (window.location.hash) {
            case '#login':
                showBlock($blocks.filter('.login'));
                break;
            case '#password-recovery':
                showBlock($blocks.filter('.password-recovery'));
                break;
            case '#registration':
                showBlock($blocks.filter('.registration'));
                break;
            case '#ratings':
                showBlock($blocks.filter('.ratings'));
                break;
        }
    }
}
