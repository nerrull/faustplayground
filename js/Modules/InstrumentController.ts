
//Todo, delete callback targets on cable deletion
class InstrumentController{
    name: string;
    movementMidiControllers : {[id:number] : MIDIManager[]};
    fileLoaded : boolean;
    numbars : number;
    currentMovement : number ;
    currentController : number;
    connectors : Connector[];
    isPlaying :boolean;
    callbackTargets : {[patchID:string] : Function};   

    
    constructor(name:string, n_movements:number){
        this.name = name;
        this.fileLoaded = false;
        this.movementMidiControllers ={}// {number: MIDIManager[]}
        this.currentMovement = 0;
        this.currentController = 0;
        this.isPlaying = false;
        this.callbackTargets ={};
        this.connectors = [];
        for(let i =0; i <n_movements; i++){
            this.movementMidiControllers[i] = []
        }
    }
    addMidiCallback(c: Connector, cb:Function){
        this.callbackTargets[c.targetPatchID] = cb;
        this.connectors.push(c);
        // for (let m of Object.keys(this.movementMidiControllers)){
        //     for (let c of this.movementMidiControllers[m]){
        //         c.addListener(cb);
        //     }
        // }
    }
    removeMidiCallback(c: Connector){

        this.callbackTargets[c.targetPatchID] = null;
    }

    midiCallback(midiInfo){
        // console.log (`${Utilitary.audioContext.currentTime} :${this.name} - MIDI event: ${midiInfo.note}`);
       
        for (var k in this.callbackTargets){
            if (this.callbackTargets[k])
                this.callbackTargets[k](midiInfo)
        }
        
    }


    loadMidi(file, movement){
        let m = new MIDIManager((midiInfo)=>this.midiCallback(midiInfo));
        m.loadFile(file, (file) =>{this.midiLoaded(file)},null, (file)=> (this.midiLoadFailed(file)))
        this.movementMidiControllers[movement].push(m);
    }
    
    midiLoaded(filename:string):void{
        console.log(this.name + " successfully loaded file : "+ filename)
        this.fileLoaded =true;
    }
    
    midiLoadFailed(filename:string):void{
        console.log(this.name + " failed to load file : "+ filename)
        this.fileLoaded =false;
    }

    readMidi(){
        this.movementMidiControllers[this.currentMovement][this.currentController].readMidi();
    }

    play():void{
        console.log(`${this.name} starting playback of movement ${this.currentMovement} -${this.currentController}`)
        let movementLength = this.movementMidiControllers[this.currentMovement].length;
        if (movementLength >0){
            if (this.currentController >=movementLength||this.currentController<0){
                this.currentController =0;
            }
            
            this.isPlaying = this.movementMidiControllers[this.currentMovement][this.currentController].start();;
        }
    }

    setBPM(bpm){
        for(let key of Object.keys(this.movementMidiControllers)){  
            for (let c of this.movementMidiControllers[key]){
                c.setBPM(bpm)
            }
        }
    }

    getBeat():number{
        return this.movementMidiControllers[this.currentMovement][this.currentController].currentBeat;
    }

    getBeatTime():number{
        if (this.isPlaying)
            return this.movementMidiControllers[this.currentMovement][this.currentController].queuedTime;
        return -1
    }

    setBeatTime(bt):void{
        if (this.isPlaying)
            this.movementMidiControllers[this.currentMovement][this.currentController].queuedTime = bt;
    }
    
    stop():void{
        if (this.movementMidiControllers[this.currentMovement] &&  this.movementMidiControllers[this.currentMovement][this.currentController]){
            this.movementMidiControllers[this.currentMovement][this.currentController].stop();
        }
        this.isPlaying = false;
    }
    
    loopCallback():void{
        this.currentController +=1;
        this.play();
    }
} 
