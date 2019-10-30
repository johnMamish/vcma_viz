// These functions up here are just basic vector math helpers because I was too lazy to figure out
// how to use a proper external vector math lib.


function elementwise_sum(a, b)
{
    var i = 0;
    var result = new Array();
    for (i = 0; i < a.length; i++) {
        result[i] = a[i] + b[i];
    }
    return result;
}

/**
 * Calculates the cross product of 2 array[3] of floats.
 */
function cross(a, b)
{
    var xp = new Array();
    xp[0] = (a[1] * b[2]) - (a[2] * b[1]);
    xp[1] = (a[2] * b[0]) - (a[0] * b[2]);
    xp[2] = (a[0] * b[1]) - (a[1] * b[0]);
    return xp;
}

/**
 * returns array a scaled by scalar.
 */
function scalar_multiply(scalar, a)
{
    var i = 0;
    var result = new Array();
    for (i = 0; i < a.length; i++) {
        result[i] = a[i] * scalar;
    }
    return result;
}

/**
 * This class simulates a VCMA modulated MTJ, producing 2 vectors over time: H_eff and M, where
 * H_eff is the effective applied magnetic field and M is the magnetization of the soft layer.
 */
export default class vcma_mtj_sim {
    constructor() {
        // ======= state variables =======
        this._M = new Array(-0.7071, 0.7071, 0.0);

        // ultimately, this will be removed once we can properly simulate H_eff. For now, we have a
        // pure LLG simulation without any of the interesting bits introduced by VCMA via H_eff.
        this.forced_H_eff = new Array(10, 0, 0);

        // ======= simulation constants; base time unit is picoseconds =======
        // this is the gyromagnetic ratio of an electron. Units are radian / (Tesla Seconds), but
        // we have it in radian / (Tesla * picoseconds) because of precision.
        //this.gamma_e = 1.76085964411e11
        this.gamma_e = 1.76085964411e-1

        // gilbert damping constant taken from DOI 10.1109/TMAG.2017.2788010. It is dimensionless.
        this.alpha = 0.05;

        // Permeability of CoFeB film guesstimated from "Permeability Measurements of Magnetic Thin
        // Film with Microstrip Probe"
        this.magnetic_permeability = 1.257e-6;

        // in picoseconds
        this.timestep = 1;
    }

    get M() {
        return this._M;
    }

    get H_eff() {
        // for now, just return the forced H_eff. Later we should calculate from
        // H_pma - H_vcma + H_dem + H_ext.
        return this.forced_H_eff;
    }

    /**
     * Accepts an array[3] of float. While M should be normalized, I don't think H_eff should be.
     */
    set force_H_eff(H_eff) {
        this.forced_H_eff = H_eff;
    }

    step_simulation(picoseconds) {
        // calculate number of steps to do.
        var nsteps   = Math.ceil(picoseconds / this.timestep);
        var stepsize = picoseconds / nsteps;

        console.log("nsteps = " + nsteps);
        var nstep;
        for (nstep = 0; nstep < nsteps; nstep++) {
            var reduced_gyromag = ((this.gamma_e * this.magnetic_permeability) /
                                   (1 + (this.alpha * this.alpha)));

            var dMdt = elementwise_sum(
                cross(this.M, this.H_eff),
                scalar_multiply(this.alpha, cross(this.M, cross(this.M, this.H_eff)))
            );
            dMdt = scalar_multiply(-reduced_gyromag, dMdt);

            // scale dM/dt according to timescale.
            // presumably, dM/dt is in picoseconds.
            dMdt = scalar_multiply(stepsize, dMdt);
            this._M = elementwise_sum(this.M, dMdt);

            // normalize M
            var norm2 = 0;
            var i = 0;
            for (i = 0; i < 3; i++) {
                norm2 += this._M[i] * this._M[i];
            }
            for (i = 0; i < 3; i++) {
                this._M[i] /= Math.sqrt(norm2);
            }
        }
    }
}
