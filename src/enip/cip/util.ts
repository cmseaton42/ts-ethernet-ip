export interface ITimeoutData {
    timeTick: number;
    ticks: number;
}

/**
 * Gets the Best Available Timeout Values
 *
 * @param {number} timeout - Desired Timeout in ms
 */
export const generateEncodedTimeout = (timeout: number): ITimeoutData => {
    if (timeout <= 0) throw new Error('Timeouts Must be Positive Integers');

    let diff = Infinity; // let difference be very large
    let timeTick = 0;
    let ticks = 0;

    // Search for Best Timeout Encoding Values
    for (let i = 0; i < 16; i++) {
        for (let j = 1; j < 256; j++) {
            const newDiff = Math.abs(timeout - Math.pow(2, i) * j);
            if (newDiff <= diff) {
                diff = newDiff;
                timeTick = i;
                ticks = j;
            }
        }
    }

    return { timeTick, ticks };
};
