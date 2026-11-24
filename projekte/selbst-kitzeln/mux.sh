#!/bin/bash
# mux.sh video voice music out
ffmpeg -v error -y -i "$1" -i "$2" -i "$3" -filter_complex "[1:a]aresample=48000,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,volume=1.6,aformat=channel_layouts=stereo,apad,asplit=2[v][sc];[2:a]volume=0.32[m];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[md];[v][md]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$4"
