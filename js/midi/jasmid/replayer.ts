/// <reference path="./midifile.ts" />

function clone(o): any {
	if (typeof o != 'object') return (o);
	if (o == null) return (o);
	var ret = (typeof o.length == 'number') ? [] : {};
	for (var key in o) ret[key] = clone(o[key]);
	return ret;
};

class ReplayerMidiEvent {
	event : MidiEvent;
	ticksToEvent :number;
	track :number;
};

class TrackState {
	nextEventIndex : number;
	ticksToNextEvent: number;
};

class TemporalMidi {
	event : ReplayerMidiEvent;
	time: number;
	beatOffset: number;
	beat: number;
};

class Replayer {
	midiEvent: ReplayerMidiEvent[] = [];
	temporal: TemporalMidi[] = [];
	currentBeat: number = 0;

	ticksPerBeat: number;
	beatsPerMinute: number;
	timeWarp: number;
	bpmOverride: boolean;
	trackStates : TrackState[];
	midiFile:any;
	filename : string;

	constructor(midiFile, timeWarp, eventProcessor, bpm, filename){
		this.filename = filename;
		this.midiFile = midiFile;
		this.trackStates = [];
		this.beatsPerMinute = bpm ? bpm : 120;
		this.bpmOverride = bpm ? true : false;

		this.ticksPerBeat = midiFile.header.ticksPerBeat;

		for (var i = 0; i < midiFile.tracks.length; i++) {
			this.trackStates[i] = {
				'nextEventIndex': 0,
				'ticksToNextEvent': (
					midiFile.tracks[i].length ?
						midiFile.tracks[i][0].deltaTime :
						null
				)
			};
		}

		this.processEvents();

	}

	getData(): ReplayerMidiEvent[] {
		return clone(this.temporal);
	}

	processEvents(): any {
		var midiEvent: ReplayerMidiEvent  = this.getNextEvent();
		if (midiEvent) {
			while (midiEvent) { midiEvent=  this.processNext(midiEvent);}
		}

		var measurePosition = this.currentBeat % 4.0;
		if (measurePosition!=0.0){
			var diff = 4.0 - measurePosition;
			console.log(`padding with ${diff} beats`);
			this.currentBeat +=diff;
			var dummyEvent = this.temporal[this.temporal.length -1].event;
			dummyEvent.event.type="endOfTrack"
			this.temporal.push( {"event":dummyEvent, "time": 0, "beatOffset": diff, "beat": this.currentBeat});

		}
	};

	processNext(midiEvent : ReplayerMidiEvent) :ReplayerMidiEvent {
		if (!this.bpmOverride && midiEvent.event.type == "meta" && midiEvent.event.subtype == "setTempo") {
			// tempo change events can occur anywhere in the middle and affect events that follow
			var beatsPerMinute = 60000000 / midiEvent.event.microsecondsPerBeat;
		}
		///
		var beatsToGenerate = 0;
		var secondsToGenerate = 0;
		//some wierd messages have duration of 1 tick
		if (midiEvent.ticksToEvent > 1) {
			beatsToGenerate = midiEvent.ticksToEvent / this.ticksPerBeat;
			secondsToGenerate = beatsToGenerate / (beatsPerMinute / 60);
		}
		this.currentBeat = this.currentBeat + beatsToGenerate;
		//ignore meta events and controller events
		if(midiEvent.event.type =="meta" || 
			(midiEvent.event.type == "channel" &&( midiEvent.event.subtype =="controller" ||  midiEvent.event.subtype =="programChange"))){
			return this.getNextEvent();
		}
		///
		var time = (secondsToGenerate * 1000 * this.timeWarp) || 0;
		this.temporal.push( {"event":midiEvent, "time": time, "beatOffset": beatsToGenerate, "beat": this.currentBeat});
		return this.getNextEvent();
	};



	getNextEvent(): ReplayerMidiEvent {
		var ticksToNextEvent = null;
		var nextEventTrack = null;
		var nextEventIndex = null;

		for (var i = 0; i < this.trackStates.length; i++) {
			if (
				this.trackStates[i].ticksToNextEvent != null
				&& (ticksToNextEvent == null || this.trackStates[i].ticksToNextEvent < ticksToNextEvent)
			) {
				ticksToNextEvent = this.trackStates[i].ticksToNextEvent;
				nextEventTrack = i;
				nextEventIndex = this.trackStates[i].nextEventIndex;
			}
		}
		if (nextEventTrack != null) {
			/* consume event from that track */
			var nextEvent = this.midiFile.tracks[nextEventTrack][nextEventIndex];
			if (this.midiFile.tracks[nextEventTrack][nextEventIndex + 1]) {
				this.trackStates[nextEventTrack].ticksToNextEvent += this.midiFile.tracks[nextEventTrack][nextEventIndex + 1].deltaTime;
			} else {
				this.trackStates[nextEventTrack].ticksToNextEvent = null;
			}
			this.trackStates[nextEventTrack].nextEventIndex += 1;
			/* advance timings on all tracks by ticksToNextEvent */
			for (var i = 0; i < this.trackStates.length; i++) {
				if (this.trackStates[i].ticksToNextEvent != null) {
					this.trackStates[i].ticksToNextEvent -= ticksToNextEvent
				}
			}
			return {
				"ticksToEvent": ticksToNextEvent,
				"event": nextEvent,
				"track": nextEventTrack
			}
		} else {
			return null;
		}
	}
};

