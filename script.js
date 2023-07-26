var SCHOOL_START_TIME = "--"; // Set the school start time in 12-hour format
var NEXT_DATE = ''
var SCHOOL_END_TIME = ''
var VIDEO_DURATION = ''
var NEXT_SCHOOL_SCHEDULE = ''
var NEXT_DAY_MESSAGE = ''
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

function getRemainingTime(currentTime, schoolStartTime) {
    const current = new Date(checkTodayLocalDate() + " " + currentTime);
    let start = new Date(NEXT_DATE + " " + schoolStartTime);
    console.log("current: " + current)
    console.log("start: " + start)
    console.log(checkTodayLocalDate() + " " + currentTime)
    console.log(NEXT_DATE + " " + schoolStartTime)
    // console.log(NEXT_DATE)
    // Check if the school start time is before the current time
    // If so, assume the school start time is on the next day
    if (start.getTime() < current.getTime()) {
        start = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    }

    let diff = (start.getTime() - current.getTime()) / 1000;
    const days = Math.floor(diff / 86400);
    diff = diff % 86400;
    const hours = Math.floor(diff / 3600);
    diff = diff % 3600;
    const minutes = Math.floor(diff / 60);

    // return (!isNaN(days) && !isNaN(hours) && !isNaN(minutes)) ? `${days} days ${hours} hours ${minutes} mins` : "--";
    return `${days} days ${hours} hours ${minutes} mins`;
}



var intervalId; // Global variable to store the interval ID
var videoPlaying = false; // Global variable to track if the video is currently being shown

function startProcess() {

    console.log(currentTime)
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
        Next School Day: ${NEXT_DAY_MESSAGE ? NEXT_DAY_MESSAGE + " " : ""} ${NEXT_SCHOOL_SCHEDULE ? "(" + NEXT_SCHOOL_SCHEDULE + ")" : ""}
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

                    // Check if the current time matches the school end time
                    if (currentTime === SCHOOL_END_TIME) {
                        document.getElementById('video-container').innerHTML = '';
                        videoPlaying = false;
                        fetchedSchoolStartTime = false
                    }
                    // Set videoPlaying to false and start the interval again
                    intervalId = setInterval(startProcess, 1000);
                });
        }

        // Check if the current time matches the school end time
        if (currentTime === SCHOOL_END_TIME) {
            document.getElementById('video-container').innerHTML = '';
            videoPlaying = false;
            fetchedSchoolStartTime = false
        }
    }, 1000);
}

function checkTodayLocalDate(offset = -7) {
    var today = new Date();
    var utc = today.getTime() + (today.getTimezoneOffset() * 60000);
    today = new Date(utc + (3600000 * offset));

    var month = (today.getMonth() + 1).toString().padStart(2, '0');
    var day = today.getDate().toString().padStart(2, '0');
    var year = today.getFullYear();

    // Return the date in MM/dd/yyyy format
    return `${month}/${day}/${year}`;
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
                if (data.time) {
                    fetchedSchoolStartTime = true;
                    SCHOOL_START_TIME = data.time.start_time;
                    VIDEO_DURATION = data.time.video_duration;
                    NEXT_DAY_MESSAGE = data.next_day_data.next_day_message;
                    NEXT_SCHOOL_SCHEDULE = data.next_day_data.next_day_schedule;
                    NEXT_DATE = data.next_day_data.next_day;
                    SCHOOL_END_TIME = calculateEndTime(SCHOOL_START_TIME, VIDEO_DURATION);
                    // console.log("School Start Time: " + SCHOOL_START_TIME);
                    // console.log("VIDEO_DURATION: " + VIDEO_DURATION);
                    // console.log("School End Time: " + SCHOOL_END_TIME);
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
