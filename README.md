# GenM3U
GenM3U is a M3U playlist builder. It can be used to manage IPTV channels lists allowing you to easily create, check,
import, export and share M3U playlist.
It can check if a channel is online and allows you to export playlist that you build.

#### You can preview the client [here](https://nicholasrasi.github.io/GenM3U/genm3u_client/dist/index.html)!

## List of features
- Add/Remove/Update single channel
- Change the channel position in the playlist
- Change the channel metadata
- Authentication with private key
- Check if the channel is online (BETA)
- Check if all the channels of the playlist are online (BETA)
- Import playlist from file
- Export playlist to file
- Get a public link where to access the playlist

## Future Improvements
- Mail notification of current playlist status
- Import from URL
- Manage multiple playlists


## How it is build
- Flask (Python) backend server to provide APIs
- AngularJS (JavaScript) frontend to consume APIs, built with the [Bootstrap 4 boilerplate](https://github.com/wapbamboogie/bootstrap-4-boilerplate)

## How to run it
Install these packages if you don't already have them
```
sudo apt-get install python3-pip python3-venv
pip3 install --upgrade pip setuptools
```

Let's clone the repo and create a virtual environment
```
git clone https://github.com/makebit/GenM3U.git
cd GenM3U/genm3u_server
mkdir venv
python3 -m venv venv/
source venv/bin/activate
```

Then you need to install the requirements
```
pip install -r requirements.txt
```

Then run the server with
```
export FLASK_APP=api.py
export FLASK_DEBUG=1
flask run
```

At the first run the server will generate your private key and it will print it (e.g. S6BHQMHD6B).
Copy this key because we need it!

Now you are ready to open /genm3u_client/dist/index.html and connect to the server.
Before that, click on File -> Settings and paste your key under "Private Key" field.

Now you are ready to build your playlist!
