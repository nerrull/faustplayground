/*
Adapted from Midi player by mudcube
----------------------------------------------------------
MIDI.Player : 0.3.1 : 2015-03-26

----------------------------------------------------------
https://github.com/mudcube/MIDI.js
----------------------------------------------------------
*/


/// <reference path="./jasmid/replayer.ts" />
/// <reference path="./jasmid/midifile.ts" />

function clamp(min, max, value) {
	return (value < min) ? min : ((value > max) ? max : value);
};


interface ScheduledNoteData{
    beat_duration:number
    scheduled_delay:number
    queue_time:number
}

class MIDIManager{

    //to type eventually
    filename: string;
    replayer : any;
    data: any;
    currentData:any;
    eventQueue: any;
    noteRegistrar:any; // get event for requested note
    scheduledNotes:any;

    //timing parameters
    currentTime : number;
    endTime: number; 
    

    //read loop parameters
    currentMidiMessageIndex :number;
    readMessageMinInterval : number;
    lastReadMessageTime : number;


    restart : number; 
    playing : boolean;
    timeWarp : number;
    startDelay : number;
    BPM : number;

    currentBeat: number; 
    queuedTime : number; // measures at what point of time we are at in the queue
    startTime : number; // to measure time elapsed
    MIDIOffset: number;

    onMidiEvent : Function  // listener
    
    api:string;
    cacheLoaded:boolean;

    
    constructor( midiCallback:Function){
        this.api = "webaudio"
        this.currentTime = 0;
        this.endTime = 0; 
        this.restart = 0; 
        this.playing = false;
        this.timeWarp = 1;
        this.startDelay = 0;
        this.BPM = 120;
        this.MIDIOffset = 0;

        this.readMessageMinInterval = 200; //200 ms
        
        this.eventQueue = []; // hold events to be triggered
        this.queuedTime =0; // 
        this.startTime = 0; // to measure time elapse
        this.noteRegistrar = {}; // get event for requested note
        this.onMidiEvent=midiCallback
        this.currentMidiMessageIndex =0;
        this.cacheLoaded = false;
        this.currentBeat = 0;
        this.scheduledNotes= [];
    }
    setBPM(bpm){
        this.BPM = bpm;
        //update queued time to match new BPM
        // if (this.scheduledNotes.length >0){
        //     let note_info : ScheduledNoteData;
        //     for (note_info of this.scheduledNotes){
        //         this.queuedTime -=note_info.scheduled_delay
        //         this.queuedTime += AudioUtils.beatsToSeconds(note_info.beat_duration, this.BPM);
        //     }
        // }
    }

    start(onsuccess =null):boolean {
        this.stop();
        console.log("Starting midi playback of " + this.filename)
        //this.currentTime = clamp(0, this.getLength(), this.currentTime);
        this.playing = true;
        return this.startAudio(this.currentTime, this.cacheLoaded, onsuccess);
    };
    
    resume(onsuccess): void {
        if (this.currentTime < -1) {
            this.currentTime = -1;
        }
        this.startAudio(this.currentTime,  this.cacheLoaded, onsuccess);
    };
    
    pause():void {
        console.log("Pausing midi playback of " + this.filename)
        var tmp = this.restart;
        this.stopAudio();
        this.restart = tmp;
    };
    
    stop() :void{
        console.log("Stopping midi playback of " + this.filename)

        this.stopAudio();
        this.scheduledNotes = []
        this.restart = 0;
        this.currentTime = 0;
        this.currentMidiMessageIndex = 0;
    };
    
    addListener(listenerCallback:Function):void {
        this.onMidiEvent = listenerCallback;
    };
    
    removeListener():void {
        this.onMidiEvent = undefined;
    };
    
    
    loadMidiFile(data, onsuccess, onprogress, onerror):void {
        try {
            this.currentData = data;
            this.replayer = Replayer(MidiFile(this.currentData), this.timeWarp, null, this.BPM);
            this.data = this.replayer.getData();
            this.endTime = this.getLength();
            //onsuccess()
            ///
            // MIDI.loadPlugin({
            //     // 			instruments: midi.getFileInstruments(),
            //     onsuccess: onsuccess,
            //     onprogress: onprogress,
            //     onerror: onerror
            // });
        } catch(event) {
            onerror && onerror(event);
        }
    };
    
    loadFile(file, onsuccess, onprogress, onerror):void {
        this.filename = file;
        this.stop();
        if (file.indexOf('base64,') !== -1) {
            var data = window.atob(file.split(',')[1]);
            onsuccess(file)
            this.loadMidiFile(data, onsuccess, onprogress, onerror);
        } else {
            var fetch = new XMLHttpRequest();
            var self = this;
            fetch.open('GET', file);
            fetch.overrideMimeType('text/plain; charset=x-user-defined');
            fetch.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        var t = this.responseText || '';
                        var ff = [];
                        var mx = t.length;
                        var scc = String.fromCharCode;
                        for (var z = 0; z < mx; z++) {
                            ff[z] = scc(t.charCodeAt(z) & 255);
                        }
                        ///
                        var data = ff.join('');
                        self.loadMidiFile(data, onsuccess, onprogress, onerror);
                    } else {
                        onerror(file) && onerror('Unable to load MIDI file');
                    }
                }
            };
            fetch.send();
        }
    };   
    
    
    
    // getFileInstruments():void {
    //     var instruments = {};
    //     var programs = {};
    //     for (var n = 0; n < this.data.length; n ++) {
    //         var event = this.data[n][0].event;
    //         if (event.type !== 'channel') {
    //             continue;
    //         }
    //         var channel = event.channel;
    //         switch(event.subtype) {
    //             case 'controller':
    //             //				console.log(event.channel, MIDI.defineControl[event.controllerType], event.value);
    //             break;
    //             case 'programChange':
    //             programs[channel] = event.programNumber;
    //             break;
    //             case 'noteOn':
    //             var program = programs[channel];
    //             var gm = MIDI.GM.byId[isFinite(program) ? program : channel];
    //             instruments[gm.id] = true;
    //             break;
    //         }
    //     }
    //     var ret = [];
    //     for (var key in instruments) {
    //         ret.push(key);
    //     }
    //     return ret;
    // };
    
    processMidi(data){
        // this.scheduledNotes.shift();
        if (data.message === 128) {
            delete this.noteRegistrar[data.note];
        } else {
            this.noteRegistrar[data.note] = data;
        }
        if (this.onMidiEvent) {
            this.onMidiEvent(data);
        }
        
        this.currentTime = data.currentTime;
        ///
        this.eventQueue.shift();
        ///
        // if (this.eventQueue.length < 2) {
        //     this.startAudio(this.queuedTime, true);
        // } 
        // else if (this.currentTime > (this.lastReadMessageTime - this.readMessageMinInterval)) { // grab next sequence
        //     this.startAudio(this.queuedTime, true);
        // }
    }
    
    scheduleTracking(channel, note, currentTime, endTime, offset, message, velocity) {
        //console.log(`${this.getContext().currentTime} - Midi event queued in ${currentTime -offset}  `)

        return setTimeout( () => {
            var data = {
                channel: channel,
                note: note,
                now: currentTime,
                end: endTime,
                message: message,
                velocity: velocity
            }
            this.processMidi(data);
        }, (currentTime - offset)*1000);
    };

    //read midi data and schedule note events
    readMidi():void{

        var note;
        var offset = 0;//keeps track of where we are relative to current timestep
        var messages = 0;
        var ctx = this.getContext();

        //var length = this.data.length;
        //var interval = this.eventQueue[0] && this.eventQueue[0].interval || 0;


        //time relative to start
        this.currentTime = ctx.currentTime - this.startTime;
        var offset =  this.queuedTime;
        //console.log(`1. Start time ${this.startTime}, play time ${this.currentTime}, loop time ${this.queuedTime}  `)
        while (this.queuedTime <= this.currentTime + this.readMessageMinInterval*2/1000.) {
            var obj = this.data[this.currentMidiMessageIndex ];
            //var midi_time = obj[1];
            var midi_beats = obj[2];
            var note_s = AudioUtils.beatsToSeconds(midi_beats,this.BPM);
            
            this.currentBeat += AudioUtils.floorBPM(midi_beats);
            this.currentMidiMessageIndex +=1;
            if (this.currentMidiMessageIndex >= this.data.length){
                console.log(`${this.filename} LOOPING`)
                this.currentBeat =0;
            }
            this.currentMidiMessageIndex = this.currentMidiMessageIndex %this.data.length;

            //update queued time 
            this.queuedTime += note_s

            //Skip notes we were too late to read
            if (this.queuedTime < this.currentTime) {
                console.log(`missed midi message ${obj[0].event.subtype}`)
                offset = this.queuedTime;
                continue;
            }

            //update current time
            //currentTime = this.queuedTime - offset;
            var event = obj[0].event;
            if (event.type !== 'channel') {
                console.log(`dropped midi message ${event.subtype}`)
                continue;
            }
            var channelId = event.channel;
            //var channel = MIDI.channels[channelId];

            // var delay = ctx.currentTime + ((currentTime + foffset + this.startDelay) / 1000);

            var queueTime = this.queuedTime - offset + this.startDelay;
            offset = 0;
            var eventTime =this.queuedTime - this.currentTime;
            //var note_data = {queue_time: this.queuedTime, beat_duration:midi_beats, scheduled_delay:eventTime };
            switch (event.subtype) {
                case 'noteOn':
                //if (channel.mute) break;
                note = event.noteNumber - (this.MIDIOffset || 0);
                // this.scheduledNotes.push(note_data);

                this.eventQueue.push({
                    event: event,
                    time: queueTime,
                    //source: MIDI.noteOn(channelId, event.noteNumber, event.velocity, delay),
                    interval: this.scheduleTracking(channelId, note, eventTime ,this.endTime, offset, 144, event.velocity)
                });
                messages++;
                break;
                case 'noteOff':
                //if (channel.mute) break;
                // note = event.noteNumber - (this.MIDIOffset || 0);
                // this.eventQueue.push({
                //     event: event,
                //     time: queueTime,
                //     //source: MIDI.noteOff(channelId, event.noteNumber, delay),
                //     interval: this.scheduleTracking(channelId, note, eventTime, this.endTime, offset , 128, 0)
                // });
                break;
                case 'controller':
                // MIDI.setController(channelId, event.controllerType, event.value, delay);
                break;
                case 'programChange':
                // MIDI.programChange(channelId, event.programNumber, delay);
                break;
                case 'pitchBend':
                // MIDI.pitchBend(channelId, event.value, delay);
                break;
                default:
                break;
            }
        }
        //console.log(`${this.filename} Start time ${this.startTime}, play time ${this.currentTime}, loop time ${this.queuedTime}  `)

    }
    
    // Playing the audio
    startAudio(currentTime, fromCache, onsuccess=null) {
        if (!this.replayer) {
            return;
        }
        if (!fromCache) {
            if (typeof currentTime === 'undefined') {
                currentTime = this.restart;
            }
            ///
            this.playing && this.stopAudio();
            this.playing = true;
            this.data = this.replayer.getData();
            this.endTime = this.getLength();
            this.cacheLoaded = true;
        }
        if (this.endTime <this.readMessageMinInterval){
            console.log(`${this.filename} is too short, aborting`)
            this.stop();
            return false;
        }
        this.startTime = this.getContext().currentTime;
        this.queuedTime = 0;   
        this.currentBeat = 0;
        return true;
        
        // ///
        // onsuccess && onsuccess(this.eventQueue); 
    };
    
    stopAudio():void {
        var ctx = this.getContext();
        this.playing = false;
        this.currentMidiMessageIndex = 0;
        this.restart += (ctx.currentTime - this.startTime) * 1000;
        // stop the audio, and intervals
        while (this.eventQueue.length) {
            var o = this.eventQueue.pop();
            window.clearInterval(o.interval);
            if (!o.source) continue; // is not webaudio
            o.source.disconnect(0);
        }
        
        // run callback to cancel any notes still playing
        for (var key in this.noteRegistrar) {
            var o = this.noteRegistrar[key]
            if (this.noteRegistrar[key].message === 144 && this.onMidiEvent) {
                this.onMidiEvent({
                    channel: o.channel,
                    note: o.note,
                    now: o.now,
                    end: o.end,
                    message: 128,
                    velocity: o.velocity
                });
            }
        }
        // reset noteRegistrar
        this.noteRegistrar = {};
    };
    
    
    getContext() :AudioContext {
        return Utilitary.audioContext;
    };
    
    
    getLength() {
        var data =  this.data;
        var length = data.length;
        var totalTime = 0.5;
        for (var n = 0; n < length; n++) {
            totalTime += data[n][1];
        }
        return totalTime;
    };
    
    beatsToSeconds(beats){
        return beats /(this.BPM/60)
    }
};

