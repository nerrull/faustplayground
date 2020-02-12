    /// <reference path="../Connect.ts"/>


/*MODULEFAUST.JS
HAND - MADE JAVASCRIPT CLASS CONTAINING A FAUST MODULE */

class ModuleFaust {
    fDSP: IfDSP;
    factory: Factory;
    fSource: string;
    fTempSource: string;
    fName: string;
    fTempName: string;
    fOutputConnections: Connector[] = [];
    fInputConnections: Connector[] = [];
    pOutputConnections: Connector[] = [];
    pInputConnections: Connector[] = [];
    recallOutputsDestination: string[]=[];
    recallInputsSource: string[]=[];

    constructor(name: string) {
        this.fName = name;
    }

    getBaseAdressPath() :string{
        let p =  this.fDSP.inputs_items[0].split("/");
        p.pop();
        return p.join("/")
    }

    /*************** ACTIONS ON IN/OUTPUT MODULES ***************************/

    // ------ Returns Connection Array OR null if there are none
    getInputConnections(): Connector[] {
        return this.fInputConnections;
    }
    getOutputConnections(): Connector[] {
        return this.fOutputConnections;
    }

    addOutputConnection(connector: Connector): void {
        this.fOutputConnections.push(connector);
    }
    addInputConnection(connector: Connector): void {
        this.fInputConnections.push(connector);
    }

    removeOutputConnection(connector: Connector): void {
        this.fOutputConnections.splice(this.fOutputConnections.indexOf(connector), 1);
    }
    removeInputConnection(connector: Connector): void {
        this.fInputConnections.splice(this.fInputConnections.indexOf(connector), 1);
    }

    addParameterOutputConnection(connector: Connector): void {
        this.pOutputConnections.push(connector);
    }
    addParameterInputConnection(connector: Connector): void {
        this.pInputConnections.push(connector);
    }

    removeParameterOutputConnection(connector: Connector): void {
        this.pOutputConnections.splice(this.pOutputConnections.indexOf(connector), 1);
    }
    removeParameterInputConnection(connector: Connector): void {
        this.pInputConnections.splice(this.pInputConnections.indexOf(connector), 1);
    }

    /********************** GET/SET SOURCE/NAME/DSP ***********************/
    setSource(code: string): void {
        this.fSource = code;
    }
    getSource(): string { return this.fSource; }
    getName(): string { return this.fName; }
    getDSP(): IfDSP {
        return this.fDSP;
    }
}
