let view = require('js/theme/view.js');

describe('View', function() {
    it('should return false', function() {
        var permalinkScroll = view.permalinkScroll();
        expect(permalinkScroll).to.be.false; // passes
    });
});
