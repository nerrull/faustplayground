
///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Grain Generator.
// Another granular synthesis example.
// This one is not finished, but ready for more features and improvements...
//
// TODO : set write index to 0 when record is pressed
// TODO : Window types
// TODO : Variable table size?
// TODO : Variable voices?
///////////////////////////////////////////////////////////////////////////////////////////////////
//
// ANALOG IN:
// ANALOG 0 : Population: 0=almost nothing. 1=Full grain
// ANALOG 1 : Depth of each grin, in ms.
// ANALOG 2 : Position in the table = delay 
// ANALOG 3 : Speed = pitch change of the grains
// ANALOG 4 : Feedback
//
///////////////////////////////////////////////////////////////////////////////////////////////////

import("all.lib");

// FOR 4 grains - MONO

// UI //////////////////////////////////////////
popul = 1 - hslider("population[BELA: ANALOG_0]", 1, 0, 1, 0.001);  // Coef 1= maximum; 0 = almost nothing (0.95)
taille = hslider("taille[BELA: ANALOG_1]", 100, 4, 400, 0.001 );        // Size in millisecondes


decal = 1 - hslider("decal[BELA: ANALOG_2]",0,0,1,0.001);               // read position compared to table srite position

speed = hslider("speed[BELA: ANALOG_3]", 1, 0.125, 10, 0.001);
feedback = hslider("feedback[BELA: ANALOG_4]",0,0,2,0.001); 
record = button("[1]Record") : int;
sample_start_sec = hslider("sample start",0,0,1,.001); 
sample_head = hslider("sample head incremnt",0,-3,3,.001); 

random_spread = hslider("random spread",0,0,.1,.001); 

random_number_trigger(trig) = select2(trig<1)(no.multirandom(1)/2147483647.0)~_;

increment_trigger(trig) = 0,1: select2(trig):_;

freq = 1000/taille;
tmpTaille = taille*ma.SR/ 1000;

clocSize = int(tmpTaille + (tmpTaille*popul*10)); // duration between 2 clicks

// CLK GENERAL /////////////////////////////////
// 4 clicks vers 4 generateurs de grains.
// (idem clk freq/4 et un compteur...)
// Each click is delayed by clocSize/3 and lasts 10 frames
detect1(x) = select2 (x < 10, 0, 1);
detect2(x) = select2 (x > clocSize*1/4, 0, 1) : select2 (x < (clocSize*1/4)+10, 0, _);
detect3(x) = select2 (x > clocSize*2/4, 0, 1) : select2 (x < (clocSize*2/4)+10, 0, _);
detect4(x) = select2 (x > clocSize*3/4, 0, 1) : select2 (x < (clocSize*3/4)+10, 0, _);
cloc = (%(_,clocSize))~(+(1)) <: (detect1: trig),(detect2: trig),(detect3: trig),(detect4: trig);

// SIGNAUX Ctrls Player ////////////////////////
trig = _<:_,mem: >;
envelop = *(2*PI):+(PI):cos:*(0.5):+(0.5);

rampe(f, t) = delta : (+ : select2(t,_,delta<0) : max(0)) ~ _ : raz
    with {
        raz(x) = select2 (x > 1, x, 0);
        delta = sh(f,t)/ma.SR;
        sh(x,t) = ba.sAndH(t,x);
    };

rampe2(speed, t) = delta : (+ : select2(t,_,delta<0) : max(0)) ~ _ 
    with {
        delta = sh(speed,t);
        sh(x,t) = ba.sAndH(t,x);
    };

// RWTable //////////////////////////////////////
unGrain(input, clk, offset) = (linrwtable( wf , rindex) : *(0.2 * EnvGrain))
    with {
        SR = 44100;
  		buffer_sec = 4; 
        size = int(SR * buffer_sec);
        init = 0.;

        EnvGrain = clk : (rampe(freq) : envelop);   
		start_idx = int(sample_start_sec*size);

        windex = (%(_,size) ) ~ ( +(1) );
        //windex = (%(_,end_idx) +start_idx ) ~ ( +(1) );
  		r_index = (%(_,size))  ~ (+(sample_head*increment_trigger(clk)*taille*ma.SR/1000));
  
		//increment_trigger(clk)*taille*ma.SR/1000
        posTabl = int(ba.sAndH(clk, windex));
  
        //rindex = %(int(rampe2(speed, clk)) + posTabl + int(size * decal), size);
  		random_offset =random_number_trigger(clk)*size*random_spread;
        //rindex = %(int(rampe2(speed, clk)+start_idx+random_offset) , size);
  
        rindex = %(int(rampe2(speed, clk)+r_index+random_offset) , size);

        wf = size, init, int(windex) *record, input;
    };

// LINEAR_INTERPOLATION_RWTABLE //////////////////////////////////
// read rwtable with linear interpolation
// wf : waveform to read ( wf is defined by (size_buffer, init, windex, input ))
// x  : position to read (0 <= x < size(wf)) and float
// nota: rwtable(size, init, windex, input, rindex)

linrwtable(wf,x) = linterpolation(y0,y1,d)
    with {
        x0 = int(x);                //
        x1 = int(x+1);              //
        d  = x-x0;
        y0 = rwtable(wf,x0);        //
        y1 = rwtable(wf,x1);        //
        linterpolation(v0,v1,c) = v0*(1-c)+v1*c;
    };


// FINALISATION /////////////////////////////////////////////////////////////////////////////////////
routeur (a, b, c, d, e) = a, b, 0, a, c, 0, a, d, 0, a, e,0;

processus = _ , cloc : routeur : (unGrain, unGrain, unGrain, unGrain) :> fi.dcblockerat(20);
process = _,_: ((+(_,_) :processus) ~(*(feedback))),((+(_,_) :processus) ~(*(feedback)));

//process = _, ((%(_,clocSize))~(+(1)):(detect1: trig)): unGrain:fi.dcblockerat(20);