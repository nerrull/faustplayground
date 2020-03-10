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


interface ScheduledNoteData {
    beat_duration: number
    scheduled_delay: number
    queue_time: number
}

class MIDIManager {

    //to type eventually
    filename: string;
    replayer: any;
    data: TemporalMidi[];
    currentData: any;
    eventQueue: any;
    noteRegistrar: any; // get event for requested note
    scheduledNotes: any;

    //timing parameters
    currentTime: number;
    endTime: number;


    //read loop parameters
    currentMidiMessageIndex: number;
    readMessageMinInterval: number;
    lastReadMessageTime: number;


    restart: number;
    playing: boolean;
    timeWarp: number;
    startDelay: number;
    BPM: number;

    nextMidiEvent: TemporalMidi;

    totalBeats: number;
    currentBeat: number;
    queuedTime: number; // measures at what point of time we are at in the queue
    startTime: number; // to measure time elapsed
    MIDIOffset: number;

    onMidiEvent: Function  // listener

    api: string;
    cacheLoaded: boolean;
    instrumentName: string;

    constructor(midiCallback: Function) {
        this.api = "webaudio"
        this.currentTime = 0;
        this.endTime = 0;
        this.restart = 0;
        this.playing = false;
        this.timeWarp = 1;
        this.startDelay = 0;
        this.MIDIOffset = 0;
        this.numLoops =0;

        this.readMessageMinInterval = 200; //200 ms

        this.eventQueue = []; // hold events to be triggered
        this.queuedTime = 0; // 
        this.startTime = 0; // to measure time elapse
        this.noteRegistrar = {}; // get event for requested note
        this.onMidiEvent = midiCallback
        this.currentMidiMessageIndex = 0;
        this.cacheLoaded = false;
        this.currentBeat = 0;
        this.scheduledNotes = [];
        this.instrumentName = "noname"
    }


    addListener(listenerCallback: Function): void {
        this.onMidiEvent = listenerCallback;
    };

    removeListener(): void {
        this.onMidiEvent = undefined;
    };


    loadMidiFile(data, onsuccess, onprogress, onerror): void {
        try {
            this.currentData = data;
            this.readData(data);
            //onsuccess()
            ///
            // MIDI.loadPlugin({
            //     // 			instruments: midi.getFileInstruments(),
            //     onsuccess: onsuccess,
            //     onprogress: onprogress,
            //     onerror: onerror
            // });
        } catch (event) {
            onerror && onerror(event);
        }
    };

    readData(midiData) {
        this.replayer = new Replayer(MidiFile(midiData), this.timeWarp, null, 120, this.filename);
        this.data = this.replayer.getData();
        this.totalBeats = this.getTotalBeats();
    }

    loadFile(file, onsuccess, onprogress, onerror): void {
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
            fetch.onreadystatechange = function () {
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

    processMidi(data) {
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
    }

    scheduleNote(channel, note, eventTime, nowTime, endTime, message, velocity) {
        //console.log(`${this.getContext().currentTime} - Midi event queued in ${currentTime -offset}  `)

        return setTimeout(() => {
            var data = {
                channel: channel,
                note: note,
                now: nowTime,
                end: endTime,
                message: message,
                velocity: velocity
            }
            this.processMidi(data);
        }, eventTime * 1000);
    };

    isLooping: boolean;
    numLoops: number = 0;
    startBeat: number =0;

    scheduleNextMidiEvents(globalBeat: number, globalBeatCallTime: number, BPM: number) {
        //console.log(`${this.instrumentName} - Start beat ${this.startBeat} global  beat  ${globalBeat}`);

        //Wait until beat is same is start beat
        if (globalBeat <this.startBeat){
            //console.log(`${this.instrumentName} -  ${this.filename} - waiting for start beat ${this.startBeat}`)
            return;
        }

        var ctx = this.getContext();
        var beatsToBuffer = 2;
        this.currentTime = ctx.currentTime;

        //get time offset from when function was called
        //Will be substracted from scheduled delay

        var offset: number = ctx.currentTime - globalBeatCallTime;

        // Current playing beat relative to internal beat clock
        var relativeStartBeat: number = (globalBeat- this.startBeat) % this.totalBeats;// - loop_offset;
        // Last beat that would be scheduled relative to internal beat clock
        var relativeEndBeat: number = (globalBeat- this.startBeat + beatsToBuffer) % this.totalBeats;// - loop_offset;
        

        // if looped and we are out of "overlapping" state
        if (this.isLooping && (relativeStartBeat) <2){
            this.isLooping = false;
            console.log(`${this.instrumentName} - ${this.filename} - OUT OF LOOPED ZONE`)
        }

        //Reset loopflag
        var messageCount = 0;
        if(!this.nextMidiEvent ){
            console.log("BAD MIDIEVENT THIS IS BAD");
            return;
        }
        var eventBeat = this.nextMidiEvent.beat;


        // schedule midi events for next beatsToBuffer beats (at 120 bpm each beat is .5 s) - 2 beats : schedule approx 1 second ahead
        while ( (!this.isLooping && eventBeat <= (relativeStartBeat + beatsToBuffer)) || (this.isLooping && (eventBeat <relativeEndBeat))) {
            
            var event = this.nextMidiEvent.event.event;

            //only log and skip missed notes when not in weird part of looping state
            if  (!this.isLooping && eventBeat < relativeStartBeat ) {
                //console.log(`missed midi message ${event.subtype}`);
                //console.log(`missed midi message`);
                this.nextMidiEvent = this.getNextMidiEvent();
                eventBeat = this.nextMidiEvent.beat;
                continue;
            }


            if (!event || event.type !== 'channel') {
                this.nextMidiEvent = this.getNextMidiEvent();
                eventBeat = this.nextMidiEvent.beat;
                continue;
            }

            var channelId = event.channel;

            //Calculate how many ms to wait before trigggering midi note 
            if (this.isLooping && eventBeat <  relativeStartBeat){
                eventBeat +=this.totalBeats - this.currentBeat;
            }
            var beatOffsetSeconds = AudioUtils.beatsToSeconds(eventBeat - relativeStartBeat, BPM) - offset;
            this.currentBeat = this.nextMidiEvent.beat;

            switch (event.subtype) {
                case 'noteOn':
                    messageCount++;

                    //hack for silences
                    if (event.velocity >2){
                        var note = event.noteNumber - (this.MIDIOffset || 0);
                        this.eventQueue.push({
                            event: event,
                            time: beatOffsetSeconds,
                            //source: MIDI.noteOn(channelId, event.noteNumber, event.velocity, delay),
                            interval: this.scheduleNote(channelId, note, beatOffsetSeconds, this.currentTime, this.endTime, 144, event.velocity)
                        });
                    }
                    
                    break;
                default:
                    break;
            }

            this.nextMidiEvent = this.getNextMidiEvent();
            //for edge case when relativeBeat + schedule offset (16) > total beats
            eventBeat = this.nextMidiEvent.beat;

        }

       //console.log(`${this.instrumentName} - Scheduled ${messageCount} midi events - for beats [${relativeStartBeat.toPrecision(3)} - ${relativeEndBeat.toPrecision(3)}]/${this.totalBeats}`);

    }

    getNextMidiEvent(): TemporalMidi {
        this.currentMidiMessageIndex++;
        if(this.currentMidiMessageIndex ==this.data.length){
            console.log(`${this.instrumentName} - ${this.filename} - IN LOOP ZONE`)
            this.isLooping =true;
            this.numLoops ++;
        }
        this.currentMidiMessageIndex = this.currentMidiMessageIndex % this.data.length;
        return (this.data[this.currentMidiMessageIndex]);

    }

    
    start( startBeat:number ): boolean {
        this.startBeat = startBeat;
        this.isLooping = false;
        this.currentBeat = 0;
        this.currentMidiMessageIndex = 0;
        this.nextMidiEvent = this.data[0];
        //console.log("Starting midi playback of " + this.filename)
        this.playing =  this.startAudio( this.cacheLoaded);
        return this.playing;
    };

    // resume(onsuccess): void {
    //     if (this.currentTime < -1) {
    //         this.currentTime = -1;
    //     }
    //     this.startAudio(this.currentTime, this.cacheLoaded, onsuccess);
    // };

    pause(): void {
        console.log("Pausing midi playback of " + this.filename)
        var tmp = this.restart;
        this.stopAudio();
        this.restart = tmp;
    };

    stop(resetLoops =false, clearNotes=false): void {
        this.stopAudio(clearNotes);
        this.scheduledNotes = []
        this.restart = 0;
        this.currentTime = 0;
        this.currentBeat = 0;
        this.currentMidiMessageIndex = 0;
        this.isLooping = false;

        if (resetLoops){
            this.numLoops =0;
        }
    };

    // Playing the audio
    startAudio(fromCache):boolean {
        if (!this.replayer) {
            console.log("Replayer undefined - aborting")
            return false;
        }

        //why do this???
        if (!fromCache) {
            console.log(`${this.instrumentName} - ${this.filename} : Loading from cache `)

            this.playing && this.stopAudio();
            this.data = this.replayer.getData();
            this.totalBeats = this.getTotalBeats();
            this.cacheLoaded = true;
        }

        // Less than 4 beats to file- sign it's empty
        if (this.totalBeats < 3) {
            console.log(`${this.filename} is too short, aborting`)
            this.stop();
            return false;
        }

        return true;

        // ///
        // onsuccess && onsuccess(this.eventQueue); 
    };

    stopAudio(clearNotes =false): void {
        this.playing = false;

        // stop the audio, and intervals
        if(clearNotes){
            while (this.eventQueue.length) {
                var o = this.eventQueue.pop();
                window.clearInterval(o.interval);
                if (!o.source) continue; // is not webaudio
                o.source.disconnect(0);
            }
        }


        // // run callback to cancel any notes still playing
        // for (var key in this.noteRegistrar) {
        //     var o = this.noteRegistrar[key]
        //     if (this.noteRegistrar[key].message === 144 && this.onMidiEvent) {
        //         this.onMidiEvent({
        //             channel: o.channel,
        //             note: o.note,
        //             now: o.now,
        //             end: o.end,
        //             message: 128,
        //             velocity: o.velocity
        //         });
        //     }
        // }
        // reset noteRegistrar
        this.noteRegistrar = {};
    };

    resetLoops(){
        this.numLoops =0;
    }


    getContext(): AudioContext {
        return Utilitary.audioContext;
    };


    getTotalBeats() {
        var data = this.data;
        var length = data.length;
        var totalBeats = data[length - 1].beat;
        console.log(`Midi file length is ${totalBeats} beats long`);
        return totalBeats;
    };


    getBeats() {
        var data = this.data;
        var length = data.length;
        var totalTime = 0.5;
        for (var n = 0; n < length; n++) {
            totalTime += data[n][1];
        }
        return totalTime;
    };

    getBeatOffsetFromEnd(currentBeat:number):number{
        return  this.totalBeats - (currentBeat -this.startBeat) % this.totalBeats;
    }

};

