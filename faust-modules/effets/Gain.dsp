declare name "Gain";
declare author "GRAME";

/* ========== DESCRITPION ===========

- Simple volume slider
- Head = Silence
- Bottom = Max volume

*/

import("stdfaust.lib");

process = par(i,2,*(hslider("Volume[acc:2 0 -10 0 10]", 0.75, 0, 4, 0.01):si.smooth(0.999)));
