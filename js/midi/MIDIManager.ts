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

class MIDIManager{

    //to type eventually
    filename: string;
    replayer : any;
    data: any;
    currentData:any;
    eventQueue: any;
    noteRegistrar:any; // get event for requested note

    currentTime : number;
    endTime: number; 
    restart : number; 
    playing : boolean;
    timeWarp : number;
    startDelay : number;
    BPM : number;
    queuedTime : number; // 
    startTime : number; // to measure time elapse
    MIDIOffset: number
   
    onMidiEvent : Function  // listener
    
    api:string;

    
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
        
        this.eventQueue = []; // hold events to be triggered
        this.queuedTime =0; // 
        this.startTime = 0; // to measure time elapse
        this.noteRegistrar = {}; // get event for requested note
        this.onMidiEvent=midiCallback
    }

    start(onsuccess =null) {
        console.log("Starting midi playback of " + this.filename)
        this.currentTime = clamp(0, this.getLength(), this.currentTime);
        this.startAudio(this.currentTime, null, onsuccess);
    };
    
    resume(onsuccess): void {
        if (this.currentTime < -1) {
            this.currentTime = -1;
        }
        this.startAudio(this.currentTime, null, onsuccess);
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
        this.restart = 0;
        this.currentTime = 0;
    }
    
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
        if (this.eventQueue.length < 1000) {
            this.startAudio(this.queuedTime, true);
        } else if (this.currentTime === this.queuedTime && this.queuedTime < this.endTime) { // grab next sequence
            this.startAudio(this.queuedTime, true);
        }
    }
    
    scheduleTracking(channel, note, currentTime, endTime, offset, message, velocity) {
        
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
        }, currentTime - offset);
    };
    
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
        }
        
        ///
        var note;
        var offset = 0;
        var messages = 0;
        var data = this.data;
        var ctx = this.getContext();
        var length = data.length;
        //
        this.queuedTime = 0.5;
        ///
        var interval = this.eventQueue[0] && this.eventQueue[0].interval || 0;
        var foffset = currentTime - this.currentTime;
        
        // ///
        // if (this.api !== 'webaudio') { // set currentTime on ctx
        //     var now = getNow();
        //     __now = __now || now;
        //     ctx.currentTime = (now - __now) / 1000;
        // }
        ///
        this.startTime = ctx.currentTime;
        ///
        for (var n = 0; n < length && messages < 100; n++) {
            var obj = data[n];
            if ((this.queuedTime += obj[1]) <= currentTime) {
                offset = this.queuedTime;
                continue;
            }
            ///
            currentTime = this.queuedTime - offset;
            ///
            var event = obj[0].event;
            if (event.type !== 'channel') {
                continue;
            }
            
            //var channelId = event.channel;
            // var channel = MIDI.channels[channelId];
            let channelId = 0
            var delay = ctx.currentTime + ((currentTime + foffset + this.startDelay) / 1000);
            var queueTime = this.queuedTime - offset + this.startDelay;
            switch (event.subtype) {
                case 'noteOn':
                //if (channel.mute) break;
                note = event.noteNumber - (this.MIDIOffset || 0);
                this.eventQueue.push({
                    event: event,
                    time: queueTime,
                    //source: MIDI.noteOn(channelId, event.noteNumber, event.velocity, delay),
                    interval: this.scheduleTracking(channelId, note, this.queuedTime + this.startDelay,this.endTime, offset - foffset, 144, event.velocity)
                });
                messages++;
                break;
                case 'noteOff':
                //if (channel.mute) break;
                note = event.noteNumber - (this.MIDIOffset || 0);
                this.eventQueue.push({
                    event: event,
                    time: queueTime,
                    //source: MIDI.noteOff(channelId, event.noteNumber, delay),
                    interval: this.scheduleTracking(channelId, note, this.queuedTime, this.endTime, offset - foffset, 128, 0)
                });
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
        ///
        onsuccess && onsuccess(this.eventQueue); 
    };
    
    stopAudio():void {
        var ctx = this.getContext();
        this.playing = false;
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
    
    
    getNow():number {
        if (window.performance && window.performance.now) {
            return window.performance.now();
        } else {
            return Date.now();
        }
    };
};

