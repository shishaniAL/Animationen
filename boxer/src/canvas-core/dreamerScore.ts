// "SAY NOTHING": the score for the dreamer film. Cinematic, A minor turning to C major, 72 bpm, 4/4.
// One bar = 3.333 s. Picture beats (film seconds; the voice starts at 0.6 s):
//   bar 0   0.0  "something nobody understands": solo piano, the motif (a rise of a 4th, then steps)
//   bar 4  13.3  "build something of my own ... millionaire": the strings take the motif, hope
//   bar 7  23.3  "my parents don't understand": dark, a heartbeat, a low ostinato; bar 9 "they shout"
//   bar 10 33.3  "it hurts": everything out but the piano
//   bar 12 40.0  "maybe I just need to keep working": the turn. A driving ostinato, the theme back
//   bar 15 50.0  "prove anything with words ... that same room": the build
//   bar 17 56.7  "say nothing ... just smile": the breath, one quiet chord
//   bar 18 60.0  "the results will speak for themselves": the tutti on the tonic
//   bar 19 63.3  "let the silence do the talking": a swell on the dominant ...
//   bar 20 66.7  ... deceptive, into F major: the end card's quote, now in C major, IV - V - I
// Tension: .15 .15 .2 .2 | .35 .4 .45 | .45 .5 .65 | .2 .2 | .55 .6 .65 | .75 .85 | .1 | .9 .8 | 1 .95 .7
import type { Material } from "./music/compose";

export const dreamerScore = (): Material => ({
  style: "cinematic", title: "Say Nothing", seed: 4417, mood: "hopeful",
  bpm: 72, key: "A", mode: "aeolian", meter: "4/4",
  voices: { counter: "piano" },
  moodControls: { energy: 0.55, warmth: 0.65, brightness: 0.45, tension: 0.45, space: 0.55 },
  dyn: [0.45, 0.8], tail: 3.6,
  levels: { counter: -21, lead: 3, kick: -4, bass: 3, hat: 6 },
  chords: {
    Am: { voicing: "[E3 A3 C4 E4]", bass: "A1:4" },
    F: { voicing: "[F3 A3 C4 F4]", bass: "F1:4" },
    C: { voicing: "[E3 G3 C4 E4]", bass: "C2:4" },
    G: { voicing: "[D3 G3 B3 D4]", bass: "G1:4" },
    Dm: { voicing: "[D3 F3 A3 D4]", bass: "D2:4" },
    E: { voicing: "[E3 G#3 B3 E4]", bass: "E1:2" },
    Esus: { voicing: "[E3 A3 B3 E4]", bass: "E1:2" },
    Cfin: { voicing: "[C3 G3 C4 E4 G4]", bass: "C2:4" },
  },
  motifs: {
    // the piano, alone: the motif and its answer, then a sequence
    p1: "r:.5 E4:.5 A4:1 B4:.5 C5:1.5", p2: "C5:1 B4:.5 A4:.5 A4:2", p3: "r:.5 E4:.5 G4:1 A4:.5 B4:1.5", p4: "B4:1 A4:.5 G4:.5 D4:2",
    // piano arpeggios under the strings
    a_F: "F3:.5 C4:.5 F4:.5 A4:.5 C5:.5 A4:.5 F4:.5 C4:.5", a_C: "C3:.5 G3:.5 C4:.5 E4:.5 G4:.5 E4:.5 C4:.5 G3:.5",
    a_G: "G2:.5 D3:.5 G3:.5 B3:.5 D4:.5 B3:.5 G3:.5 D3:.5", a_Am: "A2:.5 E3:.5 A3:.5 C4:.5 E4:.5 C4:.5 A3:.5 E3:.5",
    a_Dm: "D3:.5 A3:.5 D4:.5 F4:.5 A4:.5 F4:.5 D4:.5 A3:.5", a_E: "E3:.5 B3:.5 E4:.5 G#4:.5 B4:.5 G#4:.5 E4:.5 B3:.5",
    // the strings: the motif, then it reaches
    s1: "r:.5 E4:.5 A4:1 B4:.5 C5:1.5", s2: "E5:1.5 D5:.5 C5:1 G4:1", s3: "D5:1 B4:1 B4:1 G#4:1",
    // the parents: a low line under the heartbeat
    d1: "r:2 C4:1 B3:1", d2: "A3:2 r:1 F4:.5 E4:.5", d3: "D4:1 E4:1 F4:1 G#4:1",
    o_Am: "A2:.5 E3:.5 A2:.5 E3:.5 A2:.5 E3:.5 C3:.5 E3:.5", o_Dm: "D2:.5 A2:.5 D2:.5 A2:.5 D2:.5 A2:.5 D3:.5 A2:.5", o_E: "E2:.5 B2:.5 E2:.5 B2:.5 E2:.5 B2:.5 G#2:.5 B2:.5",
    // it hurts: the piano, fragile
    h1: "C5:1.5 B4:.5 A4:2", h2: "F4:1 E4:1 D4:1 B3:1",
    // the turn: the theme returns, then climbs
    t1: "r:.5 E4:.5 A4:1 B4:.5 C5:1.5", t2: "C5:1 B4:.5 A4:.5 A4:1 C5:1", t3: "E5:1.5 D5:.5 D5:1 B4:1",
    k_Am: "A3:.5 C4:.5 E4:.5 C4:.5 A3:.5 C4:.5 E4:.5 C4:.5", k_F: "A3:.5 C4:.5 F4:.5 C4:.5 A3:.5 C4:.5 F4:.5 C4:.5", k_CG: "G3:.5 C4:.5 E4:.5 C4:.5 G3:.5 B3:.5 D4:.5 B3:.5",
    k_Dm: "A3:.5 D4:.5 F4:.5 D4:.5 A3:.5 D4:.5 F4:.5 D4:.5", k_E: "B3:.5 E4:.5 G#4:.5 E4:.5 B3:.5 E4:.5 G#4:.5 E4:.5",
    // the build
    b1: "D5:1 E5:1 F5:1 E5:1", b2: "E5:2 G#4:1 B4:1",
    // the breath: one note
    q1: "E5:4",
    // the results: the motif augmented, high
    r1: "A4:1 E5:1 A5:2", r2: "G#5:2 F5:1 E5:1",
    // the quote: IV - V - I in C, the motif's rise ending home
    f1: "r:.5 C5:.5 F5:1 G5:.5 A5:1.5", f2: "G5:1.5 F5:.5 D5:1 B4:1", f3: "G4:1 C5:3",
    e_F: "F2:.5 C3:.5 F3:.5 A3:.5 C4:.5 F4:.5 A4:.5 C5:.5", e_G: "G2:.5 D3:.5 G3:.5 B3:.5 D4:.5 G4:.5 B4:.5 D5:.5", e_C: "[C3 G3 C4 E4]:4",
  },
  grooves: {
    main: { family: "tension", density: 0.55, variation: 0.25 },
    pulse: { family: "pulse", density: 0.45, variation: 0.2 },
    build: { family: "build", density: 0.7, variation: 0.2 },
    half: { family: "halfTime", density: 0.55, variation: 0.2 },
  },
  sections: [
    { kind: "intro", bars: 4, harmony: ["Am", "F", "C", "G"], counter: ["p1", "p2", "p3", "p4"], chordVel: 0.4, energy: 0.28 },
    { kind: "verse", bars: 3, harmony: ["F", "C", "G Esus"], lead: ["s1", "s2", "s3"], counter: ["a_F", "a_C", "a_G"], groove: null, energy: 0.42,
      bass: ["F1:4", "C2:4", "G1:2 E1:2"] },
    { kind: "verse", bars: 3, harmony: ["Am", "Dm", "E"], lead: ["d1", "d2", "d3"], arp: ["o_Am", "o_Dm", "o_E"], groove: "pulse", energy: 0.5,
      bass: ["A1:4", "D2:4", "E1:1 E1:1 E1:1 E1:1"] },
    { kind: "breakdown", bars: 2, harmony: ["F", "Dm E"], counter: ["h1", "h2"], chordVel: 0.45, energy: 0.3 },
    { kind: "hook", bars: 3, harmony: ["Am", "F", "C G"], lead: ["t1", "t2", "t3"], counter: ["k_Am", "k_F", "k_CG"], arp: ["o_Am", "a_F", "a_C"], groove: "main", energy: 0.64,
      bass: ["A1:1.5 A1:.5 A1:1 E2:1", "F1:1.5 F1:.5 F1:1 C2:1", "C2:2 G1:2"] },
    { kind: "build", bars: 2, harmony: ["Dm", "Esus E"], lead: ["b1", "b2"], counter: ["k_Dm", "k_E"], arp: ["o_Dm", "o_E"], groove: "build", energy: 0.78,
      bass: ["D2:1 D2:1 D2:1 D2:1", "E1:1 E1:1 E1:1 E1:1"] },
    { kind: "breath", bars: 1, harmony: ["Esus"], counter: ["q1"], chordVel: 0.35, energy: 0.18 },
    { kind: "drop", bars: 1, harmony: ["Am"], lead: ["r1"], counter: ["a_Am"], arp: ["o_Am"], groove: "half", energy: 0.92,
      bass: ["A1:1.5 A1:.5 A1:1 E2:1"] },
    { kind: "swell", bars: 1, harmony: ["Dm E"], lead: ["r2"], counter: ["a_Dm"], energy: 0.8, bass: ["D2:2 E1:2"] },
    { kind: "drop", bars: 2, key: "C", mode: "major", harmony: ["F", "G"], lead: ["f1", "f2"], counter: ["e_F", "e_G"], arp: ["a_F", "a_G"], groove: "half", energy: 1,
      bass: ["F1:1.5 F1:.5 F1:1 C2:1", "G1:1.5 G1:.5 G1:1 D2:1"] },
    { kind: "outro", bars: 1, key: "C", mode: "major", harmony: ["Cfin"], lead: ["f3"], counter: ["e_C"], energy: 0.85 },
  ],
});
