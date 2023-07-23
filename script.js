function createYouTubeVideoIframe(videoId, width, height, autoplay = false) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0${autoplay ? '&autoplay=1' : ''}`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.width = width;
    iframe.height = height;
    iframe.frameBorder = 0;
    return iframe;
}

function requestFullScreen(element) {
    // Supports most browsers and their versions.
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
// FullScreen function
function makeFullScreen() {
    document.getElementsByTagName("iframe")[0].className = "fullScreen";
    var elem = document.body;
    requestFullScreen(elem);
}


const videoId = 'c3_v_9Vk-pc';
// const width = 640;
// const height = 360;
const width = window.innerWidth;
const height = window.innerHeight;
const autoplay = true; // Set to true if you want the video to autoplay, otherwise, omit this argument or set it to false.

function playYouTubeVideoInFullscreen(videoId, width, height) {
    const iframe = createYouTubeVideoIframe(videoId, width, height, true); // Set autoplay to true
    document.getElementById('video-container').innerHTML = ''
    document.getElementById('video-container').appendChild(iframe);
    makeFullScreen()
    // Play the video
    iframe.addEventListener('load', () => {
        iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        iframe.requestFullscreen();

    });

    // Request fullscreen after the video starts playing
    iframe.addEventListener('play', () => {
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
        } else if (iframe.mozRequestFullScreen) {
            iframe.mozRequestFullScreen();
        } else if (iframe.webkitRequestFullscreen) {
            iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) {
            iframe.msRequestFullscreen();
        }
    });
}

playYouTubeVideoInFullscreen(videoId, width, height, autoplay)
