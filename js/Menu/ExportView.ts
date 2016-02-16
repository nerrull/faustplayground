﻿//ExportView

class ExportView {

    initExportView(): HTMLElement {

        var exportContainer: HTMLElement = document.createElement("div");
        exportContainer.id = "exportContent";
        exportContainer.className = "menuContent";


        var fwurl: HTMLInputElement = document.createElement("input");
        fwurl.id = "faustweburl";

        fwurl.value = "http://faustservice.grame.fr";


        var subfooter: HTMLDivElement = document.createElement('div');
        subfooter.id = "optionExportContainer"
        //destDiv.appendChild(subfooter);

        var refButton: HTMLDivElement = document.createElement("div");
        refButton.id = "refreshButton";
        //refButton.onclick = this.expor.uploadTargets;

        refButton.innerHTML = '<svg version="1.0" id="svgRefreshButton" xmlns="http://www.w3.org/2000/svg" width="50.000000pt" height="50.000000pt" viewBox="0 0 50.000000 50.000000" preserveAspectRatio="xMidYMid meet"><g transform="translate(0.000000,50.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none"> <path d="M186 309 c-37 -29 -37 -89 0 -118 28 -22 69 -27 93 -12 23 15 3 30 -33 24 -29 -4 -37 -1 -51 21 -16 24 -16 28 -1 51 18 27 63 34 84 13 17 -17 15 -31 -3 -24 -20 7 -19 1 6 -28 l22 -25 18 24 c20 25 25 40 9 30 -5 -3 -16 7 -24 23 -25 47 -75 56 -120 21z"/></g></svg>';

        subfooter.appendChild(refButton);

        var selectDiv: HTMLDivElement = document.createElement("div");
        selectDiv.id = "selectDiv"
        subfooter.appendChild(selectDiv);

        var selectPlatform: HTMLSelectElement = document.createElement("select");
        selectPlatform.id = "platforms";
        selectPlatform.className = "platforms";
        var self = this;
        //selectPlatform.addEventListener("change", function () { self.expor.updateArchitectures(self.expor) });
        selectDiv.appendChild(selectPlatform);

        var selectArch: HTMLSelectElement = document.createElement("select");
        selectArch.id = "architectures";
        selectArch.className = "architectures";
        selectDiv.appendChild(selectArch);

        var equButton: HTMLInputElement = document.createElement("input");
        equButton.id = "exportButton";
        equButton.type = "submit";
        equButton.className = "grayButton";
        //var sceneView: ScenePlaygroundView = this;
        //equButton.onclick = function (event) { sceneView.expor.exportPatch(event, sceneView.expor) };
        equButton.value = "Export";
        subfooter.appendChild(equButton);
        exportContainer.appendChild(fwurl);
        exportContainer.appendChild(subfooter);
        return exportContainer;

    }
}