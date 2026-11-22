// Narration timing (ElevenLabs "Brian" take), measured from the pauses in the recording.
// Times are global seconds in the EDITED narration: 1.4 s of silence inserted after "später" (49.21 s).
export const NARR_FILE = 'narration.mp3';
export const GAP = { at: 49.21, len: 1.4 };

// shot id -> phrases [start, end, text]
export const PHRASES = {
  1: [[0.09, 2.652, 'In einer *Stadt,* in der jeder jeden kannte,']],
  2: [[2.921, 6.745, 'gab es einen Mann, vor dem selbst die *größten Jungs* freiwillig Platz machten.']],
  3: [[7.372, 8.896, 'Sein Name war *Khamzat.*']],
  4: [[9.536, 11.383, 'Khamzat war *MMA-Kämpfer.*']],
  5: [[11.994, 13.506, 'Jeden *Morgen* trainierte er,']],
  6: [[13.706, 15.21, 'jeden *Abend* trainierte er,']],
  7: [[15.47, 17.122, 'und wenn er einmal nicht trainierte,'], [17.328, 18.68, 'trainierte er *wahrscheinlich trotzdem.*']],
  8: [[19.46, 21.465, 'Die Leute hatten so viel *Respekt* vor ihm,']],
  9: [[21.83, 24.707, 'dass sogar der *Türsteher* eines Clubs einmal zu ihm sagte:']],
  10: [[25.265, 25.664, '„Bruder,'], [25.945, 27.137, 'du musst heute *nicht bezahlen.*'], [27.521, 28.269, 'Geh einfach rein.“']],
  11: [[28.965, 30.012, 'Khamzat antwortete:'], [30.544, 31.473, '„Ich gehe nicht feiern.'], [31.826, 32.644, 'Ich gehe *schlafen.*“']],
  12: [[33.488, 36.033, 'Eines Tages stellte sich ein *Typ* vor ihn und sagte:']],
  13: [[36.621, 39.246, '„Ich hab gehört, du bist gar *nicht so stark,* wie alle sagen.“']],
  14: [[39.967, 41.209, 'Khamzat schaute ihn an,'], [41.63, 44.142, 'nahm einen *Schluck* von seinem Energy-Drink und sagte:']],
  15: [[44.696, 45.104, '„Bruder,'], [45.405, 46.299, 'ich hab heute *frei.*“']],
  16: [[46.997, 47.767, 'Der Typ *lachte.*']],
  17: [[48.293, 49.21, 'Fünf Sekunden *später…*']],
  18: [[50.65, 52.512, '…*entschuldigte* er sich für Dinge,'], [52.844, 54.158, 'die er *noch gar nicht gemacht* hatte.']],
  19: [[54.832, 58.037, 'Seit diesem Tag hatte Khamzat noch *mehr Respekt* in der Stadt.']],
  20: [[58.685, 59.906, 'Aber das Lustigste war:'], [60.384, 63.396, 'Niemand wusste eigentlich, ob er *wirklich so gefährlich* war.']],
  21: [[64.024, 67.259, 'Denn noch nie hatte jemand den *Mut* gehabt, es herauszufinden.']],
};

// shot starts (cuts land ~0.2 s before each phrase), plus the end of the film
export const STARTS = [0, 2.79, 7.17, 9.34, 11.79, 13.61, 15.34, 19.26, 21.65, 25.07, 28.77, 33.29, 36.42, 39.77, 44.5, 46.8, 48.09, 50.56, 54.63, 58.49, 63.82, 67.61, 70.81, 73.41];
export const END = 76.01;
