//Help.ts : Help class, that controle behaviour of the help panel.
/// <reference path="HelpView.ts"/>
var Help = (function () {
    function Help() {
    }
    Help.prototype.stopVideo = function () {
        //this.helpView.videoIframe.contentWindow.postMessage('{"event":"command","func":"' + 'stopVideo' + '","args":""}', '*');
    };
    return Help;
}());
//# sourceMappingURL=Help.js.map