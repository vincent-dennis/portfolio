# SpoTube

SpoTube is a chrome extension that can quickly generate a YouTube playlist out of a Spotify playlist. Made by Vincent Dennis Judyanto.

## Installation

If you want to try SpoTube:

1. Download the SpoTube.zip file
2. Unzip the file into a local folder
3. Open Google Chrome and go to chrome://extensions
4. On the top right corner, toggle on "Developer mode"
5. Click on "Load Unpacked", and choose the SpoTube folder
6. Send an email to vincentdennis.j@gmail.com containing your google account email address and the email address that is connected to your spotify account with the subject "Request to try SpoTube" (unfortunately since the extension is in development mode, each user have to be added manually to the permission list)

## Usage

For a demonstration watch the video "SpoTube demo" https://youtu.be/0LmuuYStDYE OR download the video.

IMPORTANT!
Your Google account you use must have a YouTube **Channel** associated with it. To check if you already have a channel, open [YouTube](https://www.youtube.com), sign in and click on your profile icon. If there is an option to "create channel", then click on it and proceed as instructed.

1. Open a Spotify playlist that you would like to transfer to YouTube
2. Click on the extension icon, and when prompted, sign into both your Spotify account and Google account that is associated with your YouTube account. 
3. Click on the "Generate Playlist" button, and wait for the generated playlist to appear.

The extension does NOT store any user sensitive data.

## How it works

1. User grants access to their Spotify playlist and YouTube through OAuth.
2. The extension obtains the playlist name and the songs' titles and artists.
3. A private playlist of the same name is generated on the user's YouTube account.
4. The extension executes a YouTube search for every song using its title and artists, takes the first video result and insert it into the created playlist.
5. The playlist is opened in a new tab.

## Limitations

The extension uses both Spotify and YouTube Data API to function, and since YouTube Data API can only be used with a Cost Quota system, the extension can only transfer up to 66 songs per day. This extension was made as a learning project, and serves only as a proof of concept. For troubleshooting or inquiries email vincentdennis.j@gmail.com
