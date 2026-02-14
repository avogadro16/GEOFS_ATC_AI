// ==UserScript==
// @name         GeoFS AI ATC - Multilingual with Mode Selection
// @namespace    
// @version      2.0.1
// @description  AI ATC for GeoFS using free PuterJS GPT API with ATC Mode & Language Selection
// @author       Base Nemanja Avramovic Upgrades avogadro16
// @license      MIT
// @match        https://www.geo-fs.com/geofs.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        GM.getResourceText
// @grant        GM.getResourceUrl
// @grant        GM.xmlHttpRequest
// @resource     airports https://github.com/avramovic/geofs-ai-atc/raw/master/airports.json
// @resource     radiostatic https://github.com/avramovic/geofs-ai-atc/raw/master/radio-static.mp3
// ==/UserScript==

(function() {
    'use strict';

    // Add custom styles for ATC mode buttons and language selector
    const customCSS = document.createElement('style');
    customCSS.textContent = `
        .geofs-atc-mode-btn {
            padding: 4px 8px;
            font-size: 11px;
            border: 1px solid #999;
            background-color: #e8e8e8;
            color: #333;
            cursor: pointer;
            border-radius: 3px;
            transition: all 0.2s;
            font-weight: bold;
            min-width: 50px;
            text-align: center;
            margin-right: 3px;
        }
        .geofs-atc-mode-btn:hover {
            background-color: #d0d0d0;
        }
        .geofs-atc-mode-btn.active {
            background-color: #4CAF50;
            color: white;
            border-color: #45a049;
        }
        .geofs-language-btn {
            padding: 4px 8px;
            font-size: 11px;
            border: 1px solid #999;
            background-color: #e8e8e8;
            color: #333;
            cursor: pointer;
            border-radius: 3px;
            transition: all 0.2s;
            font-weight: bold;
            min-width: 40px;
            text-align: center;
            margin-right: 3px;
        }
        .geofs-language-btn:hover {
            background-color: #d0d0d0;
        }
        .geofs-language-btn.active {
            background-color: #2196F3;
            color: white;
            border-color: #1976D2;
        }
    `;
    document.head.appendChild(customCSS);

    const head = document.querySelector('head');
    if (head) {
        const puterJS = document.createElement('script');
        puterJS.src = 'https://js.puter.com/v2/';
        head.appendChild(puterJS);

        const growlJS = document.createElement('script');
        growlJS.src = 'https://cdn.jsdelivr.net/gh/avramovic/geofs-ai-atc@master/vanilla-notify.min.js';
        head.appendChild(growlJS);

        const growlCSS = document.createElement('link');
        growlCSS.href = 'https://cdn.jsdelivr.net/gh/avramovic/geofs-ai-atc@master/vanilla-notify.css';
        growlCSS.rel = 'stylesheet';
        head.appendChild(growlCSS);
    }

    let airports;
    GM.getResourceText("airports").then((data) => {
        airports = JSON.parse(data);
    });

    let radiostatic;
    GM.getResourceUrl("radiostatic").then((data) => {
        radiostatic = new Audio('data:audio/mp3;'+data);
        radiostatic.loop = false;
    });

    let tunedInAtc;
    let controllers = {};
    let context = {};
    let oldNearest = null;
    let selectedAtcMode = 'AUTO';
    let selectedLanguage = 'EN';
    let modeButtonsCreated = false;
    let languageButtonsCreated = false;

    const languageConfig = {
        EN: {
            name: 'English',
            voiceRecognition: 'en-US',
            messages: {
                noFrequency: "No frequency set. Click the radio icon to set the frequency!",
                cancelled: "You cancelled the dialog",
                noSpeech: "No speech recognized. Speak up?",
                speechError: "Speech recognition error: ",
                modeSwitch: "ATC mode switched to ",
                inRange: "You are now in range of ",
                setFrequency: "Set your radio frequency to ",
                tuneIn: "Your radio is now tuned to ",
                frequency: " frequency. You will now talk to them.",
                airportNotFound: "Airport with code ",
                cannotBeFound: " can not be found!",
                closed: " seems to be closed right now. Try again later...",
                outOfRange: " is out of range. You need to be less than 50 nautical miles away from the airport to contact it.",
                enterMessage: "Please enter your message to the ATC:",
                enterAirport: "Enter airport ICAO code"
            }
        },
        FR: {
            name: 'Français',
            voiceRecognition: 'fr-FR',
            messages: {
                noFrequency: "Aucune fréquence définie. Cliquez sur l'icône radio pour définir la fréquence!",
                cancelled: "Vous avez annulé la boîte de dialogue",
                noSpeech: "Aucune parole reconnue. Parlez plus fort?",
                speechError: "Erreur de reconnaissance vocale: ",
                modeSwitch: "Mode ATC basculé vers ",
                inRange: "Vous êtes maintenant à portée de ",
                setFrequency: "Définissez votre fréquence radio sur ",
                tuneIn: "Votre radio est maintenant accordée à ",
                frequency: " fréquence. Vous allez maintenant parler avec eux.",
                airportNotFound: "L'aéroport avec le code ",
                cannotBeFound: " ne peut pas être trouvé!",
                closed: " semble être fermé en ce moment. Réessayez plus tard...",
                outOfRange: " est hors de portée. Vous devez être à moins de 50 milles nautiques de l'aéroport pour le contacter.",
                enterMessage: "Veuillez entrer votre message à l'ATC:",
                enterAirport: "Entrez le code ICAO de l'aéroport"
            }
        }
    };

    const observer = new MutationObserver(() => {
        const menuList = document.querySelector('div.geofs-ui-bottom');

        if (menuList && !menuList.querySelector('.geofs-atc-icon')) {
            // Create language buttons first
            if (!languageButtonsCreated) {
                const languages = ['EN', 'FR'];
                languages.forEach(lang => {
                    const btn = document.createElement('button');
                    btn.className = 'geofs-language-btn';
                    if (lang === 'EN') btn.classList.add('active');
                    btn.textContent = lang;
                    btn.title = `Switch to ${languageConfig[lang].name}`;
                    
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.geofs-language-btn').forEach(b => {
                            b.classList.remove('active');
                        });
                        btn.classList.add('active');
                        selectedLanguage = lang;
                        info(`Language switched to ${languageConfig[lang].name}`);
                    });
                    
                    menuList.appendChild(btn);
                });
                languageButtonsCreated = true;
            }

            // Create mode buttons
            if (!modeButtonsCreated) {
                const modes = ['AUTO', 'GROUND', 'TOWER', 'APPROACH', 'DEPARTURE'];
                modes.forEach(mode => {
                    const btn = document.createElement('button');
                    btn.className = 'geofs-atc-mode-btn';
                    if (mode === 'AUTO') btn.classList.add('active');
                    btn.textContent = mode;
                    btn.title = `Switch to ${mode} frequency`;
                    
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.geofs-atc-mode-btn').forEach(b => {
                            b.classList.remove('active');
                        });
                        btn.classList.add('active');
                        selectedAtcMode = mode;
                        info(`${languageConfig[selectedLanguage].messages.modeSwitch}${mode}`);
                    });
                    
                    menuList.appendChild(btn);
                });
                modeButtonsCreated = true;
            }

            const micIcon = document.createElement('i');
            micIcon.className = 'material-icons';
            micIcon.innerText = 'headset_mic';

            const knobIcon = document.createElement('i');
            knobIcon.className = 'material-icons';
            knobIcon.innerText = 'radio';

            const tuneInButton = document.createElement('button');
            tuneInButton.className = 'mdl-button mdl-js-button mdl-button--icon geofs-f-standard-ui geofs-tunein-icon';
            tuneInButton.title = "Click to set ATC frequency.";

            tuneInButton.addEventListener('click', (e) => {
                let nearestAp = findNearestAirport();
                let msg = languageConfig[selectedLanguage].messages;
                let apCode = prompt(msg.enterAirport, nearestAp.code);
                if (apCode == null || apCode === '') {
                    error(msg.cancelled)
                } else {
                    apCode = apCode.toUpperCase();
                    if (typeof unsafeWindow.geofs.mainAirportList[apCode] === 'undefined') {
                        error(msg.airportNotFound + apCode + msg.cannotBeFound);
                    } else {
                        tunedInAtc = apCode;
                        initController(apCode);
                        info(msg.tuneIn + apCode + msg.frequency);
                    }
                }
            });

            const atcButton = document.createElement('button');
            atcButton.className = 'mdl-button mdl-js-button mdl-button--icon geofs-f-standard-ui geofs-atc-icon';
            atcButton.title = "Click to talk to the ATC. Ctrl+click (Cmd+click on Mac) to input text instead of talking.";

            atcButton.addEventListener('click', (e) => {
                let msg = languageConfig[selectedLanguage].messages;
                if (typeof tunedInAtc === 'undefined') {
                    error(msg.noFrequency);
                } else if (e.ctrlKey || e.metaKey) {
                    let pilotMsg = prompt(msg.enterMessage);
                    if (pilotMsg != null && pilotMsg != "") {
                        callAtc(pilotMsg);
                    } else {
                        error(msg.cancelled);
                    }
                } else {
                    navigator.mediaDevices.getUserMedia({ audio: true });
                    let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    let recognition = new SpeechRecognition();
                    recognition.continuous = false;
                    recognition.lang = languageConfig[selectedLanguage].voiceRecognition;
                    recognition.interimResults = false;
                    recognition.maxAlternatives = 1;
                    recognition.start();
                    recognition.onresult = (event) => {
                        let pilotMsg = event.results[event.results.length - 1][0].transcript;
                        if (pilotMsg != null && pilotMsg != "") {
                            callAtc(pilotMsg);
                        } else {
                            error(msg.noSpeech);
                        }
                        recognition.stop();
                    };
                    recognition.onerror = (event) => {
                        error(msg.speechError + event.error);
                    };
                }
            });

            atcButton.appendChild(micIcon);
            tuneInButton.appendChild(knobIcon);

            menuList.appendChild(tuneInButton);
            menuList.appendChild(atcButton);
        }
    });

    observer.observe(document.body, {childList: true, subtree: true});

    function haversine(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const toRad = (deg) => deg * (Math.PI / 180);

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c) / 1.852;
    }

    function findNearestAirport() {
        let nearestAirport = null;
        let minDistance = Infinity;

        for (let apCode in unsafeWindow.geofs.mainAirportList) {
            let distance = findAirportDistance(apCode);

            if (distance < minDistance) {
                minDistance = distance;
                nearestAirport = {
                    code: apCode,
                    distance: distance
                };
            }
        }

        return nearestAirport;
    }

    function findAirportDistance(code) {
        let aircraftPosition = {
            lat: unsafeWindow.geofs.aircraft.instance.lastLlaLocation[0],
            lon: unsafeWindow.geofs.aircraft.instance.lastLlaLocation[1],
        };
        let ap = unsafeWindow.geofs.mainAirportList[code];
        let airportPosition = {
            lat: ap[0],
            lon: ap[1]
        };

        return haversine(
          aircraftPosition.lat,
          aircraftPosition.lon,
          airportPosition.lat,
          airportPosition.lon
        );
    }

    function calculateBearing(lat1, lon1, lat2, lon2) {
        const toRadians = (deg) => deg * (Math.PI / 180);
        const toDegrees = (rad) => rad * (180 / Math.PI);

        const dLon = toRadians(lon2 - lon1);
        const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
        const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
          Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
        const bearing = toDegrees(Math.atan2(y, x));

        return (bearing + 360) % 360;
    }

    function getRelativeDirection(airportLat, airportLon, airplaneLat, airplaneLon) {
        const bearing = calculateBearing(airportLat, airportLon, airplaneLat, airplaneLon);

        if (bearing >= 337.5 || bearing < 22.5) {
            return selectedLanguage === 'FR' ? "nord" : "north";
        } else if (bearing >= 22.5 && bearing < 67.5) {
            return selectedLanguage === 'FR' ? "nord-est" : "northeast";
        } else if (bearing >= 67.5 && bearing < 112.5) {
            return selectedLanguage === 'FR' ? "est" : "east";
        } else if (bearing >= 112.5 && bearing < 157.5) {
            return selectedLanguage === 'FR' ? "sud-est" : "southeast";
        } else if (bearing >= 157.5 && bearing < 202.5) {
            return selectedLanguage === 'FR' ? "sud" : "south";
        } else if (bearing >= 202.5 && bearing < 247.5) {
            return selectedLanguage === 'FR' ? "sud-ouest" : "southwest";
        } else if (bearing >= 247.5 && bearing < 292.5) {
            return selectedLanguage === 'FR' ? "ouest" : "west";
        } else if (bearing >= 292.5 && bearing < 337.5) {
            return selectedLanguage === 'FR' ? "nord-ouest" : "northwest";
        }
    }

    function generateRandomController() {
        const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'James', 'Maria', 'Robert', 'Jennifer'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        const genders = ['male', 'female'];

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const gender = genders[Math.floor(Math.random() * genders.length)];
        const age = Math.floor(Math.random() * (65 - 25 + 1)) + 25;

        return {
            name: {
                first: firstName,
                last: lastName
            },
            gender: gender,
            dob: {
                age: age
            }
        };
    }

    function initController(apCode) {
        controllers[apCode] = controllers[apCode] || null;

        if (controllers[apCode] == null) {
            controllers[apCode] = generateRandomController();
        }
    }

    function error(msg) {
        vNotify.error({text:msg, title:'Error', visibleDuration: 10000});
    }

    function info(msg, title) {
        title = title || 'Information';
        vNotify.info({text:msg, title:title, visibleDuration: 10000});
    }

    function atcSpeak(text) {
        let synth = window.speechSynthesis;
        let voices = synth.getVoices();
        let toSpeak = new SpeechSynthesisUtterance(text);
        
        // Select voice based on language
        if (selectedLanguage === 'FR') {
            toSpeak.lang = 'fr-FR';
            // Try to find a French voice
            for (let voice of voices) {
                if (voice.lang.includes('fr')) {
                    toSpeak.voice = voice;
                    break;
                }
            }
        } else {
            toSpeak.lang = 'en-US';
            toSpeak.voice = voices[0];
        }
        
        synth.speak(toSpeak);
    }

    function atcGrowl(text, airport_code) {
        vNotify.warning({text: text, title: airport_code+' ATC', visibleDuration: 20000});
    }

    function atcMessage(text, airport_code) {
        atcGrowl(text, airport_code);
        atcSpeak(text);
    }

    function pilotMessage(text) {
        let user = unsafeWindow.geofs.userRecord;
        let airplane = unsafeWindow.geofs.aircraft.instance.aircraftRecord;

        let callsign = "Foo";
        if (user.id != 0) {
            callsign = user.callsign;
        }

        vNotify.success({text: text, title: airplane.name+': '+callsign, visibleDuration: 10000});
    }

     function isOnGround() {
        return unsafeWindow.geofs.animation.values.groundContact === 1;
    }

    function seaAltitude() {
        return unsafeWindow.geofs.animation.values.altitude;
    }

    function groundAltitude() {
        return Math.max(seaAltitude() - unsafeWindow.geofs.animation.values.groundElevationFeet - 50, 0);
    }

    function getPilotInfo(today) {
        let user = unsafeWindow.geofs.userRecord;

        let pilot = {
            callsign: 'Foo',
            name: 'not known',
            licensed_at: today
        };

        if (user.id != 0) {
            pilot = {
                callsign: user.callsign,
                name: user.firstname + ' ' + user.lastname,
                licensed_at: user.created
            };
        }

        return pilot;
    }

    function getAtcMode() {
        if (selectedAtcMode !== 'AUTO') {
            return selectedAtcMode;
        }

        if (isOnGround()) {
            return 'GROUND';
        } else if (seaAltitude() <= 5000) {
            return 'TOWER';
        } else {
            return 'APPROACH';
        }
    }

    setInterval(function() {
        let airport = findNearestAirport();
        let airportMeta = airports[airport.code];
        let msg = languageConfig[selectedLanguage].messages;

        if (oldNearest !== airport.code) {
            let apName = airportMeta ? airportMeta.name+' ('+airport.code+')' : airport.code;
            info(msg.inRange + apName + '. ' + msg.setFrequency + '<b>'+airport.code+'</b> ' + (selectedLanguage === 'FR' ? 'pour vous accorder avec eux' : 'to tune in with them'));
            oldNearest = airport.code;
            initController(airport.code);
        }
    }, 500);

    function callAtc(pilotMsg) {
        let airport = {
            distance: findAirportDistance(tunedInAtc),
            code: tunedInAtc,
        };

        let date = new Date().toISOString().split('T')[0];
        let time = unsafeWindow.geofs.animation.values.hours + ':' + unsafeWindow.geofs.animation.values.minutes;
        let airportMeta = airports[airport.code];
        let controller = controllers[airport.code];
        let apName = airportMeta ? airportMeta.name + ' (' + airport.code + ')' : airport.code;
        let pilot = getPilotInfo(date);
        let msg = languageConfig[selectedLanguage].messages;

        if (typeof controller === 'undefined') {
            radiostatic.play();
            info(msg.airportNotFound + apName + msg.closed);
            initController(airport.code);
            return;
        }

        if (airport.distance > 50) {
            radiostatic.play();
            error(msg.airportNotFound + airport.code + msg.outOfRange);
            return;
        }

        let airportPosition = {
            lat: unsafeWindow.geofs.mainAirportList[airport.code][0],
            lon: unsafeWindow.geofs.mainAirportList[airport.code][1],
        };

        if (typeof context[airport.code] === "undefined") {
            let season = unsafeWindow.geofs.animation.values.season;
            let daynight = unsafeWindow.geofs.animation.values.night ? (selectedLanguage === 'FR' ? 'nuit' : 'night') : (selectedLanguage === 'FR' ? 'jour' : 'day');
            if (unsafeWindow.geofs.isSnow || unsafeWindow.geofs.isSnowy) {
                daynight = (selectedLanguage === 'FR' ? 'nuit enneigée' : 'snowy night');
            }

            let atcMode = getAtcMode();
            let languageInstruction = selectedLanguage === 'FR' 
                ? 'Vous répondrez en français. '
                : 'You will respond in English. ';
            
            let intro = 'You are '+controller.name.first+' '+controller.name.last+', a '+controller.dob.age+' years old '+controller.gender+' ATC controller on the '+apName+' for today. ' +
                'Your airport location is (lat: '+airportPosition.lat+', lon: '+airportPosition.lon+'). You are talking to pilot whose name is '+pilot.name+' callsign ('+pilot.callsign+') and they\'ve been piloting since '+pilot.licensed_at+'. ' +
                'You are currently working as '+atcMode+' controller. ' +
                languageInstruction +
                'You will be acting as ground, tower (if the plane is below or at 5000 ft) or approach or departure (if above 5000 ft), depending on whether the plane is on the ground, their distance from the airport, heading and previous context. ' +
                'If the aircraft is in the air, keep your communication short and concise, as a real ATC. If they\'re on the ground, your replies should still be short (1-2 sentence per reply), but you can ' +
                'use a more relaxed communication like making jokes, discussing weather, other traffic etc. If asked why so slow on replies, say you\'re busy, like the real ATC. '+
                'Today is '+date+', time is '+time+', a beautiful '+season+' '+daynight;

            context[airport.code] = [];
            context[airport.code].push({content: intro, role: 'system'});
        }

        let airplane = unsafeWindow.geofs.aircraft.instance.aircraftRecord;
        let aircraftPosition = {
            lat: unsafeWindow.geofs.aircraft.instance.lastLlaLocation[0],
            lon: unsafeWindow.geofs.aircraft.instance.lastLlaLocation[1],
        };

        let onGround = isOnGround() ? (selectedLanguage === 'FR' ? 'au sol' : 'on the ground') : (selectedLanguage === 'FR' ? 'en l\'air' : 'in the air');
        let distance;

        if (airport.distance > 1) {
            let relativeDirection = getRelativeDirection(airportPosition.lat, airportPosition.lon, aircraftPosition.lat, aircraftPosition.lon);
            distance = airport.distance+' ' + (selectedLanguage === 'FR' ? 'milles nautiques' : 'nautical miles') + ' '+relativeDirection+' ' + (selectedLanguage === 'FR' ? 'de l\'aéroport' : 'from the airport');
        } else if (isOnGround()) {
            distance = selectedLanguage === 'FR' ? 'à l\'aéroport' : 'at the airport';
        } else {
            distance = selectedLanguage === 'FR' ? 'au-dessus de l\'aéroport' : 'above the airport';
        }

        let movingSpeed;
        if (isOnGround()) {
            if (unsafeWindow.geofs.animation.values.kias > 1) {
                movingSpeed = (selectedLanguage === 'FR' ? 'se déplaçant à ' : 'moving at ') + unsafeWindow.geofs.animation.values.kias+' kts'
            } else {
                movingSpeed = selectedLanguage === 'FR' ? 'stationnaire' : 'stationary';
            }
        } else {
            movingSpeed = (selectedLanguage === 'FR' ? 'volant à ' : 'flying at ') + unsafeWindow.geofs.animation.values.kias+' kts, ' + (selectedLanguage === 'FR' ? 'cap ' : 'heading ') + unsafeWindow.geofs.animation.values.heading360;
        }

        let atcMode = getAtcMode();
        let address = pilot.callsign+', '+airport.code+' '+atcMode;

        if (airplane.name.toLowerCase().includes('cessna') || airplane.name.toLowerCase().includes('piper')) {
            address = airplane.name + ' ' + address;
        }

        let relativeWindDirection = unsafeWindow.geofs.animation.values.relativeWind;
        let windDirection = (unsafeWindow.geofs.animation.values.heading360 + relativeWindDirection + 360) % 360;
        let wind = unsafeWindow.geofs.animation.values.windSpeedLabel + ', ' + (selectedLanguage === 'FR' ? 'direction ' : 'direction ') + windDirection + ' ' + (selectedLanguage === 'FR' ? 'degrés' : 'degrees');

        let currentUpdate = 'Date and time: '+date+' '+time+'. '+
            'The pilot is flying '+airplane.name+' and their position is '+onGround+' '+distance+'. The altitude of the aircraft is '+seaAltitude()+' feet above the sea level ('+groundAltitude()+' feet above ground). ' +
            'The plane is '+movingSpeed+'. Wind speed is '+wind+'. Air temperature is '+unsafeWindow.geofs.animation.values.airTemp+' degrees celsius. '+
            'You should address them with "'+address+'", followed by the message.';

        if (context[airport.code].length >= 4) {
            context[airport.code].splice(-3, 1);
        }

        context[airport.code].push({content: currentUpdate, role: 'system'});
        context[airport.code].push({content: pilotMsg, role: 'user'});

        pilotMessage(pilotMsg);

        puter.ai.chat(context[airport.code]).then(function(resp) {
            context[airport.code].push(resp.message);
            atcMessage(resp.message.content, airport.code);
        });
    }

})();
