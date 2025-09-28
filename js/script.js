// Utility functions
    const $ = (sel, root=document) => root.querySelector(sel);
    const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

    // Date/Time update
    function updateDateTime(){
      const now = new Date();
      $('#clock').textContent = now.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
      $('#date').textContent = now.toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
    }

    // Theme management
    const THEME_KEY = 'theme';
    function applyTheme(t){
      document.documentElement.setAttribute('data-theme', t);
      const icon = $('#themeToggle span');
      if(icon) icon.textContent = (t === 'dark') ? '🌙' : '☀️';
    }
    
    function toggleTheme(){
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = (cur === 'dark') ? 'light' : 'dark';
      applyTheme(next);
      showNotification('Theme', `Switched to ${next} mode`);
    }

    // Notifications
    function showNotification(title, msg){
      const n = $('#notification');
      if(!n) return;
      n.innerHTML = `<div style="font-weight:800; margin-bottom:2px;">🔔 ${title}</div><div>${msg}</div>`;
      n.classList.add('show');
      setTimeout(()=> n.classList.remove('show'), 4000);
    }

    // Modal management
    function openModal(el){ 
      closeModals();
      el.style.display='flex'; 
      el.style.alignItems='center'; 
      el.style.justifyContent='center'; 
    }
    
    function closeModals(){ 
      $$('.modal').forEach(m => m.style.display='none'); 
    }

    // Tab switching
    function activateTab(tab){
      $$('.tab-button').forEach(btn=> btn.classList.toggle('active', btn.getAttribute('data-tab')===tab));
      $$('.content-panel').forEach(p=> p.classList.toggle('active', p.id===tab));
      
      if(tab==='transport') loadTransportData();
      if(tab==='weather') loadWeatherData();
      if(tab==='news') loadNewsData();
      if(tab==='culture') loadCultureData();
    }

    // Metro Tracker Class for subway system
    class MetroTracker {
      constructor(lineId, lineNumber, stations, color) {
        this.lineId = lineId;
        this.lineNumber = lineNumber;
        this.stations = stations;
        this.color = color;
        this.currentStationIndex = 0;
        this.isMoving = false;
        this.currentPassengers = Math.floor(Math.random() * 500) + 300;
        this.maxPassengers = 1500;
        this.progressInterval = null;
        this.currentSpeed = 45;
        
        this.initializeStations();
        this.updateTrainPosition(0);
        this.updateInfoPanel();
      }
      
      initializeStations() {
        const container = document.getElementById(`${this.lineId}-stations`);
        if (!container) return;
        container.innerHTML = '';
        
        this.stations.forEach((station, index) => {
          const stationElement = document.createElement('div');
          stationElement.className = 'metro-station';
          if (station.transfer) {
            stationElement.className += ' transfer';
          }
          stationElement.id = `${this.lineId}-station-${index}`;
          
          stationElement.innerHTML = `
            <div class="metro-station-marker"></div>
            <div class="metro-station-name">${station.name}</div>
            <div class="metro-station-time">${station.time || '00:00'}</div>
          `;
          
          container.appendChild(stationElement);
        });
        
        if (this.stations.length > 0) {
          const firstStation = document.querySelector(`#${this.lineId}-station-0`);
          if (firstStation) firstStation.classList.add('current');
        }
      }
      
      updateTrainPosition(progress) {
        const trainElement = document.getElementById(`${this.lineId}-train`);
        if (!trainElement || !trainElement.parentElement) return;
        
        const containerWidth = trainElement.parentElement.offsetWidth;
        const padding = 20;
        const effectiveWidth = containerWidth - (padding * 2);
        
        const leftPosition = padding + (effectiveWidth * progress / 100);
        trainElement.style.left = `${leftPosition}px`;
        
        const progressElement = document.getElementById(`${this.lineId}-progress`);
        if (progressElement) {
          progressElement.style.width = `${progress}%`;
        }
      }
      
      moveToNextStation() {
        if (!this.isMoving || this.currentStationIndex >= this.stations.length - 1) {
          if (this.currentStationIndex >= this.stations.length - 1) {
            this.handleArrival();
          }
          return;
        }
        
        const currentStation = this.stations[this.currentStationIndex];
        const timeToNext = currentStation.timeToNext;
        
        if (timeToNext === 0) {
          this.handleArrival();
          return;
        }
        
        let elapsedTime = 0;
        const updateFrequency = 100;
        
        const segmentStartProgress = (this.currentStationIndex / (this.stations.length - 1)) * 100;
        const segmentEndProgress = ((this.currentStationIndex + 1) / (this.stations.length - 1)) * 100;
        
        clearInterval(this.progressInterval);
        this.progressInterval = setInterval(() => {
          elapsedTime += updateFrequency / 1000;
          
          const segmentProgress = Math.min(elapsedTime / timeToNext, 1);
          const totalProgress = segmentStartProgress + (segmentEndProgress - segmentStartProgress) * segmentProgress;
          
          this.updateTrainPosition(totalProgress);
          this.updateETA(timeToNext - elapsedTime);
          
          if (Math.random() < 0.1) {
            this.updateSpeed();
          }
          
          if (elapsedTime >= timeToNext) {
            clearInterval(this.progressInterval);
            this.arrivedAtStation();
          }
        }, updateFrequency);
      }
      
      arrivedAtStation() {
        this.currentStationIndex++;
        
        document.querySelectorAll(`#${this.lineId}-stations .metro-station`).forEach((station, index) => {
          station.classList.remove('current', 'passed', 'next');
          if (index < this.currentStationIndex) {
            station.classList.add('passed');
          } else if (index === this.currentStationIndex) {
            station.classList.add('current');
          } else if (index === this.currentStationIndex + 1) {
            station.classList.add('next');
          }
        });
        
        this.updatePassengers();
        this.updateInfoPanel();
        
        // Station stop for 2 seconds
        setTimeout(() => {
          this.moveToNextStation();
        }, 2000);
      }
      
      handleArrival() {
        this.isMoving = false;
        const etaElement = document.getElementById(`${this.lineId}-eta`);
        if (etaElement) {
          etaElement.textContent = 'Terminal';
        }
        
        setTimeout(() => {
          this.resetRoute();
        }, 5000);
      }
      
      updateETA(secondsLeft) {
        const element = document.getElementById(`${this.lineId}-eta`);
        if (!element) return;
        
        if (secondsLeft <= 0) {
          element.textContent = 'Arriving';
        } else {
          const minutes = Math.floor(secondsLeft / 60);
          const seconds = Math.floor(secondsLeft % 60);
          element.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      }
      
      updatePassengers() {
        // Simulate passenger boarding/exiting
        const exitingPassengers = Math.floor(Math.random() * 200) + 50;
        const enteringPassengers = Math.floor(Math.random() * 200) + 50;
        
        this.currentPassengers = Math.max(100, Math.min(this.maxPassengers, 
          this.currentPassengers - exitingPassengers + enteringPassengers));
        
        const passengersElement = document.getElementById(`${this.lineId}-passengers`);
        if (passengersElement) {
          passengersElement.textContent = this.currentPassengers.toLocaleString();
        }
        
        // Update crowding level
        const loadPercent = (this.currentPassengers / this.maxPassengers) * 100;
        const loadIcon = document.getElementById(`${this.lineId}-load-icon`);
        const loadText = document.getElementById(`${this.lineId}-load`);
        const crowdingBadge = document.getElementById(`${this.lineId}-crowding`);
        
        if (loadIcon) {
          loadIcon.classList.remove('medium', 'high');
          if (loadPercent > 80) {
            loadIcon.classList.add('high');
          } else if (loadPercent > 50) {
            loadIcon.classList.add('medium');
          }
        }
        
        if (loadText) {
          if (loadPercent > 80) {
            loadText.textContent = 'Crowded';
          } else if (loadPercent > 50) {
            loadText.textContent = 'Normal';
          } else {
            loadText.textContent = 'Light';
          }
        }
        
        if (crowdingBadge) {
          crowdingBadge.classList.remove('high');
          if (loadPercent > 80) {
            crowdingBadge.classList.add('high');
            crowdingBadge.innerHTML = '<span>👥</span><span>Crowded</span>';
          } else if (loadPercent > 50) {
            crowdingBadge.innerHTML = '<span>👥</span><span>Normal</span>';
          } else {
            crowdingBadge.innerHTML = '<span>👥</span><span>Light</span>';
          }
        }
      }
      
      updateSpeed() {
        this.currentSpeed = Math.floor(Math.random() * 20) + 40;
        const speedElement = document.getElementById(`${this.lineId}-speed`);
        if (speedElement) {
          speedElement.textContent = `${this.currentSpeed} km/h`;
        }
      }
      
      updateInfoPanel() {
        const currentStation = this.stations[this.currentStationIndex];
        if (!currentStation) return;
        
        const currentStationElement = document.getElementById(`${this.lineId}-current`);
        if (currentStationElement) {
          currentStationElement.textContent = currentStation.name;
        }
        
        const nextElement = document.getElementById(`${this.lineId}-next`);
        if (nextElement) {
          if (this.currentStationIndex < this.stations.length - 1) {
            nextElement.textContent = this.stations[this.currentStationIndex + 1].name;
          } else {
            nextElement.textContent = 'Terminal';
          }
        }
      }
      
      resetRoute() {
        this.currentStationIndex = 0;
        this.currentPassengers = Math.floor(Math.random() * 500) + 300;
        
        document.querySelectorAll(`#${this.lineId}-stations .metro-station`).forEach(station => {
          station.classList.remove('current', 'passed', 'next');
        });
        
        const firstStation = document.querySelector(`#${this.lineId}-station-0`);
        if (firstStation) firstStation.classList.add('current');
        
        this.updateTrainPosition(0);
        this.updateInfoPanel();
        this.updatePassengers();
        
        setTimeout(() => {
          this.start();
        }, 2000);
      }
      
      start() {
        if (this.isMoving) return;
        this.isMoving = true;
        
        const firstStation = document.querySelector(`#${this.lineId}-station-0`);
        if (firstStation) firstStation.classList.add('current');
        
        setTimeout(() => {
          this.moveToNextStation();
        }, 2000);
      }
    }
    
    let metro2Tracker, metro3Tracker, metro4Tracker;
    
    // Initialize Metro Tracking
    function initializeMetroTracking() {
      // Metro Line 2 (Green) stations
      const metro2Stations = [
        { name: 'Central', time: '00:00', timeToNext: 65, transfer: true },
        { name: 'City Hall', time: '01:05', timeToNext: 70 },
        { name: 'Park Ave', time: '02:15', timeToNext: 60 },
        { name: 'Museum', time: '03:15', timeToNext: 75 },
        { name: 'Stadium', time: '04:30', timeToNext: 80 },
        { name: 'East Loop', time: '05:50', timeToNext: 0 }
      ];
      
      // Metro Line 3 (Orange) stations
      const metro3Stations = [
        { name: 'North Station', time: '00:00', timeToNext: 55 },
        { name: 'University', time: '00:55', timeToNext: 65 },
        { name: 'Tech Park', time: '02:00', timeToNext: 70 },
        { name: 'Downtown', time: '03:10', timeToNext: 60, transfer: true },
        { name: 'Harbor', time: '04:10', timeToNext: 75 },
        { name: 'South Terminal', time: '05:25', timeToNext: 0 }
      ];
      
      // Metro Line 4 (Blue) stations
      const metro4Stations = [
        { name: 'East End', time: '00:00', timeToNext: 60 },
        { name: 'Downtown', time: '01:00', timeToNext: 65, transfer: true },
        { name: 'Financial Dist', time: '02:05', timeToNext: 55 },
        { name: 'Central Plaza', time: '03:00', timeToNext: 70 },
        { name: 'Airport Link', time: '04:10', timeToNext: 80, transfer: true },
        { name: 'West Terminal', time: '05:30', timeToNext: 0 }
      ];
      
      // Create metro trackers
      metro2Tracker = new MetroTracker('metro2', '2', metro2Stations, '#00A84D');
      metro3Tracker = new MetroTracker('metro3', '3', metro3Stations, '#EF7C1C');
      metro4Tracker = new MetroTracker('metro4', '4', metro4Stations, '#00A5DE');
      
      // Start with delays to simulate realistic intervals
      setTimeout(() => metro2Tracker.start(), 1000);
      setTimeout(() => metro3Tracker.start(), 3500);
      setTimeout(() => metro4Tracker.start(), 6000);
    }
    
    // Data loaders
    // Enhanced Bus Tracker Class with comprehensive monitoring features
    class BusTracker {
      constructor(busId, routeNumber, stops, color) {
        this.busId = busId;
        this.routeNumber = routeNumber;
        this.stops = stops;
        this.color = color;
        this.currentStopIndex = 0;
        this.isMoving = false;
        this.progressInterval = null;
        
        // Advanced monitoring properties
        this.currentPassengers = Math.floor(Math.random() * 20) + 5;
        this.maxPassengers = busId === 'bus1' ? 45 : (busId === 'bus2' ? 40 : 35);
        this.totalDistance = 0;
        this.currentSpeed = 35;
        this.currentFuel = 50 + Math.floor(Math.random() * 40);
        this.engineTemp = 88 + Math.floor(Math.random() * 10);
        this.speedHistory = [];
        this.totalPassengersTransported = this.currentPassengers;
        this.tripStartTime = Date.now();
        this.currentDelay = 0;
        this.trafficLevel = 'low';
        this.historyRecords = [];
        
        this.initializeStops();
        this.updateBusPosition(0);
        this.updateInfoPanel();
        this.updateStats();
      }
      
      initializeStops() {
        const container = document.getElementById(`${this.busId}-stops`);
        if (!container) return;
        container.innerHTML = '';
        
        this.stops.forEach((stop, index) => {
          const stopElement = document.createElement('div');
          stopElement.className = 'stop';
          stopElement.id = `${this.busId}-stop-${index}`;
          
          stopElement.innerHTML = `
            <div class="stop-marker"></div>
            <div class="stop-name">${stop.name}</div>
          `;
          
          container.appendChild(stopElement);
        });
      }
      
      updateBusPosition(progress) {
        const busElement = document.getElementById(this.busId);
        if (!busElement) return;
        
        const containerWidth = busElement.parentElement?.offsetWidth || 400;
        const padding = 20;
        const effectiveWidth = containerWidth - (padding * 2);
        
        const leftPosition = padding + (effectiveWidth * progress / 100);
        busElement.style.left = `${leftPosition}px`;
        
        const progressBar = document.getElementById(`${this.busId}-progress`);
        if (progressBar) progressBar.style.width = `${progress}%`;
      }
      
      updateTraffic() {
        const random = Math.random();
        const trafficBadge = document.getElementById(`${this.busId}-traffic`);
        const trafficText = document.getElementById(`${this.busId}-traffic-text`);
        
        if (random < 0.6) {
          this.trafficLevel = 'low';
          if (trafficText) trafficText.textContent = 'Smooth';
          if (trafficBadge) trafficBadge.className = 'traffic-badge';
          this.currentDelay = 0;
        } else if (random < 0.85) {
          this.trafficLevel = 'medium';
          if (trafficText) trafficText.textContent = 'Normal';
          if (trafficBadge) trafficBadge.className = 'traffic-badge medium';
          this.currentDelay = Math.floor(Math.random() * 2) + 1;
        } else {
          this.trafficLevel = 'heavy';
          if (trafficText) trafficText.textContent = 'Heavy';
          if (trafficBadge) trafficBadge.className = 'traffic-badge heavy';
          this.currentDelay = Math.floor(Math.random() * 3) + 2;
        }
        
        this.updateDelayStatus();
      }
      
      updateDelayStatus() {
        const delayElement = document.getElementById(`${this.busId}-delay`);
        if (!delayElement) return;
        
        if (this.currentDelay === 0) {
          delayElement.textContent = 'On Time';
          delayElement.style.color = '#10b981';
        } else if (this.currentDelay <= 2) {
          delayElement.textContent = `+${this.currentDelay} min`;
          delayElement.style.color = '#fbbf24';
        } else {
          delayElement.textContent = `+${this.currentDelay} min`;
          delayElement.style.color = '#ef4444';
        }
      }
      
      updateStats() {
        // Trip time
        const elapsed = Date.now() - this.tripStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const tripTimeEl = document.getElementById(`${this.busId}-trip-time`);
        if (tripTimeEl) tripTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Stops count
        const stopsCountEl = document.getElementById(`${this.busId}-stops-count`);
        if (stopsCountEl) stopsCountEl.textContent = `${this.currentStopIndex + 1}/${this.stops.length}`;
        
        // Load percentage
        const loadPercent = Math.round((this.currentPassengers / this.maxPassengers) * 100);
        const loadEl = document.getElementById(`${this.busId}-load`);
        if (loadEl) loadEl.textContent = `${loadPercent}%`;
        
        const loadBar = document.getElementById(`${this.busId}-load-bar`);
        if (loadBar) {
          loadBar.style.width = `${loadPercent}%`;
          if (loadPercent > 80) {
            loadBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
          } else if (loadPercent > 50) {
            loadBar.style.background = 'linear-gradient(90deg, #fbbf24, #f59e0b)';
          }
        }
        
        // Average speed
        if (this.speedHistory.length > 0) {
          const avgSpeed = Math.round(this.speedHistory.reduce((a, b) => a + b, 0) / this.speedHistory.length);
          const avgSpeedEl = document.getElementById(`${this.busId}-avg-speed`);
          if (avgSpeedEl) avgSpeedEl.textContent = `${avgSpeed} km/h`;
        }
        
        // Total passengers
        const totalPassEl = document.getElementById(`${this.busId}-total-pass`);
        if (totalPassEl) totalPassEl.textContent = this.totalPassengersTransported;
        
        // Update overall stats
        this.updateOverallStats();
      }
      
      addToHistory() {
        const stop = this.stops[this.currentStopIndex];
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const historyList = document.getElementById(`${this.busId}-history`);
        if (!historyList) return;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'history-item';
        itemElement.innerHTML = `
          <div class="history-time">${timeStr}</div>
          <div class="history-details">
            <span>📍</span>
            <span>${stop.name.substring(0, 8)}</span>
          </div>
          <div class="history-details">
            <span>👥</span>
            <span>${this.currentPassengers}</span>
          </div>
        `;
        
        historyList.insertBefore(itemElement, historyList.firstChild);
        
        if (historyList.children.length > 6) {
          historyList.removeChild(historyList.lastChild);
        }
      }
      
      moveToNextStop() {
        if (!this.isMoving || this.currentStopIndex >= this.stops.length - 1) {
          if (this.currentStopIndex >= this.stops.length - 1) {
            this.handleArrival();
          }
          return;
        }
        
        const currentStop = this.stops[this.currentStopIndex];
        const timeToNext = currentStop.timeToNext + (this.currentDelay * 10);
        
        let elapsedTime = 0;
        const updateFrequency = 100;
        
        const segmentStart = (this.currentStopIndex / (this.stops.length - 1)) * 100;
        const segmentEnd = ((this.currentStopIndex + 1) / (this.stops.length - 1)) * 100;
        
        clearInterval(this.progressInterval);
        this.progressInterval = setInterval(() => {
          elapsedTime += updateFrequency / 1000;
          
          const segmentProgress = Math.min(elapsedTime / timeToNext, 1);
          const totalProgress = segmentStart + (segmentEnd - segmentStart) * segmentProgress;
          
          this.updateBusPosition(totalProgress);
          this.updateETA(timeToNext - elapsedTime);
          
          // Update distance
          const distanceProgress = this.totalDistance + (currentStop.distance * segmentProgress);
          const distanceEl = document.getElementById(`${this.busId}-distance`);
          if (distanceEl) distanceEl.innerHTML = `${distanceProgress.toFixed(1)}<small>km</small>`;
          
          // Update fuel
          this.currentFuel = Math.max(0, this.currentFuel - 0.02);
          const fuelEl = document.getElementById(`${this.busId}-fuel`);
          if (fuelEl) fuelEl.innerHTML = `${Math.round(this.currentFuel)}<small>%</small>`;
          
          // Random updates
          if (Math.random() < 0.1) {
            this.updateSpeed();
            this.updateEngineTemp();
            this.updateStats();
          }
          
          if (Math.random() < 0.01) {
            this.updateTraffic();
            this.updateWeather();
          }
          
          if (elapsedTime >= timeToNext) {
            clearInterval(this.progressInterval);
            this.totalDistance += currentStop.distance;
            this.arrivedAtStop();
          }
        }, updateFrequency);
      }
      
      arrivedAtStop() {
        this.currentStopIndex++;
        
        // Update stop markers
        const stops = document.querySelectorAll(`#${this.busId}-stops .stop`);
        stops.forEach((stop, index) => {
          stop.classList.remove('current', 'passed');
          if (index < this.currentStopIndex) {
            stop.classList.add('passed');
          } else if (index === this.currentStopIndex) {
            stop.classList.add('current');
          }
        });
        
        this.addToHistory();
        this.updatePassengers();
        this.updateInfoPanel();
        this.updateStats();
        
        const statusEl = document.getElementById(`${this.busId}-status`);
        if (statusEl) statusEl.textContent = 'At Stop';
        
        setTimeout(() => {
          if (this.currentStopIndex < this.stops.length - 1) {
            if (statusEl) statusEl.textContent = 'Running';
            this.updateTraffic();
          }
          this.moveToNextStop();
        }, 2000);
      }
      
      handleArrival() {
        this.isMoving = false;
        const statusEl = document.getElementById(`${this.busId}-status`);
        if (statusEl) statusEl.textContent = 'Arrived';
        
        const etaElement = document.getElementById(`${this.busId}-eta`);
        if (etaElement) etaElement.textContent = 'Terminal';
        
        setTimeout(() => {
          this.resetRoute();
        }, 5000);
      }
      
      updateETA(secondsLeft) {
        const element = document.getElementById(`${this.busId}-eta`);
        if (!element) return;
        
        if (secondsLeft <= 0) {
          element.textContent = 'Arriving';
        } else {
          const minutes = Math.floor(secondsLeft / 60);
          const seconds = Math.floor(secondsLeft % 60);
          element.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      }
      
      updatePassengers() {
        const stop = this.stops[this.currentStopIndex];
        
        const exitingPassengers = Math.max(0, stop.avgPassengersOut + Math.floor(Math.random() * 7 - 3));
        const enteringPassengers = Math.max(0, stop.avgPassengersIn + Math.floor(Math.random() * 8 - 4));
        
        this.currentPassengers = Math.max(0, Math.min(this.maxPassengers, 
          this.currentPassengers - exitingPassengers + enteringPassengers));
        
        this.totalPassengersTransported += Math.max(0, enteringPassengers);
        
        // Update displays
        const passCountEl = document.getElementById(`${this.busId}-pass-count`);
        if (passCountEl) passCountEl.textContent = this.currentPassengers;
        
        const passengersEl = document.getElementById(`${this.busId}-passengers`);
        if (passengersEl) passengersEl.textContent = `${this.currentPassengers}/${this.maxPassengers}`;
        
        // Update passenger load icon
        const loadIcon = document.getElementById(`${this.busId}-load-icon`);
        if (loadIcon) {
          loadIcon.classList.remove('full', 'crowded');
          if (this.currentPassengers > this.maxPassengers * 0.8) {
            loadIcon.classList.add('crowded');
          } else if (this.currentPassengers > this.maxPassengers * 0.5) {
            loadIcon.classList.add('full');
          }
        }
      }
      
      updateSpeed() {
        const baseSpeed = this.trafficLevel === 'heavy' ? 25 : (this.trafficLevel === 'medium' ? 35 : 45);
        const variation = Math.floor(Math.random() * 20 - 10);
        this.currentSpeed = Math.max(20, Math.min(60, baseSpeed + variation));
        
        const speedEl = document.getElementById(`${this.busId}-speed`);
        if (speedEl) speedEl.innerHTML = `${this.currentSpeed} <small>km/h</small>`;
        
        this.speedHistory.push(this.currentSpeed);
        if (this.speedHistory.length > 20) {
          this.speedHistory.shift();
        }
      }
      
      updateEngineTemp() {
        this.engineTemp = 88 + Math.floor(Math.random() * 12);
        const engineEl = document.getElementById(`${this.busId}-engine`);
        if (engineEl) engineEl.innerHTML = `${this.engineTemp}<small>°C</small>`;
      }
      
      updateWeather() {
        const weatherIcons = ['☀️', '⛅', '☁️', '🌤️', '🌥️'];
        const weatherEl = document.getElementById(`${this.busId}-weather`);
        if (weatherEl) {
          weatherEl.textContent = weatherIcons[Math.floor(Math.random() * weatherIcons.length)];
        }
      }
      
      updateInfoPanel() {
        const currentStopEl = document.getElementById(`${this.busId}-current`);
        if (currentStopEl && this.stops[this.currentStopIndex]) {
          currentStopEl.textContent = this.stops[this.currentStopIndex].name;
        }
        
        const nextStopEl = document.getElementById(`${this.busId}-next`);
        if (nextStopEl) {
          if (this.currentStopIndex < this.stops.length - 1) {
            nextStopEl.textContent = this.stops[this.currentStopIndex + 1].name;
          } else {
            nextStopEl.textContent = 'Terminal';
          }
        }
      }
      
      updateOverallStats() {
        // This will be called by the global update function
        updateTotalBusStats();
      }
      
      resetRoute() {
        this.currentStopIndex = 0;
        this.currentPassengers = Math.floor(Math.random() * 15) + 5;
        this.totalDistance = 0;
        this.currentFuel = 50 + Math.floor(Math.random() * 40);
        this.totalPassengersTransported = this.currentPassengers;
        this.speedHistory = [];
        this.tripStartTime = Date.now();
        this.currentDelay = 0;
        
        const historyList = document.getElementById(`${this.busId}-history`);
        if (historyList) historyList.innerHTML = '';
        
        const stops = document.querySelectorAll(`#${this.busId}-stops .stop`);
        stops.forEach(stop => stop.classList.remove('current', 'passed'));
        if (stops[0]) stops[0].classList.add('current');
        
        this.updateBusPosition(0);
        this.updateInfoPanel();
        this.updatePassengers();
        this.updateStats();
        this.updateTraffic();
        
        setTimeout(() => {
          this.start();
        }, 2000);
      }
      
      start() {
        if (this.isMoving) return;
        this.isMoving = true;
        
        const firstStop = document.querySelector(`#${this.busId}-stop-0`);
        if (firstStop) firstStop.classList.add('current');
        
        const statusEl = document.getElementById(`${this.busId}-status`);
        if (statusEl) statusEl.textContent = 'Running';
        
        this.updateTraffic();
        
        setTimeout(() => {
          this.moveToNextStop();
        }, 1000);
      }
    }
    
    let bus1Tracker, bus2Tracker, bus3Tracker;
    
    // Update overall bus statistics
    function updateTotalBusStats() {
      // Total passengers
      const totalPassengers = (bus1Tracker?.currentPassengers || 0) + 
                            (bus2Tracker?.currentPassengers || 0) + 
                            (bus3Tracker?.currentPassengers || 0);
      const totalPassEl = document.getElementById('total-passengers');
      if (totalPassEl) totalPassEl.textContent = totalPassengers;
      
      // Total distance
      const totalDistance = (bus1Tracker?.totalDistance || 0) + 
                          (bus2Tracker?.totalDistance || 0) + 
                          (bus3Tracker?.totalDistance || 0);
      const totalDistEl = document.getElementById('total-distance');
      if (totalDistEl) totalDistEl.textContent = `${totalDistance.toFixed(1)} km`;
      
      // Average fuel
      const avgFuel = Math.round(((bus1Tracker?.currentFuel || 0) + 
                                 (bus2Tracker?.currentFuel || 0) + 
                                 (bus3Tracker?.currentFuel || 0)) / 3);
      const avgFuelEl = document.getElementById('avg-fuel');
      if (avgFuelEl) avgFuelEl.textContent = `${avgFuel}%`;
      
      // Average engine temp
      const avgTemp = Math.round(((bus1Tracker?.engineTemp || 0) + 
                                 (bus2Tracker?.engineTemp || 0) + 
                                 (bus3Tracker?.engineTemp || 0)) / 3);
      const avgTempEl = document.getElementById('avg-temp');
      if (avgTempEl) avgTempEl.textContent = `${avgTemp}°C`;
    }
    
    function loadTransportData(){
      // Initialize animated bus trackers with comprehensive data
      if (!bus1Tracker) {
        const route1Stops = [
          { name: 'Downtown', avgPassengersIn: 15, avgPassengersOut: 0, timeToNext: 60, distance: 2.5 },
          { name: 'Central', avgPassengersIn: 8, avgPassengersOut: 3, timeToNext: 90, distance: 3.2 },
          { name: 'Market St', avgPassengersIn: 12, avgPassengersOut: 5, timeToNext: 75, distance: 2.8 },
          { name: 'Tech Hub', avgPassengersIn: 5, avgPassengersOut: 7, timeToNext: 80, distance: 2.1 },
          { name: 'University', avgPassengersIn: 18, avgPassengersOut: 4, timeToNext: 70, distance: 1.9 },
          { name: 'Mall', avgPassengersIn: 8, avgPassengersOut: 15, timeToNext: 65, distance: 2.4 },
          { name: 'Terminal 1', avgPassengersIn: 6, avgPassengersOut: 10, timeToNext: 85, distance: 3.0 },
          { name: 'Terminal 2', avgPassengersIn: 0, avgPassengersOut: 25, timeToNext: 0, distance: 0 }
        ];
        
        bus1Tracker = new BusTracker('bus1', '42', route1Stops, '#ef4444');
        bus1Tracker.start();
      }
      
      if (!bus2Tracker) {
        const route2Stops = [
          { name: 'University', avgPassengersIn: 22, avgPassengersOut: 0, timeToNext: 50, distance: 1.8 },
          { name: 'Library', avgPassengersIn: 5, avgPassengersOut: 8, timeToNext: 70, distance: 2.2 },
          { name: 'Park Ave', avgPassengersIn: 7, avgPassengersOut: 4, timeToNext: 85, distance: 2.5 },
          { name: 'City Center', avgPassengersIn: 10, avgPassengersOut: 6, timeToNext: 60, distance: 1.9 },
          { name: 'Business Dist', avgPassengersIn: 12, avgPassengersOut: 9, timeToNext: 75, distance: 2.3 },
          { name: 'Innovation', avgPassengersIn: 4, avgPassengersOut: 7, timeToNext: 65, distance: 2.0 },
          { name: 'Tech Park', avgPassengersIn: 0, avgPassengersOut: 20, timeToNext: 0, distance: 0 }
        ];
        
        bus2Tracker = new BusTracker('bus2', '17', route2Stops, '#0ea5e9');
        setTimeout(() => bus2Tracker.start(), 3000);
      }
      
      if (!bus3Tracker) {
        const route3Stops = [
          { name: 'Station', avgPassengersIn: 8, avgPassengersOut: 0, timeToNext: 45, distance: 1.5 },
          { name: 'Park Ave', avgPassengersIn: 12, avgPassengersOut: 2, timeToNext: 55, distance: 1.7 },
          { name: 'Main St', avgPassengersIn: 3, avgPassengersOut: 5, timeToNext: 50, distance: 1.6 },
          { name: 'Oak Grove', avgPassengersIn: 6, avgPassengersOut: 4, timeToNext: 60, distance: 1.8 },
          { name: 'West End', avgPassengersIn: 15, avgPassengersOut: 3, timeToNext: 65, distance: 2.0 },
          { name: 'Lakeside', avgPassengersIn: 4, avgPassengersOut: 8, timeToNext: 55, distance: 1.7 },
          { name: 'Riverside Mall', avgPassengersIn: 0, avgPassengersOut: 18, timeToNext: 0, distance: 0 }
        ];
        
        bus3Tracker = new BusTracker('bus3', '85', route3Stops, '#10b981');
        setTimeout(() => bus3Tracker.start(), 5000);
      }
      
      // Keep existing subway data - remove this since we're replacing with metro tracking
      /*
      const subwayData = [
        { line:'Line 1', dest:'Central', time:3, color:'#0052A4' },
        { line:'Line 2', dest:'East End', time:6, color:'#00A84D' },
        { line:'Line 7', dest:'North Station', time:9, color:'#747F00' },
      ];
      
      const sub = $('#subwayArrivals');
      if(sub){ 
        sub.innerHTML='';
        subwayData.forEach(s=>{
          const item = document.createElement('div');
          item.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:12px; margin-bottom:8px; border-radius:10px; background:var(--card-bg); border:1px solid var(--border); backdrop-filter:blur(5px);';
          item.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="background:${s.color}; color:#fff; padding:4px 10px; border-radius:8px; font-weight:bold; font-size:12px;">${s.line}</span>
              <div>
                <div style="font-weight:600; font-size:14px;">${s.dest}</div>
                <div style="font-size:11px; opacity:0.7;">On Schedule</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:20px; font-weight:bold; color:#10b981;">${s.time}</div>
              <div style="font-size:11px; opacity:0.7;">minutes</div>
            </div>`;
          sub.appendChild(item);
        });
      }
      */

      // Initialize Metro Tracking System
      initializeMetroTracking();

      $('#transportNotices').innerHTML = [
        '• Route 42 express service during peak hours',
        '• Route 17 detour on Park Ave due to construction',
        '• Route 85 extended hours on weekends',
      ].join('<br>');
    }

    function loadWeatherData(){
      const w = { temp:22, icon:'☀️', desc:'Clear', feels:20, humidity:65, wind:12, uv:'Medium', air:'Good' };
      $('#weatherIcon').textContent = w.icon;
      $('#currentTemp').textContent = w.temp;
      $('#weatherDesc').textContent = w.desc;
      $('#feelsLike').textContent = w.feels + '°C';
      $('#humidity').textContent = w.humidity + '%';
      $('#windSpeed').textContent = w.wind + ' km/h';
      $('#uvIndex').textContent = w.uv;
      $('#airQuality').textContent = w.air;
      $('#miniWeather').textContent = w.icon;
      $('#miniTemp').textContent = w.temp + '°C';

      const hourly = [
        { time:'15:00', icon:'☀️', temp:23 },
        { time:'16:00', icon:'☀️', temp:24 },
        { time:'17:00', icon:'⛅', temp:23 },
        { time:'18:00', icon:'⛅', temp:22 },
        { time:'19:00', icon:'🌤️', temp:21 },
        { time:'20:00', icon:'🌙', temp:20 },
        { time:'21:00', icon:'🌙', temp:19 },
        { time:'22:00', icon:'🌙', temp:18 },
      ];
      
      const hc = $('#hourlyForecast');
      hc.innerHTML = '';
      hourly.forEach(h=>{ 
        const el = document.createElement('div');
        el.className='hourly-item';
        el.innerHTML = `<div class="hourly-time">${h.time}</div><div class="hourly-icon">${h.icon}</div><div class="hourly-temp">${h.temp}°</div>`;
        hc.appendChild(el);
      });

      const weekly = [
        'Monday: ☀️ 25° / 18° - Clear',
        'Tuesday: ⛅ 24° / 17° - Partly Cloudy',
        'Wednesday: ☁️ 22° / 16° - Cloudy',
        'Thursday: 🌧️ 20° / 15° - Rain',
        'Friday: ⛅ 23° / 16° - Partly Cloudy',
        'Saturday: ☀️ 26° / 18° - Clear',
        'Sunday: ☀️ 27° / 19° - Clear',
      ];
      $('#weeklyForecast').innerHTML = weekly.map(d=>`<div>${d}</div>`).join('');
    }

    function loadNewsData(){
      const news = [
        { category:'City', title:'Smart City Project Phase 2 Begins', summary:'The city launches expanded AI-based traffic systems and IoT sensor networks.', time:'30 min ago', isNew:true },
        { category:'Transport', title:'Public Transit Fares Frozen', summary:'City council votes to maintain current fare prices for another year.', time:'2 hours ago', isNew:true },
        { category:'Economy', title:'Tech Hub Attracts Major Investment', summary:'International tech companies announce new offices in the innovation district.', time:'4 hours ago', isNew:false },
        { category:'Culture', title:'Arts Festival Next Week', summary:'Annual cultural festival featuring local and international artists.', time:'6 hours ago', isNew:false },
      ];
      
      const list = $('#newsItems');
      list.innerHTML = '';
      news.forEach(n=>{ 
        const it = document.createElement('div');
        it.className='news-item';
        it.innerHTML = `
          ${n.isNew ? '<span class="news-new">New</span>' : ''}
          <div class='news-category' style='opacity:.8; font-size:12px;'>${n.category}</div>
          <div class='news-title' style='font-weight:800; margin:6px 0;'>${n.title}</div>
          <div class='news-summary' style='opacity:.9;'>${n.summary}</div>
          <div class='news-meta' style='display:flex; justify-content:space-between; opacity:.7; font-size:13px;'>
            <span>${n.time}</span>
            <span>Read more →</span>
          </div>`;
        list.appendChild(it);
      });
      
      $('#newsBadge').textContent = String(news.filter(n=>n.isNew).length);
      $('#trends').innerHTML = ['#1 Smart City','#2 Airport Expansion','#3 Tech District','#4 Public Transit','#5 Air Quality'].map(t=>`<div>${t}</div>`).join('');
      $('#todayEvents').innerHTML = ['10:00 - City Hall Briefing','14:00 - Smart City Forum','16:00 - Transport Policy Meeting','19:00 - Cultural Event Opening'].join('<br>');
    }

    function loadCultureData(){
      const data = [
        { icon:'💡', title:'Tip of the Day', content:'Use public transport during off-peak hours for a more comfortable journey.' },
        { icon:'📚', title:'Quote', content:'"A journey of a thousand miles begins with a single step" - Lao Tzu' },
        { icon:'🎭', title:'Featured Event', content:'Jazz Festival at Central Park this weekend.' },
        { icon:'🛡️', title:'History', content:'The city was founded in 1883 and has been a center of innovation.' },
        { icon:'🍜', title:'Food Spot', content:'Visit the historic market district for authentic local cuisine.' },
        { icon:'🌳', title:'Nature Walk', content:'Central Park offers 5km of scenic walking trails.' },
      ];
      
      const grid = $('#cultureGrid');
      grid.innerHTML = '';
      data.forEach(d=>{ 
        const card = document.createElement('div');
        card.className='culture-card';
        card.innerHTML = `
          <div style='font-size:52px; margin-bottom:10px;'>${d.icon}</div>
          <div style='font-weight:800; margin-bottom:8px;'>${d.title}</div>
          <div style='opacity:.95;'>${d.content}</div>`;
        grid.appendChild(card);
      });
      
      $('#weekEvents').innerHTML = [
        'Mon: Museum Free Entry',
        'Tue: Cinema Night',
        'Wed: Night Market',
        'Thu: Park Concert',
        'Fri: Youth Festival',
        'Sat: Farmers Market',
        'Sun: Street Performance'
      ].map(x=>`<div>${x}</div>`).join('');
    }

    // Live data updates
    function updateLive(){
      $$('.arrival-time').forEach(el=>{
        const n = parseInt(el.textContent,10);
        if(!Number.isNaN(n) && n>1) el.innerHTML = (n-1) + '<span class="arrival-unit">min</span>';
      });
      $('#lastUpdate').textContent = 'Just now';
      $('#activeUsers').textContent = `Active Users: ${100 + Math.floor(Math.random()*50)}`;
      $('#userCounter').textContent = `Users Online: ${120 + Math.floor(Math.random()*200)}`;
    }

    // Settings management
    function saveSettings(){
      showNotification('Settings', 'Settings saved successfully');
    }

    // Initialization
    function init(){
      // Apply theme
      applyTheme('dark');

      // Update time
      updateDateTime();
      setInterval(updateDateTime, 1000);

      // Tab buttons
      $$('.tab-button').forEach(btn => btn.addEventListener('click', () => activateTab(btn.getAttribute('data-tab'))));

      // Theme toggle
      $('#themeToggle').addEventListener('click', toggleTheme);

      // Quick access buttons
      $('#quickAccess').addEventListener('click', (e)=>{
        const b = e.target.closest('button');
        if(!b) return;
        const act = b.getAttribute('data-action');
        if(act==='search') openModal($('#searchModal'));
        if(act==='emergency') openModal($('#emergencyModal'));
        if(act==='settings') openModal($('#settingsModal'));
        if(act==='refresh'){ 
          loadTransportData();
          loadWeatherData();
          loadNewsData();
          loadCultureData();
          showNotification('Refresh','All data has been updated');
        }
        if(act==='fullscreen'){ 
          if(!document.fullscreenElement) document.documentElement.requestFullscreen();
          else document.exitFullscreen();
        }
      });
      
      // Keyboard shortcuts
      document.addEventListener('keydown', (e)=>{
        if(e.ctrlKey && (e.key==='k' || e.key==='K')){ e.preventDefault(); openModal($('#searchModal')); }
        if(e.altKey && (e.key==='e' || e.key==='E')){ e.preventDefault(); openModal($('#emergencyModal')); }
        if(e.altKey && (e.key==='s' || e.key==='S')){ e.preventDefault(); openModal($('#settingsModal')); }
        if(e.altKey && (e.key==='t' || e.key==='T')){ e.preventDefault(); toggleTheme(); }
        if(e.altKey && (e.key==='r' || e.key==='R')){ 
          e.preventDefault();
          loadTransportData();
          loadWeatherData();
          loadNewsData();
          loadCultureData();
          showNotification('Refresh','All data has been updated');
        }
        if(e.altKey && (e.key==='f' || e.key==='F')){ 
          e.preventDefault();
          if(!document.fullscreenElement) document.documentElement.requestFullscreen();
          else document.exitFullscreen();
        }
        if(e.key==='Escape'){ closeModals(); }
      });

      // Modal close handlers
      document.addEventListener('click', (e)=>{ 
        if(e.target.matches('[data-close]') || e.target.classList.contains('modal')) closeModals();
      });

      // Search enter key
      $('#globalSearchInput')?.addEventListener('keydown', (e)=>{ 
        if(e.key==='Enter'){ 
          showNotification('Search', `Searching for: "${e.target.value}"`);
          closeModals();
        }
      });

      // Settings change handlers
      ['#autoRefresh', '#notifications', '#soundEffects', '#languageSelect'].forEach(sel => {
        const el = $(sel);
        if(el) el.addEventListener('change', saveSettings);
      });

      // Load initial data
      loadTransportData();
      loadWeatherData();
      loadNewsData();
      loadCultureData();
      
      // Auto refresh
      setInterval(() => {
        if($('#autoRefresh').checked) updateLive();
      }, 30000);

      // Welcome notification
      setTimeout(()=> {
        if($('#notifications').checked) {
          showNotification('Welcome!', 'Connected to Smart City Information System');
        }
      }, 1200);
    }

    // Start the application
    document.addEventListener('DOMContentLoaded', init);