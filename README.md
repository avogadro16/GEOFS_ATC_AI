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

# Updates Improvements

  # 2.0
  - ATC AI now support GeoFS 3.9

  # 2.0.1
  - Adding ATC modes (TWR, GND, DEP and APP buttons
  - Adding multilingual (FR/EN) ATC

  # 2.0.2
  - Adding 100 most importants runways to the ATC. Find de list below.
  - Improve procedures
  - Improve ATC with real time traffic on GeoFs
  - Improve ATC navigation orders based on the GeoFS flight plan

    - List of airports accepted on GeoFS ATC AI :
    - North America: JFK, LAX, SFO, ORD, DFW, ATL, DEN, MIA, BOS, YYZ, YVR, YUL, MEX, CUN, HNL, ANC, SEA, PDX, LAS, PHX, IAH, DCA, EWR, LGA, MDW, MSP, PHL, CLT, SAN, AUS, BNA, MEM
    - Europe: LHR, CDG, FRA, MAD, FCO, VIE, AMS, LGW, TXL, MUC, ZRH, BRU, GVA, ARN, CPH, OSL, HEL, DUB, BCN, LIS, ATH, IST, SNN, CWL, EDI, GLA, MAN, BHX, LBA, EMA, LPL, NCL, SOU, BRS, EXT, NQY, GCI, JSY, IOM, PIK, INV, ABZ, BEB, SYY, TIR, ILY, BRR
    - Asia: HND, PVG, ICN, BKK, SIN, KUL, MNL, CGK, DEL, BOM, DXB, AUH, RUH, JED, TLV, HKG, NRT, ZBB, UUS, UDD
    - South America: GIG, GRU, AEP, LIM, BOG, CCS, AKL, CHC, NAN, SYD
    - Caraïbean & Central America: CUN, MBJ, NAS, BGI, AUA, CUR, POS, PTY, SJO, MGA, BZE, GUA, SAL, TGU, HAV, SDQ, PAP, SJU, BDA, RKV


# Known issues
 - The ATC will never contact you first. If ATC tells you to wait for instructions, you will have to ask them for updates every couple (10-20) seconds.


# Requirements
 - Tampermonkey
