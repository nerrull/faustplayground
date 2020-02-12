
// /// <reference path="../midifile/index.d.ts" />
// import  MidiFile from 'midifile';

declare module 'replayer' {
    function Replayer(midiFile: any, timeWarp:number, eventProcessor:any, bpm:number):any;
    export default Replayer;
}