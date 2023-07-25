var SCHOOL_START_TIME = "--"; // Set the school start time in 12-hour format
var SCHOOL_END_TIME = ''
var VIDEO_DURATION = ''
var fetchedSchoolStartTime = false
const width = window.innerWidth;
const height = window.innerHeight;

function createYouTubeVideoIframe(videoId, width, height) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&modestbranding=1&fs=1&showinfo=0&enablejsapi=1&origin=http%3A%2F%2Flocalhost%3A5500&widgetid=1'`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.width = window.innerWidth;
    iframe.height = window.innerHeight;
    iframe.frameBorder = 0;
    return iframe;
}

function requestFullScreen(element) {
    var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullscreen;

    if (requestMethod) { // Native full screen.
        requestMethod.call(element);
    } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
        var wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }
}

function makeFullScreen() {
    var elem = document.body;
    elem.click()
    requestFullScreen(elem);
}

function playYouTubeVideoInFullscreen(videoId, width, height) {
    const iframe = createYouTubeVideoIframe(videoId, width, height);
    document.getElementById('video-container').innerHTML = '';
    document.getElementById('video-container').appendChild(iframe);
    makeFullScreen()
}

// Function to calculate the remaining time until the video starts
function getRemainingTime(currentTime, schoolStartTime) {
    var isNextDay = false
    const current = new Date('1970-01-01 ' + currentTime);
    let start = new Date('1970-01-01 ' + schoolStartTime);

    // Check if the school start time is before the current time
    // If so, assume the school start time is on the next day
    if (start.getTime() < current.getTime()) {
        start = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        isNextDay = true
    }

    let diff = (start.getTime() - current.getTime()) / 1000;

    const hours = Math.floor(diff / 3600);
    diff = diff % 3600;
    const minutes = Math.floor(diff / 60);

    return (!isNaN(hours) && !isNaN(minutes)) ? `${hours} hours ${minutes} mins ${isNextDay ? "(Next Day)" : ""}` : "--";
}


var intervalId; // Global variable to store the interval ID
var videoPlaying = false; // Global variable to track if the video is currently being shown

function startProcess() {

    // Show the loading image
    document.getElementById('start_btn').innerHTML = '';
    if (!videoPlaying) {
        makeFullScreen()
        document.getElementById('loadingImage').style.display = 'inline';
        document.querySelector(".middle-container").classList.remove("bottom-50")
        document.querySelector(".middle-container").classList.remove("end-50")
        document.querySelector(".middle-container").style.top = '45%';
        document.querySelector(".middle-container").style.left = '40%';
        document.querySelector(".middle-container").classList.remove('d-none')
    } else {
        document.querySelector(".middle-container").classList.add('d-none')
    }

    if (!fetchedSchoolStartTime) {
        getSchoolStartTimeFromAPI();
    }

    intervalId = setInterval(() => {
        const currentTime = getCurrentTime();
        const remainingTime = getRemainingTime(currentTime, SCHOOL_START_TIME);

        // Display the time information
        document.querySelector("#currentTime").innerText = `Current Time: ${currentTime}
        School Start Time: ${SCHOOL_START_TIME}
        Video Starts in: ${remainingTime}`;

        // Check if the current time matches the school start time and video is not already playing
        if (currentTime === SCHOOL_START_TIME && !videoPlaying) {
            // Stop the interval and set videoPlaying to true
            clearInterval(intervalId);
            videoPlaying = true;
            fetch(`https://script.google.com/macros/s/${SCRIPT_ID}/exec?action=getScheduledVideoId`)
                .then(response => response.json())
                .then(data => {
                    const videoId = data.video_id; // Assuming the API response returns a property 'videoId' with the actual YouTube video ID
                    if (videoId != 'Not Found' && videoId) {
                        playYouTubeVideoInFullscreen(videoId, width, height);
                    }
                })
                .catch(error => {
                    console.error('Error fetching video ID from the API:', error);
                })
                .finally(() => {
                    // Hide the loading image and restore the start button text

                    document.getElementById('loadingImage').style.display = 'none';
                    document.getElementById('start_btn').innerHTML = '';
                    document.querySelector(".middle-container").classList.add("bottom-50")
                    document.querySelector(".middle-container").classList.add("end-50")

                    // Set videoPlaying to false and start the interval again
                    intervalId = setInterval(startProcess, 1000);
                });
        }
        // Check if the current time matches the school end time
        if (currentTime === SCHOOL_END_TIME) {
            console.log('siu sesh')
            document.getElementById('video-container').innerHTML = '';
            videoPlaying = false;
            fetchedSchoolStartTime = false
        }
    }, 1000);
}



function getCurrentTime(utcOffset = -7) {
    var now = new Date();
    var offsetMillis = utcOffset * 60 * 60 * 1000;
    var localMillis = now.getTime() + now.getTimezoneOffset() * 60 * 1000 + offsetMillis;
    var localDate = new Date(localMillis);

    var hours = localDate.getHours();
    var minutes = localDate.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0 hours)
    minutes = minutes < 10 ? '0' + minutes : minutes;

    var localTime = hours + ':' + minutes + ' ' + ampm;
    return localTime;
}

function calculateEndTime(startTime, duration) {
    const start = new Date('1970-01-01 ' + startTime);

    let hours = 0;
    let minutes = 0;

    // Parse the duration format "1h2m" or "2h" or "30m"
    const hoursMatch = duration.match(/(\d+)h/);
    const minutesMatch = duration.match(/(\d+)m/);

    if (hoursMatch) {
        hours = parseInt(hoursMatch[1]);
    }

    if (minutesMatch) {
        minutes = parseInt(minutesMatch[1]);
    }

    // Add the duration to the start time
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000);

    // If the end time goes beyond 24 hours, adjust the date
    if (end.getDate() !== start.getDate()) {
        end.setDate(start.getDate() + 1); // Add one day
        end.setMonth(start.getMonth());
        end.setFullYear(start.getFullYear());
    }

    let endHours = end.getHours();
    let endMinutes = end.getMinutes();
    let ampm = "AM";

    // Convert to 12-hour format and determine AM/PM
    if (endHours >= 12) {
        ampm = "PM";
    }

    if (endHours > 12) {
        endHours -= 12;
    } else if (endHours === 0) {
        endHours = 12;
    }

    endHours = endHours.toString().padStart(2, '0');
    endMinutes = endMinutes.toString().padStart(2, '0');

    return endHours + ':' + endMinutes + ' ' + ampm;
}

function getSchoolStartTimeFromAPI() {
    if (SCRIPT_ID) {
        fetch(`https://script.google.com/macros/s/${SCRIPT_ID}/exec?action=getSchoolStartAndEndTime`)
            .then(response => response.json())
            .then(data => {
                if (data.start_time) {
                    fetchedSchoolStartTime = true;
                    SCHOOL_START_TIME = data.start_time.start_time;
                    VIDEO_DURATION = data.start_time.end_time;
                    SCHOOL_END_TIME = calculateEndTime(SCHOOL_START_TIME, VIDEO_DURATION);
                    console.log("School Start Time: " + SCHOOL_START_TIME);
                    console.log("VIDEO_DURATION: " + VIDEO_DURATION);
                    console.log("School End Time: " + SCHOOL_END_TIME);
                } else {
                    console.log("No schedule for today...")
                }
            })
            .catch(error => {
                console.error('Error fetching school start time from the API:', error);
            });
    }
}

// Call the function to get the school start time from the API and compare it with the current time
getSchoolStartTimeFromAPI();
