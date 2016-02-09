/*				CONNECT.JS
    Handles Audio/Graphical Connection/Deconnection of modules
    This is a historical file from Chris Wilson, modified for Faust ModuleClass needs.

    DEPENDENCIES :
        - ModuleClass.js
        - webaudio-asm-wrapper.js
        - Dragging.js
        
*/
/// <reference path="Modules/ModuleClass.ts"/>
/// <reference path="Dragging.ts"/>
/// <reference path="main.ts"/>
"use strict";
var Connector = (function () {
    function Connector() {
    }
    return Connector;
})();
var Connect = (function () {
    function Connect() {
    }
    Connect.prototype.connectInput = function (inputModule, divSrc) {
        divSrc.audioNode.connect(inputModule.getDSP().getProcessor());
    };
    Connect.prototype.connectOutput = function (outputModule, divOut) {
        outputModule.getDSP().getProcessor().connect(divOut.audioNode);
    };
    // Connect Nodes in Web Audio Graph
    Connect.prototype.connectModules = function (source, destination) {
        var sourceDSP;
        var destinationDSP;
        if (destination != null && destination.getDSP) {
            destinationDSP = destination.getDSP();
        }
        if (source.getDSP) {
            sourceDSP = source.getDSP();
        }
        if (sourceDSP.getProcessor && destinationDSP.getProcessor()) {
            sourceDSP.getProcessor().connect(destinationDSP.getProcessor());
        }
    };
    Connect.prototype.disconnectOutput = function (destination, source) {
        destination.audioNode.context.suspend();
    };
    // Disconnect Nodes in Web Audio Graph
    Connect.prototype.disconnectModules = function (source, destination) {
        // We want to be dealing with the audio node elements from here on
        var sourceCopy = source;
        var sourceCopyDSP;
        // Searching for src/dst DSP if existing
        if (sourceCopy.getDSP)
            sourceCopyDSP = sourceCopy.getDSP();
        //if(srcCpy.audioNode)
        // srcCpy.audioNode.disconnect();
        //else
        sourceCopyDSP.getProcessor().disconnect();
        // Reconnect all disconnected connections (because disconnect API cannot break a single connection)
        if (source.getOutputConnections()) {
            for (var i = 0; i < source.getOutputConnections().length; i++) {
                if (source.getOutputConnections()[i].destination != destination)
                    this.connectModules(source, source.getOutputConnections()[i].destination);
            }
        }
    };
    /**************************************************/
    /***************** Save Connection*****************/
    /**************************************************/
    //----- Add connection to src and dst connections structures
    Connect.prototype.saveConnection = function (source, destination, connector, connectorShape) {
        this.connector = connector;
        connector.connectorShape = connectorShape;
        connector.destination = destination;
        connector.source = source;
    };
    /***************************************************************/
    /**************** Create/Break Connection(s) *******************/
    /***************************************************************/
    Connect.prototype.createConnection = function (source, outtarget, destination, intarget) {
        var drag = new Drag();
        drag.startDraggingConnection(source, outtarget);
        drag.stopDraggingConnection(source, destination);
    };
    Connect.prototype.deleteConnection = function (drag) {
        this.breakSingleInputConnection(this.connector.connectorShape.source, this.connector.connectorShape.destination, this.connector);
        return true;
    };
    Connect.prototype.breakSingleInputConnection = function (source, destination, connector) {
        this.disconnectModules(source, destination);
        // delete connection from src .outputConnections,
        if (source.getOutputConnections)
            source.removeOutputConnection(connector);
        // delete connection from dst .inputConnections,
        if (destination.getInputConnections)
            destination.removeInputConnection(connector);
        // and delete the connectorShape
        if (connector.connectorShape)
            connector.connectorShape.parentNode.removeChild(connector.connectorShape);
    };
    // Disconnect a node from all its connections
    Connect.prototype.disconnectModule = function (module) {
        //for all output nodes
        if (module.getOutputConnections && module.getOutputConnections()) {
            while (module.getOutputConnections().length > 0)
                this.breakSingleInputConnection(module, module.getOutputConnections()[0].destination, module.getOutputConnections()[0]);
        }
        //for all input nodes 
        if (module.getInputConnections && module.getInputConnections()) {
            while (module.getInputConnections().length > 0)
                this.breakSingleInputConnection(module.getInputConnections()[0].source, module, module.getInputConnections()[0]);
        }
    };
    return Connect;
})();
//# sourceMappingURL=Connect.js.map