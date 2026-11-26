// "THE DAYS NOBODY SEES": the score for the boxer film. Orchestral, D minor, 75 bpm, 4/4.
// One bar = 3.2 s. The picture beats it is written to (film seconds, voice starts at 0.6 s):
//   bar 0   0.0  the dream: strings alone state the motif (rising 5th, then steps back)
//   bar 4  12.8  "the empty gym at 6 AM": heartbeat pulse, string ostinato, darker
//   bar 8  25.6  "that's where the difference is made": brass takes the motif, epic drums
//   bar 11 35.2  "losing a fight ... coming back": build, dominant pedal
//   bar 13 41.6  "you become one ... refuse to give up": first tutti on the tonic
//   bar 14 44.8  "Remember…": the breath, one held chord
//   bar 15 48.0  "only you know the sacrifices": bVI - bVII - I (major), choir on top, the peak
// Tension curve: .25 .25 .25 .25 | .4 .45 .5 .6 | .65 .7 .72 | .8 .85 | .9 | .2 | .95 1 | 1 (held, ring-out)
import type { Material } from "./music/compose";

export const boxerScore = (): Material => ({
  style: "orchestral", title: "The Days Nobody Sees", seed: 6061, mood: "heroic",
  bpm: 75, key: "D", mode: "aeolian", meter: "4/4",
  moodControls: { energy: 0.6, warmth: 0.6, brightness: 0.45, tension: 0.5, space: 0.62 },
  dyn: [0.5, 0.78], tail: 3.4,
  levels: { counter: -5, hat: 6 },
  chords: {
    Dm: { voicing: "[D3 A3 F4 A4]", bass: "D2:4" },
    Bb: { voicing: "[F3 Bb3 D4 F4]", bass: "Bb1:4" },
    F: { voicing: "[F3 A3 C4 F4]", bass: "F2:4" },
    C: { voicing: "[E3 G3 C4 E4]", bass: "C2:4" },
    Gm: { voicing: "[G3 Bb3 D4 G4]", bass: "G1:4" },
    Asus: { voicing: "[A3 D4 E4 A4]", bass: "A1:2" },
    A: { voicing: "[A3 C#4 E4 A4]", bass: "A1:2" },
    D: { voicing: "[D3 A3 F#4 A4 D5]", bass: "D2:4" },
  },
  motifs: {
    // the dream, strings alone: the motif and its sequence a 4th up
    in1: "r:2 D4:1.5 A4:.5", in2: "A4:2 F4:1 D4:1", in3: "r:2 F4:1.5 C5:.5", in4: "C5:2 G4:1 E4:1",
    // the grind: an 8th ostinato that walks with the chords
    o1: "D3:.5 A3:.5 D4:.5 A3:.5 D3:.5 A3:.5 F4:.5 A3:.5",
    o2: "Bb2:.5 F3:.5 Bb3:.5 F3:.5 Bb2:.5 F3:.5 D4:.5 F3:.5",
    o3: "G2:.5 D3:.5 G3:.5 D3:.5 G2:.5 D3:.5 Bb3:.5 D3:.5",
    o4: "A2:.5 E3:.5 A3:.5 E3:.5 A2:.5 E3:.5 C#4:.5 E3:.5",
    o5: "F2:.5 C3:.5 F3:.5 C3:.5 F2:.5 C3:.5 A3:.5 C3:.5",
    o6: "C3:.5 G3:.5 C4:.5 G3:.5 C3:.5 G3:.5 E4:.5 G3:.5",
    // the brass theme: the motif stated, answered, sequenced
    h1: "D4:1.5 A4:.5 A4:1 G4:.5 F4:.5", h2: "F4:1.5 D4:.5 D4:1 E4:.5 F4:.5", h3: "C4:1.5 F4:.5 A4:1.5 G4:.5",
    // the build: fragments, climbing
    b1: "G4:1 E4:.5 G4:.5 C5:1 G4:1", b2: "A4:1 E4:.5 A4:.5 C#5:2",
    // the first arrival, and the last statement: augmented
    c1: "D5:2 A4:1 F4:1",
    f1: "D4:1.5 A4:.5 Bb4:2", f2: "C5:2 G4:1 E4:1", f3: "F#4:1 A4:1 D5:2",
    // the choir
    k1: "A4:4", k2: "D5:4", k3: "E5:4", k4: "F#5:4",
  },
  grooves: {
    main: { family: "epic", density: 0.6, variation: 0.3 },
    pulse: { family: "pulse", density: 0.5, variation: 0.2 },
    build: { family: "build", density: 0.7, variation: 0.2 },
  },
  sections: [
    { kind: "intro", bars: 4, harmony: ["Dm", "Bb", "F", "C"], arp: ["in1", "in2", "in3", "in4"], chordVel: 0.65, energy: 0.3 },
    { kind: "verse", bars: 4, harmony: ["Dm", "Bb", "Gm", "Asus A"], arp: ["o1", "o2", "o3", "o4"], groove: "pulse", energy: 0.45,
      bass: ["D2:4", "Bb1:4", "G1:4", "A1:2 A1:2"] },
    { kind: "hook", bars: 3, harmony: ["Dm", "Bb", "F"], lead: ["h1", "h2", "h3"], arp: ["o1", "o2", "o5"], groove: "main", energy: 0.66,
      bass: ["D2:1.5 D2:.5 D2:1 A1:1", "Bb1:1.5 Bb1:.5 Bb1:1 F2:1", "F2:1.5 F2:.5 F2:1 C2:1"] },
    { kind: "build", bars: 2, harmony: ["C", "Asus A"], lead: ["b1", "b2"], arp: ["o6", "o4"], groove: "build", energy: 0.78,
      bass: ["C2:1 C2:1 C2:1 C2:1", "A1:1 A1:1 A1:1 A1:1"] },
    { kind: "drop", bars: 1, harmony: ["Dm"], lead: ["c1"], counter: ["k1"], arp: ["o1"], groove: "main", energy: 0.88 },
    { kind: "breath", bars: 1, harmony: ["Bb"], chordVel: 0.45, energy: 0.2 },
    { kind: "drop", bars: 2, harmony: ["Bb", "C"], lead: ["f1", "f2"], counter: ["k2", "k3"], arp: ["o2", "o6"], groove: "main", energy: 1,
      bass: ["Bb1:1.5 Bb1:.5 Bb1:1 F2:1", "C2:1.5 C2:.5 C2:1 G2:1"] },
    { kind: "outro", bars: 1, harmony: ["D"], lead: ["f3"], counter: ["k4"], energy: 0.95 },
  ],
});
