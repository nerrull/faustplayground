/// <reference path="../midi/MidiManager.ts"/>


//Todo, delete callback targets on cable deletion
class InstrumentController{
    name: string;
    //Dict of loaded midi files
    midiControllers : {[id:string] : MIDIManager};

    movementMidiFiles : {[id:number] : string[]};
    movementProbabilities : {[id:number] : number[]};

    fileLoaded : boolean;
    numbars : number;
    mIdx : number ;
    pIdx : number;
    connectors : Connector[];
    isPlaying :boolean;
    callbackTargets : {[patchID:string] : Function};   

    
    constructor(name:string, n_movements:number){
        this.name = name;
        this.fileLoaded = false;
        this.movementMidiFiles ={}// {number: MIDIManager[]}
        this.midiControllers = {}
        this.movementProbabilities = {};
        this.mIdx = 0;
        this.pIdx = 0;
        this.isPlaying = false;
        this.callbackTargets ={};
        this.connectors = [];
        for(let i =0; i <n_movements; i++){
            this.movementMidiFiles[i] = []
            this.movementProbabilities[i] = []
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

    loadMidi(file, movement, prob){
        console.log(`${this.name} - loading ${file}`)

        this.movementMidiFiles[movement].push(file);
        this.movementProbabilities[movement].push(prob);
        if (file in this.midiControllers){
            console.log(`${this.name} - already has midi controller for ${file}`)
            return;
        }
        let m = new MIDIManager((midiInfo)=>this.midiCallback(midiInfo));
        m.instrumentName = this.name;
        m.loadFile(file, (file) =>{this.midiLoaded(file)},null, (file)=> (this.midiLoadFailed(file)))
        this.midiControllers[file] = m;
    }
    
    midiLoaded(filename:string):void{
        console.log(this.name + " successfully loaded file : "+ filename)
        this.fileLoaded =true;
    }
    
    midiLoadFailed(filename:string):void{
        console.log(this.name + " failed to load file : "+ filename)
        this.fileLoaded =false;
    }

    readMidi(globalBeat:number, globalBeatTime:number, BPM: number){
        this.midiControllers[this.movementMidiFiles[this.mIdx][this.pIdx]]
            .scheduleNextMidiEvents(globalBeat, globalBeatTime, BPM);
    }

    play():void{

        let movementLength = this.movementMidiFiles[this.mIdx].length;
        if (movementLength >0){
            if (this.pIdx >=movementLength||this.pIdx<0){
                this.pIdx =0;
            }
            let midifile  =this.movementMidiFiles[this.mIdx][this.pIdx];
            console.log(`${this.name} starting playback of movement ${this.mIdx} -${this.pIdx} - ${midifile}`)
            this.isPlaying =  this.midiControllers[midifile].start(0);
        }
    }

    playMovement(movement:number, startBeat:number ):void{
        //stop previous piece
        if (this.isPlaying) this.stop(true);   

        //Set movement index and reset controller index
        this.mIdx = movement;
        this.pIdx =0;

        //If no pieces for this movement return
        if (this.movementMidiFiles[this.mIdx].length ==0) return;

        let midifile  =this.movementMidiFiles[this.mIdx][this.pIdx];
        console.log(`${this.name} starting playback of movement ${this.mIdx} -${this.pIdx} - ${midifile} at  beat ${startBeat}`)
        this.isPlaying =  this.midiControllers[midifile].start(startBeat);
        
    }
    
    playPiece(piece:number, startBeat:number):void{
        //stop previous playing piece
        if (this.isPlaying) this.stop();

        //If no pieces for this movement return
        let movementLength =this.movementMidiFiles[this.mIdx].length;
        if (movementLength==0) return;

        //clamp piece index
        this.pIdx = Math.max(Math.min(piece, movementLength),0);

        //Play next piece
        let midiFile = this.movementMidiFiles[this.mIdx][this.pIdx];
        console.log(`${this.name} - movement ${this.mIdx} - playing piece ${piece} (${midiFile}) - at beat ${startBeat}`);
        let c =  this.midiControllers[midiFile];
        this.isPlaying =c.start(startBeat);
    }

    getBeat():number{
        return this.midiControllers[this.movementMidiFiles[this.mIdx][this.pIdx]].currentBeat;
    }

    getBeatTime():number{
        if (this.isPlaying)
            return this.midiControllers[this.movementMidiFiles[this.mIdx][this.pIdx]].queuedTime;
        return -1
    }

    setBeatTime(bt):void{
        if (this.isPlaying)
        this.midiControllers[this.movementMidiFiles[this.mIdx][this.pIdx]] = bt;
    }
    
    stop(resetLoops:boolean  = false ):void{
        if (this.movementMidiFiles[this.mIdx] &&  this.movementMidiFiles[this.mIdx][this.pIdx]){
            let midifile =this.movementMidiFiles[this.mIdx][this.pIdx];
            console.log(`${this.name} - movement ${this.mIdx} - stopping piece ${this.pIdx} (${midifile}) `)
            this.midiControllers[midifile].stop(resetLoops);
        }
        this.isPlaying = false;
    }
    
    loopCallback():void{
        this.pIdx +=1;
        this.pIdx = this.pIdx% Object.keys(this.movementMidiFiles).length;
        this.play();
    }

    isAboutToLoop():boolean{
        let c = this.midiControllers[this.movementMidiFiles[this.mIdx][this.pIdx]];
        return c.isLooping;
    }

    getNextRandomPiece(currentBeat:number):void {
        var probs : number[] = this.movementProbabilities[this.mIdx];
        var total_prob = probs.reduce(getSum, 0);
        var rand = Math.random()*total_prob;
        var sum = 0;
        var nextPiece =0;

        while(sum <= rand && nextPiece< probs.length){
            sum += probs[nextPiece];
            nextPiece++;
        }
        nextPiece -=1;

        var startBeat = currentBeat + this.getBeatOffsetFromPieceEnd(currentBeat);

        if (this.pIdx == nextPiece){
            console.log(`${this.name}- Next piece is same as current piece - just call start to set new startbeat`)
            let midiFile = this.movementMidiFiles[this.mIdx][this.pIdx];
            this.midiControllers[midiFile].start(startBeat);
        }
        else{
            this.playPiece(nextPiece, startBeat);
        }
    }

    getBeatOffsetFromPieceEnd(currentBeat :number):number {
        if(!this.isPlaying) return 0;
        let c= this.midiControllers[this.movementMidiFiles[this.mIdx][this.pIdx]];
        return c.getBeatOffsetFromEnd(currentBeat);
    }

    getNumberOfLoops():number{
        var numloops = 0;
        for (let file  of this.movementMidiFiles[this.mIdx]){
            numloops += this.midiControllers[file].numLoops;
        }
        return numloops;
    }
} 
    
function getSum(total, num) {
    return total + num;
  }
  