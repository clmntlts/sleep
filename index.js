// Ensure Supabase is loaded before using it
const { createClient } = window.supabase;

const SUPABASE_URL = "https://wvdggsrxtjdlfezenbbz.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2ZGdnc3J4dGpkbGZlemVuYmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNDc5NDcsImV4cCI6MjA1NTYyMzk0N30.4hJtANpuD5xx_J0Ukk6QoqTcnbV0gkjMeD2HcP5QxB8";

// Correctly initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function logout() {
    try {
        // Sign the user out using Supabase
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Error logging out:", error);
            alert("Logout failed, please try again.");
            return;
        }

        // Redirect user after successful logout
        alert("You have been logged out.");
        window.location.href = "auth.html"; // Redirect to the login page
    } catch (err) {
        console.error("Error during logout:", err);
        alert("An error occurred during logout.");
    }
}

async function loadUser() {
    try {
        const { data, error } = await supabase.auth.getUser();

        if (!data || !data.user) {
            window.location.href = "auth.html"; // Redirect if no user
            return null;
        }

        const user_id = data.user.id; // Retrieve user ID
        document.getElementById("username").innerText = data.user.email;

        console.log("User ID:", user_id);
        return user_id; // Return user ID for further use
    } catch (err) {
        console.error("Error loading user:", err);
        window.location.href = "auth.html";
        return null;
    }
}

async function loadUserData() {
    const user_id = await loadUser(); // Ensure user is loaded first
    if (!user_id) return; // Stop if no user

    console.log("Fetching data for user:", user_id);
    
    // Fetch and populate sleep records
    await loadUserSleepRecords(user_id);
}

async function loadUserSleepRecords(user_id) {
    const { data, error } = await supabase
        .from('sleep_record')
        .select('*')
        .eq('user_id', user_id)
        .order('day_count', { ascending: true }); // Corrected to `day_count` for ordering by DB field

    if (error) {
        console.error("Error fetching sleep records:", error);
        return;
    }

    if (data.length === 0) {
        // If no records exist, start with an empty day
        addDay();
        console.log("New user detected, starting with an empty day.");
    } else {
        // Populate existing sleep records
        data.forEach(record => {
            addDay(); // Creates a new day in the UI
            const currentDay = record.day_count; // Ensures consistency with database field

            // Update the UI elements for the new day

            // Convert bedtime and wake_time (time fields) into hours
            const bedtimeHours = convertTimeToHours(record.bedtime);
            const wakeTimeHours = convertTimeToHours(record.wake_time);

            // Update position of markers based on bedtime and wake_time
            document.getElementById(`bedtime${currentDay}`).setAttribute("cx", `${(bedtimeHours / 24) * 100}%`);
            document.getElementById(`wakeTime${currentDay}`).setAttribute("cx", `${(wakeTimeHours / 24) * 100}%`);

            // Update the time in bed display
            const timeInBed = (wakeTimeHours - bedtimeHours + (wakeTimeHours < bedtimeHours ? 24 : 0)); // Correct for crossing midnight
            document.getElementById(`timeInBed${currentDay}`).innerText = timeInBed.toFixed(2); // Showing hours with 2 decimals

            // Update sleep quality
            document.getElementById(`sleepQuality${currentDay}`).value = record.sleep_quality;
            document.getElementById(`sleepQualityLabel${currentDay}`).innerText = record.sleep_quality;

            // Update morning fatigue
            document.getElementById(`morningFatigue${currentDay}`).value = record.morning_fatigue;
            document.getElementById(`morningFatigueLabel${currentDay}`).innerText = record.morning_fatigue;

            // Display bedtime and wake-up time in formatted hours
            document.getElementById(`bedtimeTime${currentDay}`).innerText = calculateTime(bedtimeHours);
            document.getElementById(`wakeTimeTime${currentDay}`).innerText = calculateTime(wakeTimeHours);
        });
    }
}

// Ensure data is loaded when the page loads
window.onload = async () => {
    await loadUserData();
};

// Add a new day entry
let dayCount = 0;

function addDay() {
    dayCount++;
    const diary = document.getElementById("diary");

    const dayDiv = document.createElement("div");
    dayDiv.className = "day";
    dayDiv.innerHTML = `
        <h3>Day ${dayCount}</h3>
        <label class="switch">
            <input type="checkbox" id="saveToggle${dayCount}" onchange="toggleSave(${dayCount})">
            <span class="slider round"></span>
        </label>
        <span>Save</span>

        <div class="timeline-container">
            <div class="timeline-labels">
                <span>12 PM</span><span>12 AM</span><span>12 PM</span>
            </div>
            <svg width="100%" height="60" id="timeline${dayCount}">
                <line x1="0" x2="100%" y1="30" y2="30" stroke="black" stroke-width="3"/>
                <circle cx="50%" cy="30" r="8" fill="blue" id="bedtime${dayCount}" class="marker" 
                    onmousedown="startDrag(event, 'bedtime${dayCount}', ${dayCount})"/>
                <circle cx="50%" cy="30" r="8" fill="red" id="wakeTime${dayCount}" class="marker" 
                    onmousedown="startDrag(event, 'wakeTime${dayCount}', ${dayCount})"/>
            </svg>
        </div>
        <div class="sleep-info">
            <p>Time in Bed: <span id="timeInBed${dayCount}">0</span> hours</p>
            <p>Bedtime: <span id="bedtimeTime${dayCount}">0</span></p>
            <p>Wake-up Time: <span id="wakeTimeTime${dayCount}">0</span></p>
            <p>Sleep Quality: 
                <input type="range" min="0" max="10" step="1" id="sleepQuality${dayCount}" value="5" 
                oninput="updateSleepQuality(${dayCount})">
                <span id="sleepQualityLabel${dayCount}">5</span>
            </p>
            <p>Morning Fatigue: 
                <input type="range" min="0" max="10" step="1" id="morningFatigue${dayCount}" value="5" 
                oninput="updateMorningFatigue(${dayCount})">
                <span id="morningFatigueLabel${dayCount}">5</span>
            </p>
        </div>
    `;

    diary.appendChild(dayDiv);
}

function startDrag(event, markerId, dayId) {
    event.preventDefault();
    const svg = document.getElementById(`timeline${dayId}`);
    const marker = document.getElementById(markerId);

    const timelineRect = svg.getBoundingClientRect();
    const minX = timelineRect.left; 
    const maxX = timelineRect.right; 

    function moveMarker(e) {
        let newX = e.clientX;
        if (newX < minX) newX = minX;
        if (newX > maxX) newX = maxX;

        let percentage = (newX - minX) / (maxX - minX); // Normalize 0-1
        marker.setAttribute("cx", `${percentage * 100}%`); // Move SVG element
        updateSleepTime(dayId);
    }

    function stopDrag() {
        document.removeEventListener("mousemove", moveMarker);
        document.removeEventListener("mouseup", stopDrag);
    }

    document.addEventListener("mousemove", moveMarker);
    document.addEventListener("mouseup", stopDrag);
}

// Helper function to convert time (HH:MM:SS) into hours as a float
function convertTimeToHours(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
}

// Helper function to format time as hours:minutes
function calculateTime(hour) {
    const totalMinutes = Math.round(hour * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
}

function updateSleepTime(dayId) {
    const bedtime = document.getElementById(`bedtime${dayId}`);
    const wakeTime = document.getElementById(`wakeTime${dayId}`);
    const timeInBedLabel = document.getElementById(`timeInBed${dayId}`);

    let bedtimeX = parseFloat(bedtime.getAttribute("cx")) / 100;
    let wakeTimeX = parseFloat(wakeTime.getAttribute("cx")) / 100;

    let bedtimeHours = bedtimeX * 24; // Convert percentage to hours (0-24)
    let wakeTimeHours = wakeTimeX * 24; // Convert percentage to hours (0-24)

    if (wakeTimeHours < bedtimeHours) wakeTimeHours += 24; // Handle next-day wake-up

    let timeInBed = (wakeTimeHours - bedtimeHours); // Hours in bed
    timeInBedLabel.innerText = timeInBed.toFixed(2); // Show time in hours with 2 decimals

    // Calculate and display formatted bedtime and wake-up time
    document.getElementById(`bedtimeTime${dayId}`).innerText = calculateTime(bedtimeHours);
    document.getElementById(`wakeTimeTime${dayId}`).innerText = calculateTime(wakeTimeHours);

    // Update the position of markers to reflect correct times
    document.getElementById(`bedtime${dayId}`).setAttribute("cx", `${(bedtimeHours / 24) * 100}%`);
    document.getElementById(`wakeTime${dayId}`).setAttribute("cx", `${(wakeTimeHours / 24) * 100}%`);
}


// Update sleep quality for a specific day
function updateSleepQuality(dayId) {
    const quality = document.getElementById(`sleepQuality${dayId}`).value;
    document.getElementById(`sleepQualityLabel${dayId}`).textContent = quality;
}

// Update morning fatigue for a specific day
function updateMorningFatigue(dayId) {
    const fatigue = document.getElementById(`morningFatigue${dayId}`).value;
    document.getElementById(`morningFatigueLabel${dayId}`).textContent = fatigue;
}

async function toggleSave(dayId) {
    const toggle = document.getElementById(`saveToggle${dayId}`).checked;
    const user_id = await loadUser();

    if (!user_id) return;

    const bedtimeHours = parseFloat(document.getElementById(`bedtimeTime${dayId}`).innerText);
    const wakeTimeHours = parseFloat(document.getElementById(`wakeTimeTime${dayId}`).innerText);
    const sleep_quality = parseInt(document.getElementById(`sleepQuality${dayId}`).value);
    const morning_fatigue = parseInt(document.getElementById(`morningFatigue${dayId}`).value);

    if (toggle) {
        // Save to Supabase
        const { error } = await supabase
            .from('sleep_record')
            .upsert([
                {
                    user_id: user_id,
                    day_count: dayId,
                    bedtime: `${Math.floor(bedtimeHours)}:${(bedtimeHours % 1) * 60}`,
                    wake_time: `${Math.floor(wakeTimeHours)}:${(wakeTimeHours % 1) * 60}`,
                    sleep_quality: sleep_quality,
                    morning_fatigue: morning_fatigue,
                }
            ]);

        if (error) {
            console.error("Error saving data:", error);
            alert("Failed to save data.");
        } else {
            console.log(`Data for Day ${dayId} saved successfully.`);
        }
    } else {
        // Remove from Supabase
        const { error } = await supabase
            .from('sleep_record')
            .delete()
            .eq('user_id', user_id)
            .eq('day_count', dayId);

        if (error) {
            console.error("Error deleting data:", error);
            alert("Failed to delete data.");
        } else {
            console.log(`Data for Day ${dayId} deleted.`);
        }
    }
}
