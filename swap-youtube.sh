#!/bin/bash
# Swap Gateway Experience YouTube iframes with Cloudflare R2 audio players
R2="https://pub-389ccaeb4b504ce1baafd4745cd6bbd7.r2.dev/audio"
DIR=~/Downloads/freedom-code-days

# YouTube ID → MP3 filename mapping (Gateway Experience only)
declare -A MAP
MAP[xQhwZRWzczs]="Gateway-Experience-Wave-1-Track-1-Orientation.mp3"
MAP[XLUnC8pEJco]="Gateway-Experience-Wave-1-Track-2-Introduction-to-Focus-10.mp3"
MAP[qqJCSiDXHnM]="Gateway-Experience-Wave-1-Track-3-Advanced-Focus-10.mp3"
MAP[CktBPfD-OsQ]="Gateway-Experience-Wave-1-Track-4-Release-and-Recharge.mp3"
MAP[gfWTF5u-zpY]="Gateway-Experience-Wave-1-Track-5-Exploration-Sleep.mp3"
MAP[sd0hB37gBo0]="Gateway-Experience-Wave-1-Track-6-Free-Flow.mp3"
MAP[suuZI1y5HQA]="Gateway-Experience-W2-T1-Intro-to-Focus-12.mp3"
MAP[jwBtOzRtUas]="Gateway-Experience-W2-T2-Problem-Solving.mp3"
MAP[gwp8SgIjZA0]="Gateway-Experience-W2-T3-One-Month-Patterning.mp3"
MAP[L07-1tPjQmU]="Gateway-Experience-W2-T4-Color-Breathing.mp3"
MAP[yAMSEaYeW8s]="Gateway-Experience-W2-T5-Energy-Bar.mp3"
MAP[7Oy5G1rIECk]="Gateway-Experience-W2-T6-Living-Body-Map.mp3"
MAP[VPmOSSlomTM]="Gateway-Experience-W3-T1-Lift-Off.mp3"
MAP[R-XlO7tmixI]="Gateway-Experience-W3-T2-Remote-Viewing.mp3"
MAP[x75TUcqdVvE]="Gateway-Experience-W3-T3-Vectors.mp3"
MAP[my2RGujVPKM]="Gateway-Experience-W3-T4-Five-Questions.mp3"
MAP[hYEdD4zBkLQ]="Gateway-Experience-W3-T5-Energy-Food.mp3"
MAP[PlDc_Fvo48Y]="Gateway-Experience-W3-T6-First-Stage-Separation.mp3"
MAP[n6G8oPJGNYU]="Gateway-Experience-W4-T1-One-Year-Patterning.mp3"
MAP[hoXMTwVw6wQ]="Gateway-Experience-W4-T3-Free-Flow-12.mp3"
MAP[cmVvbYp6rhE]="Gateway-Experience-W4-T4-NVC1.mp3"
MAP[PLBxNUD2f3o]="Gateway-Experience-W4-T5-NVC2.mp3"
MAP[kzYowSezV8o]="Gateway-Experience-W4-T6-Compoint-12.mp3"
MAP[Ul7o5AucM1k]="Gateway-Experience-W5-T1-Advanced-Focus-12.mp3"
MAP[IRS8cujO9L0]="Gateway-Experience-W5-T2-Discovering-Intuition.mp3"
MAP[M1I97NdVhoY]="Gateway-Experience-W5-T3-Exploring-Intuition.mp3"
MAP[TSgHRRv5c8Q]="Gateway-Experience-W5-T4-Intro-to-Focus-15.mp3"
MAP[QEmfHkZKZmI]="Gateway-Experience-W5-T5-Mission-Creation-Manifestation.mp3"
MAP[rhYDh5BJc4U]="Gateway-Experience-W5-T6-Exploring-Focus-15.mp3"
MAP[OsYKtMhI7yA]="Gateway-Experience-W6-T1-Sensing-Locale.mp3"
MAP[aJb7SjnyCvg]="Gateway-Experience-W6-T2-Expansion.mp3"
MAP[fgpGWlY9I8U]="Gateway-Experience-W6-T3-Point-of-Departure.mp3"
MAP[VzxwR8xmxzI]="Gateway-Experience-W6-T4-Non-Physical-Friends.mp3"
MAP[mnRl_dylKAo]="Gateway-Experience-W6-T5-Intro-to-Focus-21.mp3"
MAP[mKppFZvPzf8]="Gateway-Experience-W6-T6-Free-Flow-Journey-in-Focus-21.mp3"
MAP[sX9uTPwdmu4]="Gateway-Experience-W7-T1-Explore-Total-Self.mp3"
MAP[rlgDBdDoFv4]="Gateway-Experience-W7-T2-Intro-to-Focus-23.mp3"
MAP[8wcZIsHOr-Y]="Gateway-Experience-W7-T3-Intro-to-Focus-25.mp3"
# Additional IDs that might be Gateway tracks with different IDs
MAP[_IBzh1Zb_Fo]="Gateway-Experience-Wave-1-Track-6-Free-Flow.mp3"
MAP[QKTHOlsqpZU]="Gateway-Experience-Wave-1-Track-5-Exploration-Sleep.mp3"
MAP[bZ_EIh6omL0]="Gateway-Experience-W2-T1-Intro-to-Focus-12.mp3"
MAP[g1plj23P2HY]="Gateway-Experience-W3-T6-First-Stage-Separation.mp3"
MAP[CaG7fco5ob4]="Gateway-Experience-W4-T4-NVC1.mp3"
MAP[YFR1SfdRQG8]="Gateway-Experience-W4-T1-One-Year-Patterning.mp3"
MAP[LVpo1D4bqGc]="Gateway-Experience-W4-T3-Free-Flow-12.mp3"
MAP[9jKFtMZtXww]="Gateway-Experience-W2-T3-One-Month-Patterning.mp3"
MAP[3Hdeb0r6WNs]="Gateway-Experience-W2-T4-Color-Breathing.mp3"
MAP[3tpTvhVyZ5k]="Gateway-Experience-W2-T2-Problem-Solving.mp3"
MAP[8A5cd8gnMSs]="Gateway-Experience-W6-T2-Expansion.mp3"
MAP[76RVRz5gBvA]="Gateway-Experience-W2-T6-Living-Body-Map.mp3"

SWAPPED=0
KEPT=0

for file in "$DIR"/day-*/index.html; do
  DAY=$(echo "$file" | sed 's|.*freedom-code-days/||;s|/index.html||')

  for YT_ID in "${!MAP[@]}"; do
    MP3="${MAP[$YT_ID]}"
    if grep -q "$YT_ID" "$file" 2>/dev/null; then
      # Replace iframe with audio player
      AUDIO_TAG="<audio controls preload=\"metadata\" style=\"width:100%;border-radius:12px;margin:8px 0\"><source src=\"$R2/$MP3\" type=\"audio/mpeg\">Your browser does not support audio.</audio>"
      sed -i '' "s|<iframe src=\"https://www.youtube.com/embed/$YT_ID\"[^>]*></iframe>|$AUDIO_TAG|g" "$file"
      echo "  SWAPPED: $DAY | $YT_ID -> $MP3"
      SWAPPED=$((SWAPPED+1))
    fi
  done
done

echo ""
echo "Done: $SWAPPED YouTube embeds swapped to R2 audio players"
