/*				CONNECT.JS
Handles Audio/Graphical Connection/Deconnection of modules
This is a historical file from Chris Wilson, modified for Faust ModuleClass needs.
*/

/// <reference path="Modules/ModuleClass.ts"/>
/// <reference path="Modules/GraphicalModule.ts"/>
/// <reference path="Modules/ModuleMidiReader.ts"/>

/// <reference path="Utilitary.ts"/>
/// <reference path="Dragging.ts"/>

/**************************************************/
/******* WEB AUDIO CONNECTION/DECONNECTION*********/
/**************************************************/
//todo: refactor this so new connection types don't break
interface ConnectorShape extends SVGElement {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

class Connector {
    static connectorId: number = 0;
    connectorShape: ConnectorShape;
    source: ModuleClass;
    destination: ModuleClass;
    sourceNode:HTMLElement;
    dstNode: HTMLElement;
    
    // connect input node to device input
    connectInput(inputModule: ModuleClass, divSrc: IHTMLDivElementSrc): void {
        divSrc.audioNode.connect(inputModule.moduleFaust.getDSP());
    }
    
    //connect output to device output
    connectOutput(outputModule: ModuleClass, divOut: IHTMLDivElementOut): void {
        outputModule.moduleFaust.getDSP().connect(divOut.audioNode);
    }
    
    // connect input node to device input
    connectSample(outMod: ModuleClass, divSample: IHTMLDivElementSample): void {
        divSample.audioNode.connect(outMod.moduleFaust.getDSP());
    }
    
    // Connect Nodes in Web Audio Graph
    connectMidiModules(source: ModuleMIDIReader, destination: ModuleClass): void {
        var destinationDSP: IfDSP;
        if (destination != null && destination.moduleFaust.getDSP) {
            destinationDSP = destination.moduleFaust.getDSP();
        }
        
        if (destinationDSP) {
            source.setMidiCallback((c,p,v)=> {destination.midiControl(c,p,v)})
        }
    }

      // Connect Nodes in Web Audio Graph
      connectMidiCompositionModule(source: CompositionModule, destination: ModuleClass, instrument_id:string): void {
        var destinationDSP: IfDSP;
        if (destination != null && destination.moduleFaust.getDSP) {
            destinationDSP = destination.moduleFaust.getDSP();
        }
        
        if (destinationDSP) {
            source.addMidiCallback(instrument_id, this, (command)=> {destination.midiControl(command)})
        }
    }
    
    
    // Connect Nodes in Web Audio Graph
    connectModules(source: ModuleClass, destination: ModuleClass): void {
        var sourceDSP: IfDSP;
        var destinationDSP: IfDSP;
        if (destination != null && destination.moduleFaust.getDSP) {
            destinationDSP = destination.moduleFaust.getDSP();
        }
        if (source.moduleFaust.getDSP) {
            sourceDSP = source.moduleFaust.getDSP();
        }
        
        if (sourceDSP && destinationDSP) {
            sourceDSP.connect(destinationDSP)
        }
        source.setDSPValue();
        destination.setDSPValue();
    }
    
    // Disconnect Nodes in Web Audio Graph
    disconnectModules(source: ModuleClass, destination: ModuleClass):void {
        
        // We want to be dealing with the audio node elements from here on
        var sourceCopy: ModuleClass = source;
        var sourceCopyDSP: IfDSP;
        // Searching for src/dst DSP if existing
        
        if (sourceCopy != undefined && sourceCopy.moduleFaust.getDSP) {
            sourceCopyDSP = sourceCopy.moduleFaust.getDSP();
            sourceCopyDSP.disconnect();
        }
        
        // Reconnect all disconnected connections (because disconnect API cannot break a single connection)
        if (source!=undefined&&source.moduleFaust.getOutputConnections()) {
            for (var i = 0; i < source.moduleFaust.getOutputConnections().length; i++){
                if (source.moduleFaust.getOutputConnections()[i].destination != destination)
                this.connectModules(source, source.moduleFaust.getOutputConnections()[i].destination);
            }
        }
    }
    
    connectModuleParameters(source: GraphicalModule, destination: GraphicalModule, srcParameterAddress: string, dstParameterAdress : string): void {
        var srcController:FaustInterfaceControler;
        var dstController:FaustInterfaceControler;
        for (let i =0  ; i < source.moduleControles.length; i++){
            let mod = source.moduleControles[i]
            if (mod.itemParam.address == srcParameterAddress) srcController = mod;
        }
        
        for (let i =0  ; i < destination.moduleControles.length; i++){
            let mod = destination.moduleControles[i]
            if (mod.itemParam.address == dstParameterAdress) dstController = mod;
        }
        if (srcController && dstController){
            srcController.valueChangeCallbacks[dstParameterAdress] = (adress, value) => { destination.externalSetParamValue(adress, value)}
        }
        
        // var sourceDSP: IfDSP;
        // var destinationDSP: IfDSP;
        // if (destination != null && destination.moduleFaust.getDSP) {
        //     destinationDSP = destination.moduleFaust.getDSP();
        // }
        // if (source.moduleFaust.getDSP) {
        //     sourceDSP = source.moduleFaust.getDSP();
        // }
        
        // if (sourceDSP && destinationDSP) {
        //     sourceDSP.connect(destinationDSP)
        // }
        // source.setDSPValue();
        // destination.setDSPValue();
    }
    
    // Disconnect Nodes in Web Audio Graph
    disconnectModuleParameters(source: GraphicalModule, destination: GraphicalModule):void {
        
        // // We want to be dealing with the audio node elements from here on
        // var sourceCopy: ModuleClass = source;
        // var sourceCopyDSP: IfDSP;
        // // Searching for src/dst DSP if existing
        
        // if (sourceCopy != undefined && sourceCopy.moduleFaust.getDSP) {
        //     sourceCopyDSP = sourceCopy.moduleFaust.getDSP();
        //     sourceCopyDSP.disconnect();
        // }
        
        // // Reconnect all disconnected connections (because disconnect API cannot break a single connection)
        // if (source!=undefined&&source.moduleFaust.getOutputConnections()) {
        //     for (var i = 0; i < source.moduleFaust.getOutputConnections().length; i++){
        //         if (source.moduleFaust.getOutputConnections()[i].destination != destination)
        //             this.connectModules(source, source.moduleFaust.getOutputConnections()[i].destination);
        //     }
        // }
    }
    
    /**************************************************/
    /***************** Save Connection*****************/
    /**************************************************/
    
    //----- Add connection to src and dst connections structures
    saveConnection(source: ModuleClass, destination: ModuleClass, connectorShape: ConnectorShape):void {
        this.connectorShape = connectorShape;
        this.destination = destination;
        this.source = source;
    }
    
    /***************************************************************/
    /**************** Create/Break Connection(s) *******************/
    /***************************************************************/
    
    createConnection(source: ModuleClass, outtarget: HTMLElement, destination: ModuleClass, intarget: HTMLElement):void {
        var drag: Drag = new Drag();
        drag.startDraggingConnection(source, outtarget);
        drag.stopDraggingConnection(source, destination);
    }
    
    deleteConnection(event: MouseEvent, drag: Drag): boolean {
        event.stopPropagation();
        this.breakSingleInputConnection(this.source, this.destination, this);
        return true;
    }
    
    breakSingleInputConnection(source: GraphicalModule, destination: GraphicalModule, connector: Connector) {
        
        this.disconnectModules(source, destination);
        
        // delete connection from src .outputConnections,
        if (source != undefined && source.moduleFaust.getOutputConnections) {
            source.moduleFaust.removeOutputConnection(connector);
        }
        
        // delete connection from dst .inputConnections,
        if (destination != undefined && destination.moduleFaust.getInputConnections) {
            destination.moduleFaust.removeInputConnection(connector);
        }
        
        // and delete the connectorShape
        if(connector.connectorShape)
        connector.connectorShape.remove();
    }
    
    // Disconnect a node from all its connections
    disconnectModule(module: ModuleClass) {
        
        //for all output nodes
        if (module.moduleFaust.getOutputConnections && module.moduleFaust.getOutputConnections()) {
            while (module.moduleFaust.getOutputConnections().length > 0)
            this.breakSingleInputConnection(module, module.moduleFaust.getOutputConnections()[0].destination, module.moduleFaust.getOutputConnections()[0]);
        }
        
        //for all input nodes
        if (module.moduleFaust.getInputConnections && module.moduleFaust.getInputConnections()) {
            while (module.moduleFaust.getInputConnections().length > 0)
            this.breakSingleInputConnection(module.moduleFaust.getInputConnections()[0].source, module, module.moduleFaust.getInputConnections()[0]);
        }
    }
    
    disconnectMIDIModule(module: ModuleMIDIReader):void {
        //todo
    }
    
    
    static redrawInputConnections(module: GraphicalModule, drag: Drag) {
        var offset: HTMLElement = module.moduleView.getInputNode();
        var x = module.moduleView.inputOutputNodeDimension / 2// + window.scrollX ;
        var y = module.moduleView.inputOutputNodeDimension / 2// + window.scrollY;
        
        while (offset) {
            x += offset.offsetLeft;
            y += offset.offsetTop;
            offset = <HTMLDivElement>offset.offsetParent;
        }
        
        for (var c = 0; c < module.getInputConnections().length; c++) {
            var currentConnectorShape: ConnectorShape = module.getInputConnections()[c].connectorShape;
            var x1 = x;
            var y1 = y;
            var x2 = currentConnectorShape.x2
            var y2 = currentConnectorShape.y2
            var d = drag.setCurvePath(x1, y1, x2, y2, drag.calculBezier(x1, x2), drag.calculBezier(x1, x2))
            currentConnectorShape.setAttributeNS(null, "d", d);
            drag.updateConnectorShapePath(currentConnectorShape, x1, x2, y1, y2);
        }
        
        for (var c = 0; c < module.getInputParameterConnections().length; c++) {
            var connector :Connector =module.getInputParameterConnections()[c];
            var offset = <HTMLElement> connector.sourceNode;
            var x1 = 0;
            var y1 = 0;
            while (offset) {
                x1 += offset.offsetLeft;
                y1 += offset.offsetTop;
                offset =<HTMLElement> offset.offsetParent;
            }

            offset = connector.dstNode;
            var x2 = 0;
            var y2 = 0;
            while (offset) {
                x2 += offset.offsetLeft;
                y2 += offset.offsetTop;
                offset =<HTMLElement> offset.offsetParent;
            }

            var currentConnectorShape: ConnectorShape = module.getInputParameterConnections()[c].connectorShape;
            var d = drag.setCurvePath(x1, y1, x2, y2, drag.calculBezier(x1, x2), drag.calculBezier(x1, x2))
            currentConnectorShape.setAttributeNS(null, "d", d);
            drag.updateConnectorShapePath(currentConnectorShape, x1, x2, y1, y2);
        }
    }
    static redrawOutputConnections(module: GraphicalModule, drag: Drag) {
        var offset: HTMLElement = module.moduleView.getOutputNode();
        var x = module.moduleView.inputOutputNodeDimension / 2// + window.scrollX ;
        var y = module.moduleView.inputOutputNodeDimension / 2// + window.scrollY;
        
        while (offset) {
            x += offset.offsetLeft;
            y += offset.offsetTop;
            offset = <HTMLDivElement>offset.offsetParent;
        }
        
        for (var c = 0; c < module.getOutputConnections().length; c++) {
            if (module.getOutputConnections()[c].connectorShape) {
                var currentConnectorShape: ConnectorShape = module.getOutputConnections()[c].connectorShape;
                var x1 = currentConnectorShape.x1;
                var y1 = currentConnectorShape.y1;
                var x2 = x;
                var y2 = y;
                var d = drag.setCurvePath(x1, y1, x2, y2, drag.calculBezier(x1, x2), drag.calculBezier(x1, x2))
                
                currentConnectorShape.setAttributeNS(null, "d", d);
                drag.updateConnectorShapePath(currentConnectorShape,x1, x2, y1, y2);
            }
        }
        for (var c = 0; c < module.getOutputParameterConnections().length; c++) {
            if (module.getOutputParameterConnections()[c].connectorShape) {
                var connector :Connector =module.getOutputParameterConnections()[c];
                var offset = <HTMLElement> connector.sourceNode;
                var x1 = 0;
                var y1 = 0;
                while (offset) {
                    x1 += offset.offsetLeft;
                    y1 += offset.offsetTop;
                    offset =<HTMLElement> offset.offsetParent;
                }
    
                offset = connector.dstNode;
                var x2 = 0;
                var y2 = 0;
                while (offset) {
                    x2 += offset.offsetLeft;
                    y2 += offset.offsetTop;
                    offset = <HTMLElement>offset.offsetParent;
                }
    
                var currentConnectorShape: ConnectorShape = module.getOutputParameterConnections()[c].connectorShape;
                var d = drag.setCurvePath(x1, y1, x2, y2, drag.calculBezier(x1, x2), drag.calculBezier(x1, x2))
                
                currentConnectorShape.setAttributeNS(null, "d", d);
                drag.updateConnectorShapePath(currentConnectorShape,x1, x2, y1, y2);
            }
        }
    }
}
