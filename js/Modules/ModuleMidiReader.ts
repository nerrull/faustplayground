/*				ModuleMIDIReader.JS
	HAND-MADE JAVASCRIPT CLASS CONTAINING A FAUST MODULE AND ITS INTERFACE

*/
/// <reference path="../midi/MIDIManager.ts"/>
/// <reference path="../Dragging.ts"/>
/// <reference path="../CodeFaustParser.ts"/>
/// <reference path="../Connect.ts"/>
/// <reference path="../Modules/FaustInterface.ts"/>
/// <reference path="../Messages.ts"/>
/// <reference path="ModuleFaust.ts"/>
/// <reference path="ModuleView.ts"/>
/// <reference path="GraphicalModule.ts"/>

class ModuleMIDIReader extends GraphicalModule  {

    MIDIcontrol : MIDIManager;
    protected deleteCallback: (module: ModuleMIDIReader) => void;
    protected fModuleInterfaceParams: { [label: string]: string } = {};

    eventCloseEditHandler: (event: Event) => void;

    targetMidiCallback : (c:number,p:number,v:number) => void;

    constructor(id: number, x: number, y: number, name: string, htmlElementModuleContainer: HTMLElement, removeModuleCallBack: (m: ModuleMIDIReader) => void){
        super(id,x, y, name, htmlElementModuleContainer);
        this.MIDIcontrol =new MIDIManager(this.midiCallback);
        this.eventCloseEditHandler = (event: MouseEvent) => { this.recompileSource(event, this) }
        this.eventOpenEditHandler = () => { this.edit() }

        this.deleteCallback = removeModuleCallBack;
        this.typeString = "midi"

        // var connector: Connector = new Connector();
        // connector.createConnection(this, this.moduleView.getOutputNode(), saveOutCnx[i].destination, saveOutCnx[i].destination.moduleView.getInputNode());


    }

    loadAndPlay(){
        this.MIDIcontrol.loadFile("../../data/midi/Dayung - 1.mid", () =>{this.MIDIcontrol.start()}, null,this.logError )
    }

    setMidiCallback(cb){
        this.targetMidiCallback = cb;
        this.MIDIcontrol.onMidiEvent =cb;
    }

    midiCallback(midiInfo){
        console.log(midiInfo);
        if (this.targetMidiCallback){
            this.targetMidiCallback(midiInfo.channel, midiInfo.pitch, midiInfo.velocity)
        }
        //todo: publish + display the midi information 
    }

    logError(e){
        console.log("Error loading midi file")
        console.log(e)
    }

    /*******************************  PUBLIC METHODS  **********************************/
    deleteModule(): void {

        var connector: Connector = new Connector()
        connector.disconnectMIDIModule(this);
        super.deleteModule();
        this.deleteCallback(this);
    }
	

    //--- Load a file containing midi information
    protected loadMIDIfile(){

    }

    //--- Update MIDI contents in module
    protected updateMIDIfile(): void {

    }

    /******************** EDIT SOURCE & RECOMPILE *************************/
    //OVERRIDE
    edit(): void {

        this.saveInterfaceParams();

        var event: CustomEvent = new CustomEvent("codeeditevent")
        document.dispatchEvent(event);

        this.deleteFaustInterface();

        this.moduleView.textArea.style.display = "block";
        //this.moduleView.textArea.value = this.MIDIcontrol.;
        Connector.redrawInputConnections(this, this.drag);
        Connector.redrawOutputConnections(this, this.drag);
        this.moduleView.fEditImg.style.backgroundImage = "url(" + Utilitary.baseImg + "enter.png)";
        this.moduleView.fEditImg.addEventListener("click", this.eventCloseEditHandler);
        this.moduleView.fEditImg.addEventListener("touchend", this.eventCloseEditHandler);
        this.moduleView.fEditImg.removeEventListener("click", this.eventOpenEditHandler);
        this.moduleView.fEditImg.removeEventListener("touchend", this.eventOpenEditHandler);
    }

    //---- Update ModuleClass with new name/code source
    update(name: string, code: string): void {

        var event: CustomEvent = new CustomEvent("midiEditEvent")
        document.dispatchEvent(event);
        // this.moduleFaust.fTempName = name;
        // this.moduleFaust.fTempSource = code;
        var module: ModuleMIDIReader = this;

        //this.compileFaust({ name: name, sourceCode: code, x: this.moduleView.x, y: this.moduleView.y});
    }

    //---- React to recompilation triggered by click on icon
    protected recompileSource(event: MouseEvent, module: ModuleMIDIReader): void {
       
        // Utilitary.showFullPageLoading();
        // var dsp_code: string = this.moduleView.textArea.value;
        // this.moduleView.textArea.style.display = "none";
        // Connector.redrawOutputConnections(this, this.drag);
        // Connector.redrawInputConnections(this, this.drag)
        // module.update(this.moduleView.fTitle.textContent, dsp_code);
        // module.recallInterfaceParams();

        // module.moduleView.fEditImg.style.backgroundImage = "url(" + Utilitary.baseImg + "edit.png)";
        // module.moduleView.fEditImg.addEventListener("click", this.eventOpenEditHandler);
        // module.moduleView.fEditImg.addEventListener("touchend", this.eventOpenEditHandler);
        // module.moduleView.fEditImg.removeEventListener("click", this.eventCloseEditHandler);
        // module.moduleView.fEditImg.removeEventListener("touchend", this.eventCloseEditHandler);
    }

    /***************** CREATE/DELETE the DSP Interface ********************/

    // Fill fInterfaceContainer with the DSP's Interface (--> see FaustInterface.js)
    //Override
    setFaustInterfaceControles(): void {
        //this.moduleView.fTitle.textContent = this.moduleFaust.fName;
       
        var moduleFaustInterface = new FaustInterfaceControler(
            (faustInterface) => { this.interfaceSliderCallback(faustInterface) },
            (adress, value) => { this.setParamValue(adress, value) }
            );
        
        this.moduleControles.push(FaustInterfaceControler.addButton("Start", () => {this.MIDIcontrol.start()}))
        this.moduleControles.push(FaustInterfaceControler.addButton("Stop", () => {this.MIDIcontrol.stop()}))
        this.moduleControles.push(FaustInterfaceControler.addButton("Pause", () => {this.MIDIcontrol.pause()}))

        // moduleFaustInterface.faustInterfaceView.addFaustButton({label:"Start", init:"", type:"button", address:""})
        // moduleFaustInterface.faustInterfaceView.addFaustButton({label:"Stop", init:"", type:"button", address:""})
        // moduleFaustInterface.faustInterfaceView.addFaustButton({label:"Pause", init:"", type:"button", address:""})

        //this.moduleControles = moduleFaustInterface.parseFaustJsonUI(JSON.parse(this.getJSON()).ui, this);
    }

    // interface Iitem{
    //     label: string;
    //     init: string;
    //     address: string;
    //     type: string;
    //     min: string;
    //     max: string;
    //     step: string;
    //     meta: FaustMeta[];
    // }


    // Delete all FaustInterfaceControler
    protected deleteFaustInterface(): void {
        super.deleteFaustInterface();
    }


    // set DSP value to all FaustInterfaceControlers
    setOutputValues() {
        for (var i = 0; i < this.moduleControles.length; i++){
            this.setParamValue(this.moduleControles[i].itemParam.address, this.moduleControles[i].value)
        }
    }

    // set DSP value to specific FaustInterfaceControlers
    setDSPValueCallback(address: string, value: string) {
        this.setParamValue(address, value)
    }


    //Function overrides
    getNumInputs(): number{
        return 0;
        //return this.MIDIcontrol.getNumInputs();
    }

    getNumOutputs(): number{
        return 1 ;
        //return this.MIDIcontrol.getNumOutputs();
    }

    setParamValue(text:string, val:string):void{
        //this.MIDIcontrol.setParamValue(text, val);
    } 

    // getInputConnections() : Connector[]{
    //     return [];
    //     //return this.MIDIcontrol.fInputConnections;
    // }
            
    // getOutputConnections() : Connector[]{
    //     return this.outputConnection;
    // }

    getParameterConnections() : Connector[]{
        return [];
        //return this.MIDIcontrol.fOutputConnections;
    }
}
