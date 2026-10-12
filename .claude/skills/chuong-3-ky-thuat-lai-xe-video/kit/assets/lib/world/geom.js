// The road and the driver's car, in metres. No three.js and no DOM, so Node can read it too.
//
// Frame of reference: the driver's car sits at z = 0 and faces +z; the world slides past it. Left of
// the car is +x. Traffic keeps right, so our lane is x = -LANE and the oncoming lane is x = +LANE.
export const LANE = 1.75; // lane centre from the road centre line
export const HALF = 3.5; // half width of the carriageway
export const BAY_X = -5.2; // where the car stands in a lay-by
export const BAY_HALF = 21; // half length of a lay-by
export const BUMPER = 2.46; // front bumper ahead of the car centre
export const EYE = { left: 0.42, y: 1.3, fwd: 0.15 }; // the driver's eye, from the car centre
export const TRUCK_HALF = 3.72;
export const SCALE_MAX = 120; // metres shown by a full bar of the instrument panel

// How far the car still travels before it stands still. The lengths are illustrative: a video
// compares them with each other and prints no number unless the lesson gives one.
export const stopDist = (v, react = 1.2, decel = 5) => v * react + (v * v) / (2 * decel);
