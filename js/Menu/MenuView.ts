﻿//MenuView.ts : MenuView Class which contains all the graphical parts of the menu

class MenuView {
    libraryButtonMenu: HTMLElement;
    exportButtonMenu: HTMLElement;
    helpButtonMenu: HTMLElement;
    libraryContent: HTMLElement;
    exportContent: HTMLElement;
    helpContent: HTMLElement;
    contentsMenu: HTMLElement;
    HTMLElementsMenu: HTMLElement[]=[];


    init(htmlContainer: HTMLElement): void {
        //create menu's buttons and there containers
        var buttonsMenu: HTMLElement = document.createElement("div");
        buttonsMenu.id = "buttonsMenu";

        var libraryButtonMenu: HTMLElement = document.createElement("div");
        libraryButtonMenu.id = "libraryButtonMenu";
        libraryButtonMenu.className = "buttonsMenu";
        libraryButtonMenu.appendChild(document.createTextNode("Biblio"));
        this.libraryButtonMenu = libraryButtonMenu;

        var exportButtonMenu: HTMLElement = document.createElement("div");
        exportButtonMenu.id = "exportButtonMenu";
        exportButtonMenu.className = "buttonsMenu";
        exportButtonMenu.appendChild(document.createTextNode("Export"));
        this.exportButtonMenu = exportButtonMenu;

        var helpButtonMenu: HTMLElement = document.createElement("div");
        helpButtonMenu.id = "helpButtonMenu";
        helpButtonMenu.className = "buttonsMenu";
        helpButtonMenu.appendChild(document.createTextNode("Aide"));
        this.helpButtonMenu = helpButtonMenu;

        buttonsMenu.appendChild(libraryButtonMenu);
        buttonsMenu.appendChild(exportButtonMenu);
        buttonsMenu.appendChild(helpButtonMenu);

        //create menu's Contents and there containers
        var contentsMenu: HTMLElement = document.createElement("div");
        contentsMenu.id = "contentsMenu";
        contentsMenu.style.display = "none";

        var libraryView: LibraryView = new LibraryView();
        var libraryContent: HTMLElement = libraryView.initLibraryView();
        libraryContent.style.display = "none";

        var exportView: ExportView = new ExportView();
        var exportContent: HTMLElement = exportView.initExportView();
        exportContent.style.display = "none";

        var helpView: HelpView = new HelpView();
        var helpContent: HTMLElement = helpView.initHelpView();
        helpContent.style.display = "none";

        contentsMenu.appendChild(libraryContent);
        contentsMenu.appendChild(exportContent);
        contentsMenu.appendChild(helpContent);

        htmlContainer.appendChild(buttonsMenu);
        htmlContainer.appendChild(contentsMenu);
        this.HTMLElementsMenu.push(libraryContent, exportContent, helpContent)

        this.libraryContent = libraryContent;
        this.exportContent = exportContent;
        this.helpContent = helpContent;
        this.contentsMenu = contentsMenu;

    }
}
