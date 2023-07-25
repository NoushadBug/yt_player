var SCHOOL_START_TIME = "--"; // Set the school start time in 12-hour format
var fetchedSchoolStartTime = false


const width = window.innerWidth;
const height = window.innerHeight;

function createYouTubeVideoIframe(videoId, width, height) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&modestbranding=1&fs=1&showinfo=0&enablejsapi=1&origin=http%3A%2F%2Flocalhost%3A5500&widgetid=1'`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.width = width;
    iframe.height = height;
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
    document.getElementsByTagName("iframe")[0].className = "fullScreen";
    var elem = document.body;
    elem.click()
    requestFullScreen(elem);
}

function playYouTubeVideoInFullscreen(videoId, width, height) {
    const iframe = createYouTubeVideoIframe(videoId, width, height);
    document.getElementById('video-container').innerHTML = '';
    document.getElementById('video-container').appendChild(iframe);
    makeFullScreen();
}

// Function to calculate the remaining time until the video starts
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

    return `${hours} hours ${minutes} mins ${isNextDay ? "(Next Day)" : ""}`;
}


let intervalId = null;

function startProcess() {
    // Show the loading image
    document.getElementById('start_btn').innerHTML = '';
    document.getElementById('loadingImage').style.display = 'inline';
    document.querySelector(".middle-container").classList.remove("bottom-50")
    document.querySelector(".middle-container").classList.remove("end-50")
    document.querySelector(".middle-container").style.top = '45%';
    document.querySelector(".middle-container").style.left = '40%';

    if (!fetchedSchoolStartTime) {
        getSchoolStartTimeFromAPI()
    }

    intervalId = setInterval(() => {
        const currentTime = getCurrentTime();
        const remainingTime = getRemainingTime(currentTime, SCHOOL_START_TIME);

        // Display the time information
        document.querySelector("#currentTime").innerText = `Current Time: ${currentTime}
        School Start Time: ${SCHOOL_START_TIME}
        Video Starts in: ${remainingTime}`;

        // Check if the current time matches the school start time
        if (currentTime === SCHOOL_START_TIME) {
            clearInterval(intervalId); // Stop the interval
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
                    document.querySelector("#currentTime").innerHTML = ''
                    // Hide the loading image and restore the start button text
                    document.getElementById('loadingImage').style.display = 'none';
                    document.getElementById('start_btn').innerHTML = '';

                    document.querySelector(".middle-container").classList.add("bottom-50")
                    document.querySelector(".middle-container").classList.add("end-50")
                });
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

function getSchoolStartTimeFromAPI() {
    if (SCRIPT_ID) {
        fetch(`https://script.google.com/macros/s/${SCRIPT_ID}/exec?action=getSchoolStartTime`)
            .then(response => response.json())
            .then(data => {
                fetchedSchoolStartTime = true;
                SCHOOL_START_TIME = data.start_time;
                console.log("School Start Time: " + SCHOOL_START_TIME);
            })
            .catch(error => {
                console.error('Error fetching school start time from the API:', error);
            });
    }
}

// Call the function to get the school start time from the API and compare it with the current time
getSchoolStartTimeFromAPI();
