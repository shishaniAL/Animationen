#!/bin/sh
# Picture + voice (stray word after "talking." trimmed) + composed score ducked under the voice, -14 LUFS.
set -e
cd "$(dirname "$0")/.."
D=76.13
ffmpeg -v error -y -i out/dreamer-silent.mp4 -i vo2/voice.mp3 -i out/score2.wav -filter_complex "\
[1:a]atrim=0:65.5,afade=t=out:st=65.25:d=0.25,adelay=600|600,aresample=48000,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,volume=1.6,apad=whole_dur=$D,asplit=2[vo][key];\
[2:a]aresample=48000,volume=0.95,afade=t=out:st=74.3:d=1.7,apad=whole_dur=$D[m];\
[m][key]sidechaincompress=threshold=0.03:ratio=3.5:attack=30:release=450:makeup=1[md];\
[vo][md]amix=inputs=2:normalize=0:duration=longest,atrim=0:$D,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -movflags +faststart out/dreamer.mp4
