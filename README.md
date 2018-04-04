# GenM3U
GenM3U is a M3U playlist builder. It can be used to manage IPTV channels lists allowing you to easily create, check,
import, export and share M3U playlist.
It can check if a channel is online and allows you to export playlist that you build.

## List of features
- Add/Remove/Update single channel
- Change the channel position in the playlist
- Change the channel metadata
- Check if the channel is online (BETA)
- Check if all the channels of the playlist are online (BETA)
- Import playlist from file
- Export playlist to file
- Get a public link where to access the playlist

## Future Improvements
- Authentication
- Mail notification of current playlist status
- Import from URL


## How it is build
- Flask (Python) backend server to provide APIs
- AngularJS (JS) frontend to consume APIs, built with the [Bootstrap 4 boilerplate](https://github.com/wapbamboogie/bootstrap-4-boilerplate)

## How to run it
Install these packages if you don't already have them
```
sudo apt-get install python3-pip
pip3 install --upgrade pip setuptools
```

Let's create a virtual environment
```
mkdir venvs
python3 -m venv venvs/
source ~/venvs/bin/activate
```


Then you need to install the requirements
```
pip install -r requirements.txt
```

The run the server with
```
export FLASK_APP=api.py
export FLASK_DEBUG=1
flask run
```

Now you are ready to open /genm3u_client/dist/index.html and connect to the server.
