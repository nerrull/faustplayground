/*				MODULECLASS.JS
HAND-MADE JAVASCRIPT CLASS CONTAINING A FAUST MODULE AND ITS INTERFACE

*/

/// <reference path="../Dragging.ts"/>
/// <reference path="../CodeFaustParser.ts"/>
/// <reference path="../Connect.ts"/>
/// <reference path="../Modules/FaustInterface.ts"/>
/// <reference path="../Messages.ts"/>
/// <reference path="ModuleFaust.ts"/>
/// <reference path="ModuleView.ts"/>


enum ModuleType {
    Abstract = 1,
    FaustDSP,
    FaustDSP_MIDI,
    MidiController,
    SamplePlayer,
}

interface DSPCallback 	{ (): void; }

class GraphicalModule  {
    static isNodesModuleUnstyle: boolean = true;
    //drag object to handle dragging of module and connection
    drag: Drag = new Drag()
    dragList: Drag[] = [];
    //used only for save or recall
    patchID: string;
    moduleFaust: ModuleFaust;
    moduleView: ModuleView;
    moduleControles: FaustInterfaceControler[] = [];
    protected fModuleInterfaceParams: { [label: string]: string } = {};
    
    eventDraggingHandler: (event: MouseEvent) => void;
    eventConnectorHandler: (event: Event) => void;
    eventOpenEditHandler: () => void;

    typeString:string;
    public getType():string{
        return this.typeString;
    }

    moduleType: ModuleType;
    public getModuleType():ModuleType{
        return this.moduleType;
    }

    jsonDesc : JSONModuleDescription;

    getJSON(): JSONModuleDescription { return this.jsonDesc; }
    setJSON(code: JSONModuleDescription): void {
        this.jsonDesc = code;
    }
    

    constructor(id: number, x: number, y: number, name: string, htmlElementModuleContainer: HTMLElement) {
        this.eventConnectorHandler = (event: MouseEvent) => { this.dragCnxCallback(event, this) };
        this.eventOpenEditHandler = () => { this.edit() }
        this.eventDraggingHandler = (event) => { this.dragCallback(event, this) };
        this.typeString = "abstract"
        this.moduleView = new ModuleView();
        this.moduleView.createModuleView(id, x, y, name, htmlElementModuleContainer);
        this.addEvents();
        this.moduleFaust = new ModuleFaust(name);
        
    }
    
    //add all event listener to the moduleView
    addEvents() {
        this.moduleView.getModuleContainer().addEventListener("mousedown", this.eventDraggingHandler, false);
        this.moduleView.getModuleContainer().addEventListener("touchstart", this.eventDraggingHandler, false);
        this.moduleView.getModuleContainer().addEventListener("touchmove", this.eventDraggingHandler, false);
        this.moduleView.getModuleContainer().addEventListener("touchend", this.eventDraggingHandler, false);
        if (this.moduleView.textArea != undefined) {
            this.moduleView.textArea.addEventListener("touchstart", (e) => { e.stopPropagation() });
            this.moduleView.textArea.addEventListener("touchend", (e) => { e.stopPropagation() });
            this.moduleView.textArea.addEventListener("touchmove", (e) => { e.stopPropagation() });
            this.moduleView.textArea.addEventListener("mousedown", (e) => { e.stopPropagation() });
        }
        if (this.moduleView.closeButton != undefined) {
            this.moduleView.closeButton.addEventListener("click", () => { this.deleteModule(); });
            this.moduleView.closeButton.addEventListener("touchend", () => { this.deleteModule(); });
        }
        if (this.moduleView.miniButton != undefined) {
            this.moduleView.miniButton.addEventListener("click", () => { this.minModule(); });
            this.moduleView.miniButton.addEventListener("touchend", () => { this.minModule(); });
        }
        if (this.moduleView.maxButton != undefined) {
            this.moduleView.maxButton.addEventListener("click", () => { this.maxModule(); });
            this.moduleView.maxButton.addEventListener("touchend", () => { this.maxModule(); });
        }
        if (this.moduleView.fEditImg != undefined) {
            this.moduleView.fEditImg.addEventListener("click", this.eventOpenEditHandler);
            this.moduleView.fEditImg.addEventListener("touchend",  this.eventOpenEditHandler);
        }
    }
    
    /***************  protected METHODS  ******************************/
    
    protected dragCallback(event: Event, module: GraphicalModule): void {
        
        if (event.type == "mousedown") {
            module.drag.getDraggingMouseEvent(<MouseEvent>event, module, (el, x, y, module, e) => { module.drag.startDraggingModule(el, x, y, module, e) });
        } else if (event.type == "mouseup") {
            module.drag.getDraggingMouseEvent(<MouseEvent>event, module, (el, x, y, module, e) => { module.drag.stopDraggingModule(el, x, y, module, e) });
        } else if (event.type == "mousemove") {
            module.drag.getDraggingMouseEvent(<MouseEvent>event, module, (el, x, y, module, e) => { module.drag.whileDraggingModule(el, x, y, module, e) });
        } else if (event.type == "touchstart") {
            module.drag.getDraggingTouchEvent(<TouchEvent>event, module, (el, x, y, module, e) => { module.drag.startDraggingModule(el, x, y, module, e) });
        } else if (event.type == "touchmove") {
            module.drag.getDraggingTouchEvent(<TouchEvent>event, module, (el, x, y, module, e) => { module.drag.whileDraggingModule(el, x, y, module, e) });
        } else if (event.type == "touchend") {
            module.drag.getDraggingTouchEvent(<TouchEvent>event, module, (el, x, y, module, e) => { module.drag.stopDraggingModule(el, x, y, module, e) });
        }
    }
    
    protected dragCnxCallback(event: Event, module: GraphicalModule): void {
        if (event.type == "mousedown") {
            module.drag.getDraggingMouseEvent(<MouseEvent>event, module, (el, x, y, module, e) => { module.drag.startDraggingConnector(el, x, y, module, e) });
        } else if (event.type == "mouseup") {
            module.drag.getDraggingMouseEvent(<MouseEvent>event, module, (el, x, y, module) => { module.drag.stopDraggingConnector(el, x, y, module) });
        } else if (event.type == "mousemove") {
            module.drag.getDraggingMouseEvent(<MouseEvent>event, module, (el, x, y, module, e) => { module.drag.whileDraggingConnector(el, x, y, module, e) });
        } else if (event.type == "touchstart") {
            var newdrag = new Drag();
            newdrag.isDragConnector = true;
            newdrag.originTarget = <HTMLElement>event.target;
            module.dragList.push(newdrag);
            var index = module.dragList.length - 1
            module.dragList[index].getDraggingTouchEvent(<TouchEvent>event, module, (el, x, y, module, e) => { module.dragList[index].startDraggingConnector(el, x, y, module, e) });
            
        } else if (event.type == "touchmove") {
            
            for (var i = 0; i < module.dragList.length; i++) {
                if (module.dragList[i].originTarget == event.target) {
                    module.dragList[i].getDraggingTouchEvent(<TouchEvent>event, module, (el, x, y, module, e) => { module.dragList[i].whileDraggingConnector(el, x, y, module, e) })
                }
            }
        } else if (event.type == "touchend") {
            var customEvent = new CustomEvent("unstylenode");
            document.dispatchEvent(customEvent);
            for (var i = 0; i < module.dragList.length; i++) {
                if (module.dragList[i].originTarget == event.target) {
                    module.dragList[i].getDraggingTouchEvent(<TouchEvent>event, module, (el, x, y, module) => { module.dragList[i].stopDraggingConnector(el, x, y, module) });
                }
            }
            document.dispatchEvent(customEvent);
        }
    }
    
    /*******************************  PUBLIC METHODS  **********************************/
    deleteModule(): void {
        
        // var connector: Connector = new Connector()
        // connector.disconnectModule(this);
        
        this.deleteFaustInterface();
        
        // Then delete the visual element
        if (this.moduleView) {
            this.moduleView.fModuleContainer.parentNode.removeChild(this.moduleView.fModuleContainer);
        }
    }
    
    //make module smaller
    minModule() {
        this.moduleView.fInterfaceContainer.classList.add("mini");
        this.moduleView.fTitle.classList.add("miniTitle");
        this.moduleView.miniButton.style.display = "none";
        this.moduleView.maxButton.style.display = "block";
        Connector.redrawInputConnections(this, this.drag);
        Connector.redrawOutputConnections(this, this.drag);
    }
    
    //restore module size
    maxModule() {
        this.moduleView.fInterfaceContainer.classList.remove("mini");
        this.moduleView.fTitle.classList.remove("miniTitle");
        this.moduleView.maxButton.style.display = "none";
        this.moduleView.miniButton.style.display = "block";
        Connector.redrawInputConnections(this, this.drag);
        Connector.redrawOutputConnections(this, this.drag);
    }
    /******************** EDIT SOURCE & RECOMPILE *************************/
    edit(): void {
        
    }
    
    //---- Update ModuleClass with new name/code source
    update(name: string, code: string): void {
    }
    
    
    /***************** CREATE/DELETE the DSP Interface ********************/
    
    
    // Fill fInterfaceContainer with the DSP's Interface (--> see FaustInterface.js)
    setFaustInterfaceControles():void {
        // //this.moduleView.fTitle.textContent = this.moduleFaust.fName;
        // var moduleFaustInterface = new FaustInterfaceControler(
        //     (faustInterface) => { this.interfaceSliderCallback(faustInterface) },
        //     (adress, value) => { this.setParamValue(adress, value) }
        //     );
        
        //     //let ui_json = JSON.parse(this.moduleFaust.fDSP.getJSON())
        //     //this.moduleControles = moduleFaustInterface.parseFaustJsonUI(ui_json).ui, this);
    }
    
    // Delete all FaustInterfaceControler
    protected deleteFaustInterface(): void {
        
        while (this.moduleView.fInterfaceContainer.childNodes.length != 0) {
            this.moduleView.fInterfaceContainer.removeChild(this.moduleView.fInterfaceContainer.childNodes[0]);
        }
    }
    
    // Create FaustInterfaceControler, set its callback and add 
    createFaustInterface():void {
        for (var i = 0; i < this.moduleControles.length; i++) {
            var faustInterfaceControler = this.moduleControles[i];
            let type = faustInterfaceControler.itemParam.type;
            faustInterfaceControler.setParams();
            faustInterfaceControler.faustInterfaceView = new FaustInterfaceView(type)
            this.moduleView.getInterfaceContainer().appendChild(faustInterfaceControler.createFaustInterfaceElement());
            // faustInterfaceControler.interfaceCallback = this.interfaceSliderCallback.bind(this);
            
            if (type === "vslider" ||type =="hslider" ){
                faustInterfaceControler.faustInterfaceView.inputNode.addEventListener("mousedown", this.eventConnectorHandler);
                faustInterfaceControler.faustInterfaceView.inputNode.addEventListener("touchstart", this.eventConnectorHandler);
                faustInterfaceControler.faustInterfaceView.inputNode.addEventListener("touchmove", this.eventConnectorHandler);
                faustInterfaceControler.faustInterfaceView.inputNode.addEventListener("touchend", this.eventConnectorHandler);
                
                faustInterfaceControler.faustInterfaceView.outputNode.addEventListener("mousedown", this.eventConnectorHandler);
                faustInterfaceControler.faustInterfaceView.outputNode.addEventListener("touchstart", this.eventConnectorHandler);
                faustInterfaceControler.faustInterfaceView.outputNode.addEventListener("touchmove", this.eventConnectorHandler);
                faustInterfaceControler.faustInterfaceView.outputNode.addEventListener("touchend", this.eventConnectorHandler);
                
            }

            if (type === "midilabel"  ){
                faustInterfaceControler.faustInterfaceView.outputNode.addEventListener("mousedown", this.eventConnectorHandler);
                faustInterfaceControler.faustInterfaceView.outputNode.addEventListener("touchstart", this.eventConnectorHandler);
                faustInterfaceControler.faustInterfaceView.outputNode.addEventListener("touchmove", this.eventConnectorHandler);
                faustInterfaceControler.faustInterfaceView.outputNode.addEventListener("touchend", this.eventConnectorHandler);
                
            }
            
            faustInterfaceControler.setEventListener();
        }
    }
    
    //---- Generic callback for Faust Interface
    //---- Called every time an element of the UI changes value
    interfaceSliderCallback(faustControler: FaustInterfaceControler): any {
        var val: string
        if (faustControler.faustInterfaceView.slider) {
            var input: HTMLInputElement = faustControler.faustInterfaceView.slider;
            val = Number((parseFloat(input.value) * parseFloat(faustControler.itemParam.step)) + parseFloat(faustControler.itemParam.min)).toFixed(parseFloat(faustControler.precision));
        } else if (faustControler.faustInterfaceView.button) {
            var input: HTMLInputElement = faustControler.faustInterfaceView.button;
            if (faustControler.value == undefined || faustControler.value == "0") {
                faustControler.value = val = "1"
            } else {
                faustControler.value = val = "0"
            }
        }
        var text: string = faustControler.itemParam.address;
        faustControler.value = val;
        
        var output: HTMLElement = faustControler.faustInterfaceView.output;
        
        //---- update the value text
        if (output)
        output.textContent = "" + val + " " + faustControler.unit;
        // 	Search for DSP then update the value of its parameter.
        this.setParamValue(text, val);
        
        for(var address in faustControler.valueChangeCallbacks) {
            let cb =  faustControler.valueChangeCallbacks[address];
            cb(address, val)
        }    
    }
    
    
    interfaceButtonCallback(faustControler: FaustInterfaceControler, val?: number): any {
        
        var text: string = faustControler.itemParam.address;
        faustControler.value = val.toString();
        
        var output: HTMLElement = faustControler.faustInterfaceView.output;
        
        //---- update the value text
        if (output)
        output.textContent = "" + val + " " + faustControler.unit;
        
        // 	Search for DSP then update the value of its parameter.
        this.setParamValue(text, val.toString());
    }
    
    // Save graphical parameters of a Faust Node
    protected saveInterfaceParams(): void {
        
        var controls = this.moduleControles;
        for (var j = 0; j < controls.length; j++) {
            var text: string = controls[j].itemParam.address;
            this.fModuleInterfaceParams[text] = controls[j].value;
        }
    }
    recallInterfaceParams(): void {
        
        for (var key in this.fModuleInterfaceParams)
        this.setParamValue(key, this.fModuleInterfaceParams[key]);
    }
    
    getInterfaceParams(): { [label: string]:string }{
        return this.fModuleInterfaceParams;
    }
    setInterfaceParams(parameters: { [label: string]: string }): void {
        this.fModuleInterfaceParams = parameters;
    }
    addInterfaceParam(path: string, value: number): void {
        this.fModuleInterfaceParams[path] = value.toString();
    }
    
    
    /******************* GET/SET INPUT/OUTPUT NODES **********************/
    addInputOutputNodes(): void {
        if (this.getNumInputs() > 0 && this.moduleView.fName != "input") {
            this.moduleView.setInputNode();
            this.moduleView.fInputNode.addEventListener("mousedown", this.eventConnectorHandler);
            this.moduleView.fInputNode.addEventListener("touchstart", this.eventConnectorHandler);
            this.moduleView.fInputNode.addEventListener("touchmove", this.eventConnectorHandler);
            this.moduleView.fInputNode.addEventListener("touchend", this.eventConnectorHandler);
        }
        
        if (this.getNumOutputs() > 0 && this.moduleView.fName != "output") {
            this.moduleView.setOutputNode();
            this.moduleView.fOutputNode.addEventListener("mousedown", this.eventConnectorHandler);
            this.moduleView.fOutputNode.addEventListener("touchstart", this.eventConnectorHandler);
            this.moduleView.fOutputNode.addEventListener("touchmove", this.eventConnectorHandler);
            this.moduleView.fOutputNode.addEventListener("touchend", this.eventConnectorHandler);
        }
    }
    
    /******************* GET/SET INPUT/OUTPUT NODES **********************/
    addMidiControlNode(): void {      
        this.moduleView.setMidiNode();
        this.moduleView.fMidiNode.addEventListener("mousedown", this.eventConnectorHandler);
        this.moduleView.fMidiNode.addEventListener("touchstart", this.eventConnectorHandler);
        this.moduleView.fMidiNode.addEventListener("touchmove", this.eventConnectorHandler);
        this.moduleView.fMidiNode.addEventListener("touchend", this.eventConnectorHandler);
    }
    //manage style of node when touchover will dragging
    //make the use easier for connections
    styleInputNodeTouchDragOver(el: HTMLElement) {
        el.style.border = "15px double rgb(0, 211, 255)"
        el.style.left = "-32px"
        el.style.marginTop = "-32px"
        ModuleClass.isNodesModuleUnstyle = false;
    }
    styleOutputNodeTouchDragOver(el: HTMLElement) {
        el.style.border = "15px double rgb(0, 211, 255)"
        el.style.right = "-32px"
        el.style.marginTop = "-32px"
        ModuleClass.isNodesModuleUnstyle = false;
    }
    
    //function for children to overide to handle setting parameters/outputs/connections from gui
    
    setParamValue(text : string, val: string):void {
        console.log("IMPLEMENT ME")
    }
    externalSetParamValue(text : string, val: string):void {
        console.log("IMPLEMENT ME")
    }
    
    getNumInputs(): number{
        return 0;
    }
    
    getNumOutputs(): number{
        return 0;
    }
    
    
    getInputConnections() : Connector[]{
        return this.moduleFaust.fInputConnections;
    }
    
    getOutputConnections() : Connector[]{
        return this.moduleFaust.fOutputConnections;
    }
    
    
    getInputParameterConnections() : Connector[]{
        return this.moduleFaust.pInputConnections;
    }
    
    getOutputParameterConnections() : Connector[]{
        return this.moduleFaust.pOutputConnections;
    }
    
    
    
    
}
