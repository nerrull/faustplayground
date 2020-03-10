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
/// <reference path="GraphicalModule.ts"/>

interface DSPCallback 	{ (): void; }

class ModuleClass extends GraphicalModule  {


    protected deleteCallback: (module: ModuleClass) => void;
    protected fModuleInterfaceParams: { [label: string]: string } = {};

    eventCloseEditHandler: (event: Event) => void;
    compileFaust: (conpileFaust: CompileFaust) => void;
    isMidi: boolean;

    constructor(id: number, x: number, y: number, name: string, htmlElementModuleContainer: HTMLElement, removeModuleCallBack: (m: ModuleClass) => void, compileFaust: (compileFaust: CompileFaust) => void) {
        super(id,x, y, name, htmlElementModuleContainer);

        this.eventCloseEditHandler = (event: MouseEvent) => { this.recompileSource(event, this) }
        this.eventOpenEditHandler = () => { this.edit() }
        this.isMidi = false;
        this.compileFaust = compileFaust;
        this.deleteCallback = removeModuleCallBack;
        // this.moduleFaust = new ModuleFaust(name);
        this.typeString = "dsp"
        this.moduleType = ModuleType.FaustDSP;
    }
    



    /*******************************  PUBLIC METHODS  **********************************/
    deleteModule(): void {
        super.deleteModule();

        this.deleteDSP(this.moduleFaust.fDSP);
        this.moduleFaust.fDSP = null;
        faust.deleteDSPFactory(this.moduleFaust.factory);
        this.moduleFaust.factory = null;
        this.deleteCallback(this);
    }
	

    //--- Create and Update are called once a source code is compiled and the factory exists
    createDSP(factory: Factory, callback: DSPCallback): void {
        this.moduleFaust.factory = factory;
        this.isMidi = factory.isMidi;
        try {
            if (factory != null) {
                var moduleFaust = this.moduleFaust; 
                //let options = moduleFaust.factory.factory.json_object.meta;
                //todo: make poly work
                if (this.isMidi){
                    faust.createPolyDSPWorkletInstance(factory, Utilitary.audioContext, 16,
                        function(dsp) {
                          if (dsp != null) {
                            moduleFaust.fDSP = dsp;
                            callback();
                          } else {
                            new Message(Utilitary.messageRessource.errorCreateDSP);
                            Utilitary.hideFullPageLoading();
                          }
                        });
                }
                else{
                    faust.createDSPWorkletInstance(factory, Utilitary.audioContext, 
                        function(dsp) {
                          if (dsp != null) {
                            moduleFaust.fDSP = dsp;
                            callback();
                          } else {
                            new Message(Utilitary.messageRessource.errorCreateDSP);
                            Utilitary.hideFullPageLoading();
                          }
                        });
                }
               
                // To activate the AudioWorklet mode
                //faust.createDSPWorkletInstance(factory, Utilitary.audioContext, function(dsp) { moduleFaust.fDSP = dsp; callback(); });
            } else {
                throw new Error("create DSP Error : null factory");
            }
        } catch (e) {
            new Message(Utilitary.messageRessource.errorCreateDSP + " : " + e)
            Utilitary.hideFullPageLoading();
        }
    }

    // public midiControl(channel, pitch, velocity ){
    //     console.log("Received midi control " )

    //     this.moduleFaust.fDSP.keyOn(channel, pitch, velocity)
    // }

    public midiControl(midiInfo ){
        //console.log("Received midi control " )
        var base : string = this.moduleFaust.getBaseAdressPath();
        this.externalSetParamValue(base +'/freq', "" +AudioUtils.midiToFreq(midiInfo.note),  true);
        this.externalSetParamValue(base+'/gain', "" +AudioUtils.normalizeVelocity(midiInfo.note), true);
        if (midiInfo.on)
            this.moduleFaust.fDSP.keyOn(midiInfo.channel, midiInfo.note, midiInfo.velocity);
        else{
            this.moduleFaust.fDSP.keyOff(midiInfo.channel, midiInfo.note, midiInfo.velocity);
        }
    }


    //--- Update DSP in module
    protected updateDSP(factory: Factory, module: ModuleClass): void {

        var toDelete: IfDSP = module.moduleFaust.fDSP;

        // 	Save Cnx
        var saveOutCnx: Connector[] = new Array().concat(module.moduleFaust.fOutputConnections);
        var saveInCnx: Connector[] = new Array().concat(module.moduleFaust.fInputConnections);

        // Delete old ModuleClass
        var connector: Connector = new Connector();
        connector.disconnectModule(module);

        module.deleteFaustInterface();
        module.moduleView.deleteInputOutputNodes();

        // Create new one
		module.createDSP(factory, function() {
        	module.moduleFaust.fName = module.moduleFaust.fTempName;
        	module.moduleFaust.fSource = module.moduleFaust.fTempSource
        	module.setFaustInterfaceControles()
        	module.createFaustInterface();
        	module.addInputOutputNodes();

        	module.deleteDSP(toDelete);

        	// Recall Cnx
        	if (saveOutCnx && module.moduleView.getOutputNode()) {
          	  	for (var i = 0; i < saveOutCnx.length; i++) {
               	 	if (saveOutCnx[i])
                   		connector.createConnection(module, module.moduleView.getOutputNode(), saveOutCnx[i].destination, saveOutCnx[i].destination.moduleView.getInputNode());
            	}
        	}
        	if (saveInCnx && module.moduleView.getInputNode()) {
           	 	for (var i = 0; i < saveInCnx.length; i++) {
                	if (saveInCnx[i])
                    	connector.createConnection(saveInCnx[i].source, saveInCnx[i].source.moduleView.getOutputNode(), module, module.moduleView.getInputNode());
            	}
        	}
        	Utilitary.hideFullPageLoading();
        });
    }

    //Todo make poly work
    protected deleteDSP(todelete: IfDSP): void {
        if (todelete)
            faust.deleteDSPWorkletInstance(todelete);
    }
    /******************** EDIT SOURCE & RECOMPILE *************************/
    //OVERRIDE
    edit(): void {

        this.saveInterfaceParams();

        var event: CustomEvent = new CustomEvent("codeeditevent")
        document.dispatchEvent(event);

        this.deleteFaustInterface();

        this.moduleView.textArea.style.display = "block";
        this.moduleView.textArea.value = this.moduleFaust.fSource;
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

        var event: CustomEvent = new CustomEvent("codeeditevent")
        document.dispatchEvent(event);
        this.moduleFaust.fTempName = name;
        this.moduleFaust.fTempSource = code;
        var module: ModuleClass = this;

        this.compileFaust({isMidi:this.isMidi, name: name, sourceCode: code, x: this.moduleView.x, y: this.moduleView.y, callback: (factory) => { module.updateDSP(factory, module) }});
    }

    //---- React to recompilation triggered by click on icon
    protected recompileSource(event: MouseEvent, module: ModuleClass): void {
        Utilitary.showFullPageLoading();
        var dsp_code: string = this.moduleView.textArea.value;
        this.moduleView.textArea.style.display = "none";
        Connector.redrawOutputConnections(this, this.drag);
        Connector.redrawInputConnections(this, this.drag)
        module.update(this.moduleView.fTitle.textContent, dsp_code);
        module.recallInterfaceParams();

        module.moduleView.fEditImg.style.backgroundImage = "url(" + Utilitary.baseImg + "edit.png)";
        module.moduleView.fEditImg.addEventListener("click", this.eventOpenEditHandler);
        module.moduleView.fEditImg.addEventListener("touchend", this.eventOpenEditHandler);
        module.moduleView.fEditImg.removeEventListener("click", this.eventCloseEditHandler);
        module.moduleView.fEditImg.removeEventListener("touchend", this.eventCloseEditHandler);
    }

    /***************** CREATE/DELETE the DSP Interface ********************/

    // Fill fInterfaceContainer with the DSP's Interface (--> see FaustInterface.js)
    //Override
    setFaustInterfaceControles(): void {
        this.moduleView.fTitle.textContent = this.moduleFaust.fName;
        var moduleFaustInterface = new FaustInterfaceControler(
            (faustInterface) => { this.interfaceSliderCallback(faustInterface) },
            (adress, value) => { this.moduleFaust.fDSP.setParamValue(adress, value) }
            );
        this.moduleControles = moduleFaustInterface.parseFaustJsonUI(JSON.parse(this.moduleFaust.fDSP.getJSON()).ui, this);
    }


    // Delete all FaustInterfaceControler
    protected deleteFaustInterface(): void {
        super.deleteFaustInterface();
    }


    // set DSP value to all FaustInterfaceControlers
    setDSPValue() {
        for (var i = 0; i < this.moduleControles.length; i++){
            this.moduleFaust.fDSP.setParamValue(this.moduleControles[i].itemParam.address, this.moduleControles[i].value)
        }
    }

    // set DSP value to specific FaustInterfaceControlers
    setDSPValueCallback(address: string, value: string) {
        this.moduleFaust.fDSP.setParamValue(address, value)
    }



    //Function overrides
    getNumInputs(): number{
        return this.moduleFaust.fDSP.getNumInputs();
    }

    getNumOutputs(): number{

        return this.moduleFaust.fDSP.getNumOutputs();
    }

    setParamValue(text:string, val:string):void{
        this.moduleFaust.fDSP.setParamValue(text, val);
    } 
    externalSetParamValue(address:string, val:string, interfaceOnly:boolean = false):void{
        var controller:FaustInterfaceControler;
        var iParam : Iitem;
        for (let i =0  ; i < this.moduleControles.length; i++){
            let mod = this.moduleControles[i]
            if (mod.itemParam.address == address) {
                controller = mod;
                iParam = mod.itemParam;
            }
        }

        if (controller){
            controller.faustInterfaceView.slider.value = String((parseFloat(val) - parseFloat(iParam.min)) / parseFloat(iParam.step));
            if(!interfaceOnly)
                this.moduleFaust.fDSP.setParamValue(address, val);
        
                
            //Propagate to other linked modules
            for(var address in controller.valueChangeCallbacks) {
                let cb =  controller.valueChangeCallbacks[address];
                cb(address, val, interfaceOnly)
            } 
        }
   
    } 
 

}
