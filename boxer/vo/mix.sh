#!/bin/sh
# Mux the rendered picture with the voiceover and the composed score (ducked under the voice), -14 LUFS for social.
set -e
cd "$(dirname "$0")/.."
ffmpeg -v error -y -i out/boxer-silent.mp4 -i vo/voice.mp3 -i out/score.wav -filter_complex "\
[1:a]adelay=600|600,aresample=48000,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,volume=1.6,apad=whole_dur=60.5,asplit=2[vo][key];\
[2:a]aresample=48000,volume=0.95,afade=t=out:st=58.2:d=1.4,apad=whole_dur=60.5[m];\
[m][key]sidechaincompress=threshold=0.03:ratio=3.5:attack=30:release=450:makeup=1[md];\
[vo][md]amix=inputs=2:normalize=0:duration=longest,atrim=0:60.5,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -movflags +faststart out/boxer.mp4
