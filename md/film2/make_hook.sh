#!/bin/bash
# Builds a ~2.2 s cold-open hook from the finished episode and puts it in front.
set -e
IN=../md_folge2.mp4; OUT=../md_folge2_mit_hook.mp4; F=/usr/share/fonts/opentype/inter/Inter-Black.otf
cd "$(dirname "$0")"
SEG="46.6:0.6 48.45:0.55 65.55:0.55 67.2:0.5"
i=0; list=""
for s in $SEG; do st=${s%%:*}; du=${s##*:}
  ffmpeg -v error -y -ss $st -t $du -i $IN -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 out/hook_$i.mp4
  list="$list -i out/hook_$i.mp4"; i=$((i+1)); done
ffmpeg -v error -y $list -filter_complex "[0:v][0:a][1:v][1:a][2:v][2:a][3:v][3:a]concat=n=4:v=1:a=1[v][a];[v]drawbox=x=0:y=330:w=iw:h=330:color=black@0.55:t=fill,drawtext=fontfile=$F:text='82 Y/O GRANDPA':fontcolor=white:fontsize=118:borderw=10:bordercolor=black:x=(w-text_w)/2:y=360,drawtext=fontfile=$F:text='VS. THE GYM':fontcolor=0xffd23f:fontsize=128:borderw=10:bordercolor=black:x=(w-text_w)/2:y=490,drawtext=fontfile=$F:text='WAIT FOR THE END':fontcolor=white:fontsize=54:borderw=6:bordercolor=black:x=(w-text_w)/2:y=1700[vo]" -map "[vo]" -map "[a]" -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 out/hook.mp4
ffmpeg -v error -y -i out/hook.mp4 -i $IN -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -movflags +faststart $OUT
ffprobe -v error -show_entries format=duration -of csv=p=0 $OUT
