// http://szudzik.com/ElegantPairing.pdf
export class SzudziksPairing {

    /**
     * A pairing function on a set A associates each pair of members from A with a single member of A, so that any two distinct pairs are associated with two distinct members.
     * @param {Number} a 
     * @param {Number} b 
     * @returns {Number} a single member of A
     */
    static pair(a, b) {
        let A = a >= 0 ? 2 * a : -2 * a - 1;
        let B = b >= 0 ? 2 * b : -2 * b - 1;
        return A >= B ? A * A + A + B : A + B * B;
    }
}