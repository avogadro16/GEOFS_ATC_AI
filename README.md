Multilingual and multimode AI ATC for GeoFS using free Puter JS GPT API based and updated from an existing script from avramovic (https://avramovic.info/)

This userscript provides support for AI (GPT) ATC "simulation" using the free PuterJS GPT api. All you need to do is log in with your Puter.com account (registration is free and done in one click) and this script will add a new icon to the bottom of your screen. You can click it to speak to atc using web speech recognition API (all major browsers support this) or Ctrl+click (Cmd+click on Mac) to input your text. The GPT will generate ATC response and display it on screen AND read it aloud using web text to speech API (also supported by all major browsers).

# Key features
 - Speak to the atc and hear it respond (speech recognition and text-to-speech), or type the message
 - The ATC cans understand and speak french and english.
 - You have to be within 50 nautical miles of the airport to talk to it
 - Click on the radio icon to tune in to different airport; you can tune to a particular airport ATC by using their ICAO code. In case, a screen notification will be shown when you are in range of another airport
 - Choose the mode of ATC you need to use (TOWER, GROUND, APPROACH, DEPARTURE)
 - AUTO mode will base the ATC mode about your altitude. 
 - Every day there is a new controller working at each airport

# Known issues
 - The ATC will never contact you first. If ATC tells you to wait for instructions, you will have to ask them for updates every couple (10-20) seconds.
 - ATC may hallucinate, so don't rely too much on their navigation. While they know their position and your aircraft position (and other params like speed, heading, altitude), they don't know how many runways the airport has, nor the orientation of the runways, so they will always guide you directly to the runway. You can tell them you want to land on e.g. rwy 12 and only then they might give you proper vectors.


# Requirements
 - Tampermonkey
