const spotifyUrl = 'https://open.spotify.com/playlist/';
const ly = document.getElementById("loginYt");
const ls = document.getElementById("loginSp");
const npl = document.getElementById("notPlaylist");
const inv = document.getElementById("invalid");
const pl = document.getElementById("playlist");
var accessToken = "";

// check if on a spotify playlist tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].url) {
        if (tabs[0].url.startsWith(spotifyUrl)) {
            const playlistId = getPlaylistId(tabs[0].url);
            console.log("playlistId = " + playlistId);
            
            // fetch access token
            fetch("https://accounts.spotify.com/api/token", {
                method: "POST",
                body: "grant_type=client_credentials&client_id=958ae92557d541f98c5ddbd3f81e1354&client_secret=565266342e484048905378d484ea8de9",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            })
            .then((response) => response.json())
            .then((json) => {
                accessToken = json.access_token;
                console.log("access token = " + accessToken);

                // API call to obtain playlist using playlistId and access token
                return fetch("https://api.spotify.com/v1/playlists/" + playlistId + "/tracks", {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer  " + accessToken
                    }
                })
            })
            .then((response) => response.json())
            .then((json) => {
                // fail to obtain data
                if (json.hasOwnProperty('error')) {
                    inv.style.display = "block";
                    console.log("error = " + json.error);
                }

                // data obtained
                else {
                    console.log("number of items fetched = " + json.total);
                    let trackNum = json.total > json.limit ? json.limit : json.total;
                    var tracks = {};
                    for (let i = 0; i < trackNum; i++) {
                        tracks[json.items[i].track.name] = json.items[i].track.artists.map(a => a.name);
                        console.log("track: ", json.items[i].track.name, "& artists: ");
                        console.log(tracks[json.items[i].track.name]);
                    }
                    pl.style.display = "block";
                }
            });
        }

        // not on a spotify playlist
        else {
            npl.style.display = "block";
        }
    }
});

// get playlist id from tab url
function getPlaylistId (url) {
    let endOfId = url.indexOf('?');
    if (endOfId === -1)
        return url.substring(spotifyUrl.length);
    else
        return url.substring(spotifyUrl.length, endOfId);
}