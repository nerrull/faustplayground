//Accelerometer Class
/// <reference path="Utilitary.ts"/>
/// <reference path="Modules/FaustInterface.ts"/>
var Axis;
(function (Axis) {
    Axis[Axis["x"] = 0] = "x";
    Axis[Axis["y"] = 1] = "y";
    Axis[Axis["z"] = 2] = "z";
})(Axis || (Axis = {}));
;
var Curve;
(function (Curve) {
    Curve[Curve["Up"] = 0] = "Up";
    Curve[Curve["Down"] = 1] = "Down";
    Curve[Curve["UpDown"] = 2] = "UpDown";
    Curve[Curve["DownUp"] = 3] = "DownUp";
})(Curve || (Curve = {}));
;
var AccMeta = (function () {
    function AccMeta() {
    }
    return AccMeta;
}());
var AccelerometerSlider = (function () {
    function AccelerometerSlider(accParams) {
        if (accParams != null) {
            this.isEnabled = accParams.isEnabled;
            this.acc = accParams.acc;
            this.setAttributes(accParams.acc);
            this.address = accParams.address;
            this.min = accParams.min;
            this.max = accParams.max;
            this.init = accParams.init;
            this.label = accParams.label;
            //this.step = parseFloat(controler.step);
            //this.mySlider = controler.slider;
            //this.valueOutput = controler.output;
            this.isActive = Utilitary.isAccelerometerOn;
        }
    }
    AccelerometerSlider.prototype.setAttributes = function (fMetaAcc) {
        if (fMetaAcc != null) {
            var arrayMeta = fMetaAcc.split(" ");
            this.axis = parseInt(arrayMeta[0]);
            this.curve = parseInt(arrayMeta[1]);
            this.amin = parseInt(arrayMeta[2]);
            this.amid = parseInt(arrayMeta[3]);
            this.amax = parseInt(arrayMeta[4]);
        }
    };
    AccelerometerSlider.prototype.setAttributesDetailed = function (axis, curve, min, mid, max) {
        this.axis = axis;
        this.curve = curve;
        this.amin = min;
        this.amid = mid;
        this.amax = max;
    };
    return AccelerometerSlider;
}());
var AccelerometerHandler = (function () {
    function AccelerometerHandler() {
    }
    // get Accelerometer value
    AccelerometerHandler.prototype.getAccelerometerValue = function () {
        var _this = this;
        if (window.DeviceMotionEvent) {
            window.addEventListener("devicemotion", function (event) { _this.propagate(event); }, false);
        }
        else {
            // Browser doesn't support DeviceMotionEvent
            console.log(Utilitary.messageRessource.noDeviceMotion);
        }
    };
    // propagate the new x, y, z value of the accelerometer to the regisred object
    AccelerometerHandler.prototype.propagate = function (event) {
        var x = event.accelerationIncludingGravity.x;
        var y = event.accelerationIncludingGravity.y;
        var z = event.accelerationIncludingGravity.z;
        for (var i = 0; i < AccelerometerHandler.faustInterfaceControler.length; i++) {
            if (AccelerometerHandler.faustInterfaceControler[i].accelerometerSlider.isActive && AccelerometerHandler.faustInterfaceControler[i].accelerometerSlider.isEnabled) {
                this.axisSplitter(AccelerometerHandler.faustInterfaceControler[i].accelerometerSlider, x, y, z, this.applyNewValueToModule);
            }
        }
        if (AccelerometerHandler.faustInterfaceControlerEdit != null) {
            this.axisSplitter(AccelerometerHandler.faustInterfaceControlerEdit.accelerometerSlider, x, y, z, this.applyValueToEdit);
        }
    };
    //static registerAcceleratedSlider(fMetaAcc: string, module: ModuleClass, label: string, min: number, ivalue: number, max: number, step: number, slider: HTMLInputElement, valueOutput: HTMLElement, precision: number): AccelerometerSlider {
    AccelerometerHandler.registerAcceleratedSlider = function (accParams, faustInterfaceControler, sliderEdit) {
        var accelerometerSlide = new AccelerometerSlider(accParams);
        faustInterfaceControler.accelerometerSlider = accelerometerSlide;
        AccelerometerHandler.curveSplitter(accelerometerSlide);
        if (sliderEdit) {
            AccelerometerHandler.faustInterfaceControlerEdit = faustInterfaceControler;
        }
        else {
            AccelerometerHandler.faustInterfaceControler.push(faustInterfaceControler);
        }
    };
    AccelerometerHandler.prototype.axisSplitter = function (accelerometerSlide, x, y, z, callBack) {
        switch (accelerometerSlide.axis) {
            case Axis.x:
                var newVal = accelerometerSlide.converter.uiToFaust(x);
                callBack(accelerometerSlide, newVal, x);
                break;
            case Axis.y:
                var newVal = accelerometerSlide.converter.uiToFaust(y);
                callBack(accelerometerSlide, newVal, y);
                break;
            case Axis.z:
                var newVal = accelerometerSlide.converter.uiToFaust(z);
                callBack(accelerometerSlide, newVal, z);
                break;
        }
    };
    AccelerometerHandler.prototype.applyNewValueToModule = function (accSlid, newVal, axeValue) {
        accSlid.callbackValueChange(accSlid.address, newVal);
    };
    AccelerometerHandler.prototype.applyValueToEdit = function (accSlid, newVal, axeValue) {
        AccelerometerHandler.faustInterfaceControlerEdit.faustInterfaceView.slider.value = axeValue.toString();
    };
    AccelerometerHandler.curveSplitter = function (accelerometerSlide) {
        switch (accelerometerSlide.curve) {
            case Curve.Up:
                accelerometerSlide.converter = new AccUpConverter(accelerometerSlide.amin, accelerometerSlide.amid, accelerometerSlide.amax, accelerometerSlide.min, accelerometerSlide.init, accelerometerSlide.max);
                break;
            case Curve.Down:
                accelerometerSlide.converter = new AccDownConverter(accelerometerSlide.amin, accelerometerSlide.amid, accelerometerSlide.amax, accelerometerSlide.min, accelerometerSlide.init, accelerometerSlide.max);
                break;
            case Curve.UpDown:
                accelerometerSlide.converter = new AccUpDownConverter(accelerometerSlide.amin, accelerometerSlide.amid, accelerometerSlide.amax, accelerometerSlide.min, accelerometerSlide.init, accelerometerSlide.max);
                break;
            case Curve.DownUp:
                accelerometerSlide.converter = new AccDownUpConverter(accelerometerSlide.amin, accelerometerSlide.amid, accelerometerSlide.amax, accelerometerSlide.min, accelerometerSlide.init, accelerometerSlide.max);
                break;
            default:
                accelerometerSlide.converter = new AccUpConverter(accelerometerSlide.amin, accelerometerSlide.amid, accelerometerSlide.amax, accelerometerSlide.min, accelerometerSlide.init, accelerometerSlide.max);
        }
    };
    AccelerometerHandler.faustInterfaceControler = [];
    AccelerometerHandler.faustInterfaceControlerEdit = null;
    return AccelerometerHandler;
}());
var MinMaxClip = (function () {
    function MinMaxClip(x, y) {
        this.fLo = Math.min(x, y);
        this.fHi = Math.max(x, y);
    }
    MinMaxClip.prototype.clip = function (x) {
        if (x < this.fLo) {
            return this.fLo;
        }
        else if (x > this.fHi) {
            return this.fHi;
        }
        else {
            return x;
        }
    };
    return MinMaxClip;
}());
var Interpolator = (function () {
    function Interpolator(lo, hi, v1, v2) {
        this.range = new MinMaxClip(lo, hi);
        if (hi != lo) {
            //regular case
            this.fCoef = (v2 - v1) / (hi - lo);
            this.fOffset = v1 - lo * this.fCoef;
        }
        else {
            this.fCoef = 0;
            this.fOffset = (v1 + v2) / 2;
        }
    }
    Interpolator.prototype.returnMappedValue = function (v) {
        var x = this.range.clip(v);
        return this.fOffset + x * this.fCoef;
    };
    Interpolator.prototype.getLowHigh = function (amin, amax) {
        return { amin: this.range.fLo, amax: this.range.fHi };
    };
    return Interpolator;
}());
var Interpolator3pt = (function () {
    function Interpolator3pt(lo, mid, hi, v1, vMid, v2) {
        this.fSegment1 = new Interpolator(lo, mid, v1, vMid);
        this.fSegment2 = new Interpolator(mid, hi, vMid, v2);
        this.fMiddle = mid;
    }
    Interpolator3pt.prototype.returnMappedValue = function (x) {
        return (x < this.fMiddle) ? this.fSegment1.returnMappedValue(x) : this.fSegment2.returnMappedValue(x);
    };
    Interpolator3pt.prototype.getMappingValues = function (amin, amid, amax) {
        var lowHighSegment1 = this.fSegment1.getLowHigh(amin, amid);
        var lowHighSegment2 = this.fSegment2.getLowHigh(amid, amax);
        return { amin: lowHighSegment1.amin, amid: lowHighSegment2.amin, amax: lowHighSegment2.amax };
    };
    return Interpolator3pt;
}());
var AccUpConverter = (function () {
    function AccUpConverter(amin, amid, amax, fmin, fmid, fmax) {
        this.fActive = true;
        this.accToFaust = new Interpolator3pt(amin, amid, amax, fmin, fmid, fmax);
        this.faustToAcc = new Interpolator3pt(fmin, fmid, fmax, amin, amid, amax);
    }
    AccUpConverter.prototype.uiToFaust = function (x) { return this.accToFaust.returnMappedValue(x); };
    AccUpConverter.prototype.faustToUi = function (x) { return this.accToFaust.returnMappedValue(x); };
    ;
    AccUpConverter.prototype.setMappingValues = function (amin, amid, amax, min, init, max) {
        this.accToFaust = new Interpolator3pt(amin, amid, amax, min, init, max);
        this.faustToAcc = new Interpolator3pt(min, init, max, amin, amid, amax);
    };
    ;
    AccUpConverter.prototype.getMappingValues = function (amin, amid, amax) {
        return this.accToFaust.getMappingValues(amin, amid, amax);
    };
    ;
    AccUpConverter.prototype.setActive = function (onOff) { this.fActive = onOff; };
    ;
    AccUpConverter.prototype.getActive = function () { return this.fActive; };
    ;
    return AccUpConverter;
}());
var AccDownConverter = (function () {
    function AccDownConverter(amin, amid, amax, fmin, fmid, fmax) {
        this.fActive = true;
        this.accToFaust = new Interpolator3pt(amin, amid, amax, fmax, fmid, fmin);
        this.faustToAcc = new Interpolator3pt(fmin, fmid, fmax, amax, amid, amin);
    }
    AccDownConverter.prototype.uiToFaust = function (x) { return this.accToFaust.returnMappedValue(x); };
    AccDownConverter.prototype.faustToUi = function (x) { return this.accToFaust.returnMappedValue(x); };
    ;
    AccDownConverter.prototype.setMappingValues = function (amin, amid, amax, min, init, max) {
        this.accToFaust = new Interpolator3pt(amin, amid, amax, max, init, min);
        this.faustToAcc = new Interpolator3pt(min, init, max, amax, amid, amin);
    };
    ;
    AccDownConverter.prototype.getMappingValues = function (amin, amid, amax) {
        return this.accToFaust.getMappingValues(amin, amid, amax);
    };
    ;
    AccDownConverter.prototype.setActive = function (onOff) { this.fActive = onOff; };
    ;
    AccDownConverter.prototype.getActive = function () { return this.fActive; };
    ;
    return AccDownConverter;
}());
var AccUpDownConverter = (function () {
    function AccUpDownConverter(amin, amid, amax, fmin, fmid, fmax) {
        this.fActive = true;
        this.accToFaust = new Interpolator3pt(amin, amid, amax, fmin, fmax, fmin);
        this.faustToAcc = new Interpolator(fmin, fmax, amin, amax);
    }
    AccUpDownConverter.prototype.uiToFaust = function (x) { return this.accToFaust.returnMappedValue(x); };
    AccUpDownConverter.prototype.faustToUi = function (x) { return this.accToFaust.returnMappedValue(x); };
    ;
    AccUpDownConverter.prototype.setMappingValues = function (amin, amid, amax, min, init, max) {
        this.accToFaust = new Interpolator3pt(amin, amid, amax, min, max, min);
        this.faustToAcc = new Interpolator(min, max, amin, amax);
    };
    ;
    AccUpDownConverter.prototype.getMappingValues = function (amin, amid, amax) {
        return this.accToFaust.getMappingValues(amin, amid, amax);
    };
    ;
    AccUpDownConverter.prototype.setActive = function (onOff) { this.fActive = onOff; };
    ;
    AccUpDownConverter.prototype.getActive = function () { return this.fActive; };
    ;
    return AccUpDownConverter;
}());
var AccDownUpConverter = (function () {
    function AccDownUpConverter(amin, amid, amax, fmin, fmid, fmax) {
        this.fActive = true;
        this.accToFaust = new Interpolator3pt(amin, amid, amax, fmax, fmin, fmax);
        this.faustToAcc = new Interpolator(fmin, fmax, amin, amax);
    }
    AccDownUpConverter.prototype.uiToFaust = function (x) { return this.accToFaust.returnMappedValue(x); };
    AccDownUpConverter.prototype.faustToUi = function (x) { return this.accToFaust.returnMappedValue(x); };
    ;
    AccDownUpConverter.prototype.setMappingValues = function (amin, amid, amax, min, init, max) {
        this.accToFaust = new Interpolator3pt(amin, amid, amax, max, min, max);
        this.faustToAcc = new Interpolator(min, max, amin, amax);
    };
    ;
    AccDownUpConverter.prototype.getMappingValues = function (amin, amid, amax) {
        return this.accToFaust.getMappingValues(amin, amid, amax);
    };
    ;
    AccDownUpConverter.prototype.setActive = function (onOff) { this.fActive = onOff; };
    ;
    AccDownUpConverter.prototype.getActive = function () { return this.fActive; };
    ;
    return AccDownUpConverter;
}());
//# sourceMappingURL=Accelerometer.js.map