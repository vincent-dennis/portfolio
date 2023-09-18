const spotifyUrl = 'https://open.spotify.com/playlist/';
const clientIdSp = '958ae92557d541f98c5ddbd3f81e1354';
const clientIdYt = '443415828688-go8lm8j0ouchvhp3tkiboc36glfjq7qk.apps.googleusercontent.com';
const redirectUriSp = chrome.identity.getRedirectURL("spotify");
const redirectUriYt = chrome.identity.getRedirectURL("youtube");
const scopeSp = 'playlist-read-private';
const scopeYt = 'https://www.googleapis.com/auth/youtube';
let codeVerifier = generateRandomString(128);
let state = generateRandomString(16);
let playlistId = '';

const ly = document.getElementById("loginYt");
const ls = document.getElementById("loginSp");
const npl = document.getElementById("notPlaylist");
const inv = document.getElementById("invalid");
const pl = document.getElementById("playlist");
const btnSp = document.getElementById("btnSp");
const btnYt = document.getElementById("btnYt");
const btnGen = document.getElementById("btnGen");

actionClicked();

// the main function
function actionClicked() {
    // check if on a spotify playlist tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
            if (tabs[0].url.startsWith(spotifyUrl)) {
                playlistId = getPlaylistId(tabs[0].url);
                // button to get an access token if haven't
                if (!checkAccessSp()) {
                    displayLoginSp();
                }
                else if (!checkAccessYt()) {
                    displayLoginYt();
                }
                else {
                    readyToGenerate();
                }
            }

            // not on a spotify playlist
            else {
                npl.style.display = "block";
            }
        }
    });
}

// Generate playlist
btnGen.addEventListener('click', () => {
    // check if the tokens have expired
    if (!checkAccessSp || !checkAccessYt) {
        actionClicked();
        return;
    }

    let playlistName = toString(Date.now);
    let playlistIdYt = "";
    var tracksSp = {};
    var tracksYt = [];

    // get tracks in the playlist
    fetch("https://api.spotify.com/v1/playlists/" + playlistId + "/tracks", {
        method: "GET",
        headers: {
            "Authorization": "Bearer  " + localStorage.getItem('access_token_sp')
        }
    })
    .then((response) => response.json())
    .then((json) => {
        // fail to obtain data
        if (json.hasOwnProperty('error')) {
            failedToObtain();
            throw new Error("Error when getting tracks");
        }

        // data obtained
        let trackNum = json.total > 50 ? 50 : json.total;
        for (let i = 0; i < trackNum; i++) {
            tracksSp[json.items[i].track.name] = json.items[i].track.artists.map(a => a.name);
            let argsSearch = new URLSearchParams({
                part: "snippet",
                maxResults: 1,
                type: "video",
                q: json.items[i].track.name + " " + json.items[i].track.artists.map(a => a.name).join(" ")
            });

            // get the first result of YT search
            fetch("https://www.googleapis.com/youtube/v3/search?" + argsSearch, {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('access_token_yt')
                }
            })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error when searching for videos HTTP status ' + response.status);
                }
                return response.json();
            })
            .then((json) => {
                tracksYt.push(json.items[0].id.videoId);
            })
            .catch(error => {
                // console.error('Error:', error);
                failedToObtain();
            });
        }

        // console.log(tracksSp);
        // console.log(tracksYt);

        // get playlist name
        return fetch("https://api.spotify.com/v1/playlists/" + playlistId, {
            method: "GET",
            headers: {
                "Authorization": "Bearer  " + localStorage.getItem('access_token_sp')
            }
        });
    })
    .then((response) => response.json())
    .then((json) => {
        // fail to obtain data
        if (json.hasOwnProperty('error')) {
            failedToObtain();
            throw new Error("failed to get playlist name");
        }

        playlistName = json.name;
        let argsCreate = new URLSearchParams({
            part: "id,snippet,status"
        });
        // create YT playlist with the playlist name
        return fetch("https://www.googleapis.com/youtube/v3/playlists?" + argsCreate, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem('access_token_yt')
            },
            body: JSON.stringify({
                "snippet": {
                    "title": playlistName
                },
                "status": {
                    "privacyStatus": "private"
                }
            })
        });
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error('ERROR creating playlist HTTP status ' + response.status);
        }
        return response.json();
    })
    .then((json) => {
        playlistIdYt = json.id;
        // console.log("playlist id:", playlistIdYt);
        
        // add videos into the playlist
        let accessTokenYt = localStorage.getItem('access_token_yt');
        initiateAddVideo(playlistIdYt, accessTokenYt, tracksYt);
    })
    .catch(error => {
        // console.error('Error:', error);
        failedToObtain();
    });
})

async function initiateAddVideo(playlistId, accessToken, tracks) {
    for (let i = 0; i < tracks.length; i++) {
        // console.log("video id:", tracks[i]);
        const resp = await addVideo(playlistId, tracks[i], accessToken, i)
        if (!resp.ok)
            throw new Error('Error adding videos to playlist HTTP status ' + resp.status);
        // else 
            // console.log("VIDEO ADDED #", i);
    }
    window.open("https://youtube.com/playlist?list=" + playlistId, "_blank").focus();
}

function addVideo(playlistId, videoId, accessToken, position) {
    let argsInsert = new URLSearchParams({
        part: "snippet"
    });
    return fetch("https://www.googleapis.com/youtube/v3/playlistItems?" + argsInsert, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        body: JSON.stringify({
            "snippet": {
                "playlistId": playlistId,
                "resourceId": {
                    "kind": "youtube#video",
                    "videoId": videoId
                },
                "position": position
            }
        })
    })
}

// authorize youtube
btnYt.addEventListener('click', () => {
    let args = new URLSearchParams({
        client_id: clientIdYt,
        redirect_uri: redirectUriYt,
        response_type: 'token',
        scope: scopeYt,
        state: state
    });
    const launchWebAuthFlowOptionsYt = {
        url: 'https://accounts.google.com/o/oauth2/v2/auth?' + args,
        interactive: true // This specifies that it's an interactive flow
    };
    chrome.identity.launchWebAuthFlow(launchWebAuthFlowOptionsYt, (responseUrl) => {
        // This callback is called when the user completes the flow
        const queryString = new URL(responseUrl);
        const urlParams = new URLSearchParams("?" + queryString.hash.slice(1));
        if (chrome.runtime.lastError || urlParams.get('error') || urlParams.get('state') != state) {
            failedToObtain();
            return;
        }
        else {
            localStorage.setItem('access_token_yt', urlParams.get('access_token'));
            localStorage.setItem('expire_yt', Date.now() + parseInt(urlParams.get('expires_in'))*950);
            actionClicked();
            return;
        }
    });
})

// authorize spotify
btnSp.addEventListener('click', () => {
    generateCodeChallenge(codeVerifier).then(codeChallenge => {
        localStorage.setItem('code_verifier', codeVerifier);

        let args = new URLSearchParams({
            response_type: 'code',
            client_id: clientIdSp,
            scope: scopeSp,
            redirect_uri: redirectUriSp,
            state: state,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge
        });
        const launchWebAuthFlowOptionsSp = {
            url: 'https://accounts.spotify.com/authorize?' + args,
            interactive: true // This specifies that it's an interactive flow
        };
        chrome.identity.launchWebAuthFlow(launchWebAuthFlowOptionsSp, (responseUrl) => {
            // This callback is called when the user completes the flow
            const queryString = new URL(responseUrl);
            const urlParams = new URLSearchParams(queryString.search);
            let code = urlParams.get('code');
            let responseState = urlParams.get('state');
            if (chrome.runtime.lastError || responseState != state) {
                failedToObtain();
                return;
            }
            else {
                getAccessTokenSp(code);
                return;
            }
        });
    });
})

// get access token for spotify
function getAccessTokenSp(code) {
    codeVerifier = localStorage.getItem('code_verifier');
    let body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUriSp,
        client_id: clientIdSp,
        code_verifier: codeVerifier
    });
    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error getting spotify access HTTP status ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem('access_token_sp', data.access_token);
        localStorage.setItem('expire_sp', Date.now() + data.expires_in*950);
        actionClicked();
    })
    .catch(error => {
        // console.error('Error:', error);
        failedToObtain();
    });
}

// check if a valid access token for spotify is available
function checkAccessSp() {
    if (!localStorage.getItem("access_token_sp") || !localStorage.getItem("expire_sp") || localStorage.getItem("expire_sp") < Date.now())
        return false;
    else
        return true;
}

// check if a valid access token for youtube is available
function checkAccessYt() {
    if (!localStorage.getItem("access_token_yt") || !localStorage.getItem("expire_yt") || localStorage.getItem("expire_yt") < Date.now())
        return false;
    else
        return true;
}

// get playlist id from tab url
function getPlaylistId(url) {
    let endOfId = url.indexOf('?');
    if (endOfId === -1)
        return url.substring(spotifyUrl.length);
    else
        return url.substring(spotifyUrl.length, endOfId);
}

// code verifier
function generateRandomString(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}  

// code challenge
async function generateCodeChallenge(codeVerifier) {
    function base64encode(string) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(string)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }
  
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
  
    return base64encode(digest);
}


// DISPLAY STATES
function failedToObtain() {
    inv.style.display = 'block';
    ly.style.display = 'none';
    ls.style.display = 'none';
    npl.style.display = 'none';
    pl.style.display = 'none';
    btnSp.disabled = true;
    btnYt.disabled = true;
    btnGen.disabled = true;
    return;
}
function displayLoginSp() {
    inv.style.display = 'none';
    ly.style.display = 'none';
    ls.style.display = 'block';
    npl.style.display = 'none';
    pl.style.display = 'none';
    btnSp.disabled = false;
    btnYt.disabled = true;
    btnGen.disabled = true;
    return;
}
function displayLoginYt() {
    inv.style.display = 'none';
    ly.style.display = 'block';
    ls.style.display = 'none';
    npl.style.display = 'none';
    pl.style.display = 'none';
    btnSp.disabled = true;
    btnYt.disabled = false;
    btnGen.disabled = true;
    return;
}
function readyToGenerate() {
    inv.style.display = 'none';
    ly.style.display = 'none';
    ls.style.display = 'none';
    npl.style.display = 'none';
    pl.style.display = 'block';
    btnSp.disabled = true;
    btnYt.disabled = true;
    btnGen.disabled = false;
    return;
}