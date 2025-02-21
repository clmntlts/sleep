
// Create a new sleep period (movable and resizable)
function addSleepPeriod(dayId) {
    const timeline = document.getElementById(`timeline${dayId}`);
    const bedtime = document.getElementById(`bedtime${dayId}`);
    const wakeTime = document.getElementById(`wakeTime${dayId}`);

    // Get positions of bedtime and wakeTime markers on the timeline
    const timelineWidth = timeline.offsetWidth;
    const bedtimePosition = bedtime.offsetLeft / timelineWidth * 24;
    const wakeTimePosition = wakeTime.offsetLeft / timelineWidth * 24;

    // Calculate the sleep duration and position
    const sleepDuration = (wakeTimePosition - bedtimePosition + 24) % 24;
    const sleepStart = bedtimePosition * (timelineWidth / 24);
    const sleepEnd = sleepStart + (sleepDuration * (timelineWidth / 24));

    // Create sleep period div
    const sleepPeriod = document.createElement('div');
    sleepPeriod.className = 'sleepPeriod';
    sleepPeriod.style.left = `${sleepStart}px`;
    sleepPeriod.style.width = `${sleepEnd - sleepStart}px`;

    // Store initial start position in a custom property
    sleepPeriod.dataset.startPosition = sleepStart;

    // Add resize handles (on both ends)
    const resizeStartHandle = document.createElement('div');
    resizeStartHandle.className = 'resizeHandle';
    resizeStartHandle.style.left = '0';
    sleepPeriod.appendChild(resizeStartHandle);

    const resizeEndHandle = document.createElement('div');
    resizeEndHandle.className = 'resizeHandle';
    resizeEndHandle.style.right = '0';
    sleepPeriod.appendChild(resizeEndHandle);

    // Resize at the start of the sleep period
    resizeStartHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = sleepPeriod.offsetWidth;
        const startLeft = sleepPeriod.offsetLeft;

        function onMouseMove(e) {
            const deltaX = e.clientX - startX;
            const newLeft = startLeft + deltaX;
            const newWidth = startWidth - deltaX;

            if (newLeft >= 0 && newWidth >= 0) {
                sleepPeriod.style.left = newLeft + 'px';
                sleepPeriod.style.width = newWidth + 'px';
                updateSleepPeriod(sleepPeriod, dayId);
            }
        }

        document.addEventListener('mousemove', onMouseMove);

        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', onMouseMove);
            updateStatistics(dayId);
        }, { once: true });
    });

    // Resize at the end of the sleep period
    resizeEndHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = sleepPeriod.offsetWidth;

        function onMouseMove(e) {
            const deltaX = e.clientX - startX;
            const newWidth = startWidth + deltaX;

            if (newWidth >= 0 && newWidth <= timeline.offsetWidth - sleepPeriod.offsetLeft) {
                sleepPeriod.style.width = newWidth + 'px';
                updateSleepPeriod(sleepPeriod, dayId);
            }
        }

        document.addEventListener('mousemove', onMouseMove);

        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', onMouseMove);
            updateStatistics(dayId);
        }, { once: true });
    });

    // Make the sleep period div movable
    sleepPeriod.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startLeft = sleepPeriod.offsetLeft;

        function onMouseMove(e) {
            const newLeft = startLeft + (e.clientX - startX);
            // Ensure the sleep period is within the bounds of the timeline (dayDiv)
            if (newLeft >= 0 && newLeft <= timeline.offsetWidth - sleepPeriod.offsetWidth) {
                sleepPeriod.style.left = newLeft + 'px';
                updateSleepPeriod(sleepPeriod, dayId);
            }
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', onMouseMove);
            updateStatistics(dayId);
        }, { once: true });
    });

    // Add the sleep period to the timeline
    timeline.appendChild(sleepPeriod);

    updateGlobalStatistics(); // Update global stats
}

// Update sleep period information and statistics
function updateSleepPeriod(sleepPeriod, dayId) {
    const timelineWidth = document.getElementById(`timeline${dayId}`).offsetWidth;

    // Get the start and end positions as percentage of the total timeline width
    const sleepStart = sleepPeriod.dataset.startPosition;  // Keep the start position fixed
    const sleepEnd = (sleepPeriod.offsetLeft + sleepPeriod.offsetWidth) / timelineWidth * 24;

    // Ensure both sleepStart and sleepEnd are within the 0-24 range
    let totalSleep = sleepEnd - sleepStart;
    if (totalSleep < 0) { // This handles crossing midnight
        totalSleep += 24; // Add 24 hours to adjust
    }

    // Ensure total sleep is always between 0 and 24 hours
    if (totalSleep > 24) {
        totalSleep = 24;
    }

    // Display total sleep time in hours (rounded to one decimal place)
    document.getElementById(`totalSleep${dayId}`).textContent = totalSleep.toFixed(1);
}


// Update statistics for each day (Time in Bed, Total Sleep, etc.)
function updateStatistics(dayId) {
    const timeline = document.getElementById(`timeline${dayId}`);
    const bedtime = document.getElementById(`bedtime${dayId}`);
    const wakeTime = document.getElementById(`wakeTime${dayId}`);
    const timeInBedElement = document.getElementById(`timeInBed${dayId}`);
    
    const timelineWidth = timeline.offsetWidth;
    const bedtimePosition = bedtime.offsetLeft / timelineWidth * 24;
    const wakeTimePosition = wakeTime.offsetLeft / timelineWidth * 24;

    // Calculate Time in Bed (from bedtime to wake time)
    let timeInBed = (wakeTimePosition - bedtimePosition + 24) % 24;
    timeInBedElement.textContent = timeInBed.toFixed(1);

    // Calculate total sleep time
    let totalSleep = 0;
    const sleepPeriods = timeline.getElementsByClassName('sleepPeriod');
    for (const sleepPeriod of sleepPeriods) {
        const sleepStart = sleepPeriod.dataset.startPosition;
        const sleepEnd = (sleepPeriod.offsetLeft + sleepPeriod.offsetWidth) / timelineWidth * 24;
        totalSleep += (sleepEnd - sleepStart + 24) % 24;
    }
    document.getElementById(`totalSleep${dayId}`).textContent = totalSleep.toFixed(1);

    updateGlobalStatistics(); // Update global statistics
}

// Update global statistics (averages including VAS)
function updateGlobalStatistics() {
    let totalTIB = 0, totalSleep = 0, totalSleepQuality = 0, totalMorningFatigue = 0, days = 0;
    for (let i = 1; i <= dayCount; i++) {
        const timeInBed = parseFloat(document.getElementById(`timeInBed${i}`).textContent);
        const sleepQuality = parseInt(document.getElementById(`sleepQuality${i}`).value);
        const morningFatigue = parseInt(document.getElementById(`morningFatigue${i}`).value);

        if (!isNaN(timeInBed)) {
            totalTIB += timeInBed;
            totalSleep += parseFloat(document.getElementById(`totalSleep${i}`).textContent);
            totalSleepQuality += sleepQuality;
            totalMorningFatigue += morningFatigue;
            days++;
        }
    }
    if (days > 0) {
        document.getElementById("avgTIB").textContent = (totalTIB / days).toFixed(1);
        document.getElementById("avgSleep").textContent = (totalSleep / days).toFixed(1);
        document.getElementById("avgSleepQuality").textContent = (totalSleepQuality / days).toFixed(1);
        document.getElementById("avgMorningFatigue").textContent = (totalMorningFatigue / days).toFixed(1);
    }
}
