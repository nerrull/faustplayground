/*				DRAGGING.JS
Handles Graphical Drag of Modules and Connections
This is a historical file from Chris Wilson, modified for Faust ModuleClass needs.

--> Things could probably be easier...
*/

/// <reference path="Connect.ts"/>
/// <reference path="Modules/ModuleClass.ts"/>
/// <reference path="Utilitary.ts"/>

/***********************************************************************************/
/****** Node Dragging - these are used for dragging the audio modules interface*****/
/***********************************************************************************/

class Drag {
    
    zIndex: number = 0;
    lastLit: HTMLInterfaceContainer;
    cursorStartX: number;
    cursorStartY: number;
    elementStartLeft: number;
    elementStartTop: number;
    isOriginInput: boolean;
    isParameter: boolean;
    parameterAddress:string;
    isMidi : boolean;
    instrument_id : string;
    connector: Connector = new Connector();
    originTarget: HTMLElement;
    elemNode: HTMLElement;
    dragSourceNode : HTMLElement;
    isDragConnector: boolean = false;
    
    //used to dispatch the element, the location and the event to the callback function with click event
    getDraggingMouseEvent(mouseEvent: MouseEvent, module: GraphicalModule, draggingFunction: (el: HTMLElement, x: number, y: number, module: GraphicalModule, event: Event) => void) {
        var event = <Event>mouseEvent;
        var el = <HTMLElement>mouseEvent.target;
        var x = mouseEvent.clientX + window.scrollX;
        var y = mouseEvent.clientY + window.scrollY;
        draggingFunction(el, x, y, module,event);
    }
    
    //used to dispatch the element, the location and the event to the callback function with touch event
    getDraggingTouchEvent(touchEvent: TouchEvent, module: GraphicalModule, draggingFunction: (el: HTMLElement, x: number, y: number, module: GraphicalModule, event: Event) => void) {
        var event = <Event>touchEvent;
        if (touchEvent.targetTouches.length > 0) {
            var touch: Touch = touchEvent.targetTouches[0];
            
            var el = <HTMLElement>touch.target;
            var x = touch.clientX + window.scrollX;
            var y = touch.clientY + window.scrollY;
            draggingFunction(el, x, y, module,event);
        } else if (this.isDragConnector) {//id drag is a connection one with touch event
            for (var i = 0; i < touchEvent.changedTouches.length; i++) {
                var touch: Touch = touchEvent.changedTouches[i];
                var x = touch.clientX + window.scrollX;
                var y = touch.clientY + window.scrollY;
                var el = <HTMLElement>document.elementFromPoint(x - scrollX, y - scrollY);
                draggingFunction(el, x, y, module,event);
            }
        } else {
            draggingFunction(null, null, null, module,event);
        }
    }
    
    startDraggingModule(el: HTMLElement, x: number, y: number, module: GraphicalModule, event: Event): void {
        
        var moduleContainer: HTMLElement = module.moduleView.getModuleContainer();
        
        // Save starting positions of cursor and element.
        this.cursorStartX = x;
        this.cursorStartY = y;
        this.elementStartLeft = parseInt(moduleContainer.style.left, 10);
        this.elementStartTop   = parseInt(moduleContainer.style.top,  10);
        
        if (isNaN(this.elementStartLeft)) { this.elementStartLeft = 0 };
        if (isNaN(this.elementStartTop)) { this.elementStartTop = 0 };
        
        
        // Capture mousemove and mouseup events on the page.
        document.addEventListener("mouseup", module.eventDraggingHandler, false);
        document.addEventListener("mousemove", module.eventDraggingHandler, false);
        
        event.stopPropagation();
        event.preventDefault();
    }
    
    whileDraggingModule(el: HTMLElement, x: number, y: number, module: GraphicalModule,event:Event): void {
        
        var moduleContainer = module.moduleView.getModuleContainer();
        
        // Move drag element by the same amount the cursor has moved.
        moduleContainer.style.left = (this.elementStartLeft + x - this.cursorStartX) + "px";
        moduleContainer.style.top = (this.elementStartTop + y - this.cursorStartY) + "px";
        
        if (module.getInputConnections() != null || module.getInputParameterConnections()!=null ) {	// update any lines that point in here.
            Connector.redrawInputConnections(module, this)
        }
        
        if (module.getOutputConnections() != null || module.getOutputParameterConnections()!=null ) {	// update any lines that point out of here.
            Connector.redrawOutputConnections(module, this)
        }

        
        
        event.stopPropagation();
    }
    
    stopDraggingModule(el: HTMLElement, x: number, y: number, module: GraphicalModule, event: Event): void {
        // Stop capturing mousemove and mouseup events.
        document.removeEventListener("mouseup", module.eventDraggingHandler, false)
        document.removeEventListener("mousemove", module.eventDraggingHandler, false)
    }
    
    /************************************************************************************/
    /*** Connector Dragging - these are used for dragging the connectors between nodes***/
    /************************************************************************************/
    
    updateConnectorShapePath(connectorShape:ConnectorShape,x1: number, x2: number, y1: number, y2: number) {
        connectorShape.x1 = x1;
        connectorShape.x2 = x2;
        connectorShape.y1 = y1;
        connectorShape.y2 = y2;
    }
    
    setCurvePath(x1: number, y1: number, x2: number, y2: number, x1Bezier: number, x2Bezier: number): string {
        return "M" + x1 + "," + y1 + " C" + x1Bezier + "," + y1 + " " + x2Bezier + "," + y2 + " " + x2 + "," + y2;
    }
    
    calculBezier(x1: number, x2: number): number {
        return x1 - (x1 - x2) / 2;;
    }

    getSliderInfo( start:HTMLElement):HTMLElement{
        let sib = <HTMLElement> start.nextSibling;
        if (sib.classList.contains("slider-info")){
            return sib;
        }
        else return this.getSliderInfo(sib);
    }

    
    startDraggingConnection(module: GraphicalModule, target: HTMLElement):void {
        
        // if this is the green or red button, use its parent.
        if (target.classList.contains("node-button")) {
            target = <HTMLElement>target.parentNode;
        }
        this.dragSourceNode = target;
        // Get the position of the originating connector with respect to the page.
        var offset: HTMLElement = target;
        var x: number = module.moduleView.inputOutputNodeDimension / 2;
        var y: number = module.moduleView.inputOutputNodeDimension / 2;
        while (offset) {
            x += offset.offsetLeft;
            y += offset.offsetTop;
            offset = <HTMLElement> offset.offsetParent;
        }
        
        // Save starting positions of cursor and element.
        this.cursorStartX = x;
        this.cursorStartY = y;
        
        // remember if this is an input or output node, so we can match
        this.isOriginInput = target.classList.contains("node-input");
        this.isParameter = target.classList.contains("parameter-node")
        if (this.isParameter){
            let info =  this.getSliderInfo(target);
            this.parameterAddress = info.getAttribute("parameter_address");
        }

        this.isMidi = target.classList.contains("midi-output")
        if (this.isMidi){
            let info =  this.getSliderInfo(target);
            this.instrument_id = info.getAttribute("instrument_id");
        }
        module.moduleView.getInterfaceContainer().unlitClassname = module.moduleView.getInterfaceContainer().className;
        //module.moduleView.getInterfaceContainer().className += " canConnect";
        
        // Create a connector visual line
        this.connector = new Connector();
        var svgns:string = "http://www.w3.org/2000/svg";
        
        var curve: SVGElement = <SVGElement>document.createElementNS(svgns, "path");
        var d = this.setCurvePath(x,y,x,y,x,x)
        curve.setAttributeNS(null, "d", d);
        curve.setAttributeNS(null, "stroke", "black");
        curve.setAttributeNS(null, "stroke-width", "6");
        curve.setAttributeNS(null, "fill", "none");
        curve.id = String(Connector.connectorId);
        Connector.connectorId++
        //console.log("connector Id = " + Connector.connectorId);
        
        this.connector.connectorShape = <ConnectorShape>curve;
        this.connector.connectorShape.onclick = (event)=> { this.connector.deleteConnection(event, this) };
        
        document.getElementById("svgCanvas").appendChild(curve);
    }
    
    stopDraggingConnection(sourceModule: GraphicalModule, destination: GraphicalModule, target?: HTMLElement): void {
        
        if (sourceModule.moduleView.getInterfaceContainer().lastLit) {
            sourceModule.moduleView.getInterfaceContainer().lastLit.className = sourceModule.moduleView.getInterfaceContainer().lastLit.unlitClassname;
            sourceModule.moduleView.getInterfaceContainer().lastLit = null;
        }
        var resultIsConnectionValid: boolean = true;
        if (target != null) {
            resultIsConnectionValid = this.isConnectionValid(target);
        }
        sourceModule.moduleView.getInterfaceContainer().className = sourceModule.moduleView.getInterfaceContainer().unlitClassname;
        
        var x: number, y: number
        if (destination && destination != sourceModule && this.isConnectionUnique(sourceModule, destination) && resultIsConnectionValid) {
            
            // Get the position of the originating connector with respect to the page.
            
            var offset: HTMLElement;
            if (this.isParameter)
                offset = <HTMLElement> target.parentNode;
            else if (!this.isOriginInput)
                offset = destination.moduleView.getInputNode();
            else
                offset = destination.moduleView.getOutputNode();
            
            var toElem: HTMLElement = offset;
            
            // Get the position of the originating connector with respect to the page.
            x = destination.moduleView.inputOutputNodeDimension / 2;
            y = destination.moduleView.inputOutputNodeDimension / 2;
            
            while (offset) {
                x += offset.offsetLeft;
                y += offset.offsetTop;
                offset = <HTMLElement> offset.offsetParent;
            }
            
            var x1 = this.cursorStartX;
            var y1 = this.cursorStartY;
            var x2 = x;
            var y2 = y;
            var d = this.setCurvePath(x1, y1, x2, y2, this.calculBezier(x1, x2), this.calculBezier(x1, x2))
            this.connector.connectorShape.setAttributeNS(null, "d", d);
            this.updateConnectorShapePath(this.connector.connectorShape, x1, x2, y1, y2);
            
            var src: GraphicalModule, dst: GraphicalModule;
            
            // If connecting from output to input
            if (this.isOriginInput) {
                
                if (toElem.classList.contains("node-output")) {
                    src = destination;
                    dst = sourceModule;
                }
            }
            else {
                if (toElem.classList.contains("node-input")||toElem.classList.contains("parameter-node-input")) {
                    // Make sure the connector line points go from src->dest (x1->x2)
                    var d = this.setCurvePath(x2, y2, x1, y1, this.calculBezier(x1, x2), this.calculBezier(x1, x2))
                    this.connector.connectorShape.setAttributeNS(null, "d", d);
                    this.updateConnectorShapePath(this.connector.connectorShape,x2, x1, y2, y1);
                    
                    // can connect!
                    // TODO: first: swap the line endpoints so they're consistently x1->x2
                    // That makes updating them when we drag nodes around easier.
                    src = sourceModule;
                    dst = destination;
                }
            }
            
            //todo check connection type (signal or paramater )
            if (src && dst) {
                if (this.isParameter){
                    if (this.isMidi){
                        
                        if (target.classList.contains("node-button")) {
                            target = <HTMLElement>target.parentNode;
                        }            
                        this.connector.sourceNode = this.dragSourceNode;
                        this.connector.dstNode = target;
                        let fSrc = src as CompositionModule;
                        let fDst = dst as ModuleClass;
                        console.log(`Trying to connect ${ fSrc.getType}-${this.instrument_id} to ${fDst.moduleFaust.fName}` )
                        this.connector.connectMidiCompositionModule(fSrc, fDst, this.instrument_id);                                     
                        dst.moduleFaust.addParameterInputConnection(this.connector);
                        src.moduleFaust.addParameterOutputConnection(this.connector);
    
                        return
                    }
                    if (target.classList.contains("node-button")) {
                        target = <HTMLElement>target.parentNode;
                    }            
                    let targetParameterAddress = this.getSliderInfo(target).getAttribute("parameter_address");
                    this.connector.sourceNode = this.dragSourceNode;
                    this.connector.dstNode = target;
                    console.log("Trying to connect " + this.parameterAddress + " to " +targetParameterAddress )
                    this.connector.connectModuleParameters(src, dst, this.parameterAddress, targetParameterAddress);                                     
                    dst.moduleFaust.addParameterInputConnection(this.connector);
                    src.moduleFaust.addParameterOutputConnection(this.connector);

                    return;
                }
                else if(src.getType() === "midi"){
                    let fSrc = src as ModuleMIDIReader;
                    let fDst = dst as ModuleClass;
                    //todo check if fdst is poly
                    this.connector.connectMidiModules(fSrc, fDst);
                    
                    fDst.moduleFaust.addInputConnection(this.connector);
                    //todo
                    fSrc.moduleFaust.addOutputConnection(this.connector);
                    
                    this.connector.destination = fDst;
                    //this.connector.source = fSrc;
                    //connector.saveConnection(fSrc, fDst, this.connector.connectorShape);
                    //todo
                    this.connector.connectorShape.onclick = (event)=> { connector.deleteConnection(event,this) };
                    
                    //this.connectorShape = null;
                    return;
                }

                else{
                    
                    let fSrc = src as ModuleClass;
                    let fDst = dst as ModuleClass;
                    var connector: Connector = new Connector();
                    connector.connectModules(fSrc, fDst);
                    
                    fDst.moduleFaust.addInputConnection(connector);
                    fSrc.moduleFaust.addOutputConnection(connector);
                    
                    this.connector.destination = fDst;
                    this.connector.source = fSrc;
                    connector.saveConnection(fSrc, fDst, this.connector.connectorShape);
                    this.connector.connectorShape.onclick = (event)=> { connector.deleteConnection(event,this) };
                    
                    //this.connectorShape = null;
                    return;
                }
            }
            
            

        }
        // Otherwise, delete the line
        this.connector.connectorShape.parentNode.removeChild(this.connector.connectorShape);
        this.connector.connectorShape = null;
    }
    
    startDraggingConnector(target: HTMLElement, x: number, y: number, module: GraphicalModule, event: Event): void {
        
        this.startDraggingConnection(module,target);
        
        // Capture mousemove and mouseup events on the page.
        
        document.addEventListener("mousemove", module.eventConnectorHandler);
        document.addEventListener("mouseup", module.eventConnectorHandler);
        
        event.preventDefault();
        event.stopPropagation();
    }
    
    whileDraggingConnector(target: HTMLElement, x: number, y: number, module: GraphicalModule, event: Event) {
        
        if (this.isDragConnector) {
            var currentHoverElement = <HTMLElement>document.elementFromPoint(x - scrollX, y - scrollY);
            if (currentHoverElement.classList.contains("node-input")) {
                module.styleInputNodeTouchDragOver(currentHoverElement);
            } else if (currentHoverElement.classList.contains("node-output")) {
                module.styleOutputNodeTouchDragOver(currentHoverElement);
            } else if (currentHoverElement.parentElement.classList.contains("node-input")) {
                module.styleInputNodeTouchDragOver(currentHoverElement.parentElement);
            } else if (currentHoverElement.parentElement.classList.contains("node-output")) {
                module.styleOutputNodeTouchDragOver(currentHoverElement.parentElement);
            } else if (!ModuleClass.isNodesModuleUnstyle) {
                var customEvent = new CustomEvent("unstylenode")
                document.dispatchEvent(customEvent);
                
            }
        }
        
        var toElem: HTMLInterfaceContainer = <HTMLInterfaceContainer>target;
        // Get cursor position with respect to the page.
        var x1: number = this.cursorStartX;
        var y1: number = this.cursorStartY;
        var x2: number = x //+ window.scrollX;
        var y2: number = y //+ window.scrollY;
        var d: string;
        if (!this.isOriginInput) {
            d = this.setCurvePath(x1, y1, x2, y2, this.calculBezier(x1, x2), this.calculBezier(x1, x2))
        } else {
            d = this.setCurvePath(x1, y1, x2, y2, this.calculBezier(x1, x2), this.calculBezier(x1, x2))
        }
        // Move connector visual line
        this.connector.connectorShape.setAttributeNS(null, "d", d);
        
        if (toElem.classList) {	// if we don't have class, we're not a node.
        // if this is the green or red button, use its parent.
        if (toElem.classList.contains("node-button"))
        toElem = <HTMLInterfaceContainer>toElem.parentNode;
        
        // If we used to be lighting up a node, but we're not over it anymore,
        // unlight it.
        if (this.lastLit && (this.lastLit != toElem ) ) {
            this.lastLit.className = this.lastLit.unlitClassname;
            this.lastLit = null;
        }
        
        // light up connector point underneath, if any
        if (toElem.classList.contains("node")) {
            if (!this.lastLit || (this.lastLit != toElem )) {
                if (this.isOriginInput) {
                    if (toElem.classList.contains("node-output")) {
                        toElem.unlitClassname = toElem.className;
                        //toElem.className += " canConnect";
                        this.lastLit = toElem;
                    }
                } else {	// first node was an output, so we're looking for an input
                if (toElem.classList.contains("node-input")) {
                    toElem.unlitClassname = toElem.className;
                    //toElem.className += " canConnect";
                    this.lastLit = toElem;
                }
            }
        }
    }
}
event.preventDefault();
event.stopPropagation();
}

stopDraggingConnector(target: HTMLElement, x: number, y: number, module: GraphicalModule): void {
    x = x - window.scrollX;
    y = y - window.scrollY;
    // Stop capturing mousemove and mouseup events.
    document.removeEventListener("mousemove", module.eventConnectorHandler);
    document.removeEventListener("mouseup", module.eventConnectorHandler);
    
    var arrivingHTMLNode: HTMLElement = target;
    var arrivingHTMLParentNode: HTMLElement = <HTMLElement>arrivingHTMLNode.offsetParent;
    var arrivingNode: GraphicalModule;
    
    var modules: GraphicalModule[] = Utilitary.currentScene.getModules();
    
    for (var i = 0; i < modules.length; i++){
        if ((this.isOriginInput && modules[i].moduleView.isPointInOutput(x, y)) || 
            modules[i].moduleView.isPointInInput(x, y) || 
            modules[i].moduleView.isPointInNode(x,y) ){
            arrivingNode = modules[i];
            break;
        }
        else if (this.isMidi && modules[i].moduleView.isPointInMidi(x,y)){
            arrivingNode = modules[i];
        }
    }

    //check arriving node and find module it is attached to
    if (arrivingHTMLParentNode!=undefined&&arrivingHTMLParentNode.classList.contains("node")) {
        var outputModule = Utilitary.currentScene.getAudioOutput();
        var inputModule = Utilitary.currentScene.getAudioInput();
        if ((this.isOriginInput && outputModule.moduleView.isPointInOutput(x, y)) || outputModule.moduleView.isPointInInput(x, y) || arrivingHTMLParentNode.offsetParent.getAttribute("id") == "moduleOutput") {
            arrivingNode = outputModule;
        } else if ((!this.isOriginInput && inputModule.moduleView.isPointInInput(x, y)) || inputModule.moduleView.isPointInOutput(x, y) || arrivingHTMLParentNode.offsetParent.getAttribute("id") == "moduleInput") {
            arrivingNode = inputModule;
        }
    }

    this.stopDraggingConnection(module, arrivingNode, target);
    var index = module.dragList.indexOf(this);
    module.dragList.splice(index, 1);
    this.isDragConnector = false;
    
    
}
isConnectionValid(target: HTMLElement): boolean {
    if (target.classList.contains("node-button")) {
        target = <HTMLElement>target.parentNode;
    }
    if (this.isMidi && target.classList.contains("midi-input")){
        return true;
    }
    if (target.classList.contains("node-input") && this.isOriginInput) {
        return false;
    } else if (target.classList.contains("node-output") && !this.isOriginInput) {
        return false;
    } else {
        return true
    }
}

isConnectionUnique(moduleSource: GraphicalModule, moduleDestination: GraphicalModule): boolean {
    if (this.isOriginInput) {
        for (var i = 0; i < moduleSource.getInputConnections().length; i++) {
            for (var j = 0; j < moduleDestination.getOutputConnections().length; j++) {
                if (moduleSource.getInputConnections[i] == moduleDestination.getOutputConnections()[j]) {
                    return false
                }
            }
        }
    } else {
        for (var i = 0; i < moduleSource.getOutputConnections().length; i++) {
            for (var j = 0; j < moduleDestination.getInputConnections.length; j++) {
                if (moduleSource.getOutputConnections()[i] == moduleDestination.getInputConnections()[j]) {
                    return false
                }
            }
        }
    }
    return true
}
}
