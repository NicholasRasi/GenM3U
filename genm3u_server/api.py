import os
import logging
import datetime, time

from flask import Flask, jsonify, request, send_from_directory, abort
from werkzeug.utils import secure_filename
from flask_cors import CORS

from models.channel import Channel
from modules import m3uio
from modules import m3uchecker
from modules.database import Database

### Initial configuration
MAX_DEFAULT_ATTEMPTS = 5

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

cors = CORS(app, resources={r"*": {"origins": "*"}})

# Paths configuration
dir_path = os.path.dirname(os.path.realpath(__file__))

app.config['UPLOAD_FOLDER'] = dir_path + '/uploads'
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

app.config['EXPORT_FOLDER'] = dir_path + '/exports'
app.config['EXPORT_FILENAME'] = 'export.m3u'
if not os.path.exists(app.config['EXPORT_FOLDER']):
    os.makedirs(app.config['EXPORT_FOLDER'])

app.config['DB_FOLDER'] = dir_path + '/database'
if not os.path.exists(app.config['DB_FOLDER']):
    os.makedirs(app.config['DB_FOLDER'])
db = Database(app.config['DB_FOLDER'] + "/db.json")

# Private key
# generated one-time with the database
pkey = db.get_playlist_key()['key']
print("Your private key is", pkey)


def check_request_key(request):
    if 'key' in request.headers:
        logger.debug("Checking key: %s", request.headers['key'])
        if request.headers['key'] == pkey:
            return True
        else:
            return False
    else:
        return False


### API Definition
# get all the channels
@app.route("/channels/", methods=['GET'])
def all_channels():
    if not check_request_key(request): return 'Unauthorized', 401
    logger.debug("Channels: %s", db.all_channels_sorted())
    logger.debug("Get all the channels")
    return jsonify(db.all_channels_sorted())


# get a channel
@app.route("/channels/<id>/", methods=['GET'])
def get_channel(id):
    if not check_request_key(request): return 'Unauthorized', 401
    logger.debug("Get channel: %s", id)
    return jsonify(db.get_channel(int(id)))


# add a channel
@app.route("/channels/", methods=['POST'])
def add_channel():
    if not check_request_key(request): return 'Unauthorized', 401
    logger.debug("Adding a channel: %s %s %s %s", request.json['position'], request.json['name'],
                 request.json.get('metadata', ''), request.json['url'])
    newChannel = Channel(position=request.json['position'],
                         name=request.json['name'],
                         metadata=request.json.get('metadata', ''),
                         url=request.json['url'])
    id = db.add_channel(newChannel)
    return jsonify(id)


# update channel
@app.route("/channels/<id>/", methods=['PUT'])
def update_channel(id):
    if not check_request_key(request): return 'Unauthorized', 401
    logger.debug("Updating channel: %s", id)
    channel = Channel(position=request.json['position'],
                      name=request.json['name'],
                      metadata=request.json.get('metadata', ''),
                      url=request.json['url'],
                      checked=request.json['checked'],
                      last_check=request.json['last_check'])
    newId = db.update_channel(int(id), channel)
    return jsonify(newId)


# delete channel
@app.route("/channels/<id>/", methods=['DELETE'])
def delete_channel(id):
    if not check_request_key(request): return 'Unauthorized', 401
    logger.debug("Deleting channel: %s", id)
    return jsonify(db.remove_channel(int(id)))


# delete all the list
@app.route("/channels/", methods=['DELETE'])
def delete_all_channels():
    if not check_request_key(request): return 'Unauthorized', 401
    logger.debug("Deleting all the list")
    return jsonify(db.purge_channel_table())


# check channel
@app.route("/channels/<id>/check/", methods=['POST'])
def check_channel(id, json=True, attempts=MAX_DEFAULT_ATTEMPTS):
    if not check_request_key(request): return 'Unauthorized', 401
    logger.debug("Checking channel: %s", id)
    # get the channel info
    channel = db.get_channel(int(id))
    # get the attempts parameter
    if not (request.json is None) and 'attempts' in request.json:
        attempts = request.json['attempts']
    logger.debug("Attempts: %s", attempts)
    attempts = int(attempts)
    # check the channel url
    logger.debug("Checking channel url: %s", channel['url'])
    result = m3uchecker.check_link(channel['url'], attempts)
    logger.debug("Result: %s", result)
    print(result)

    # save the result
    last_check = int(time.mktime(datetime.datetime.now().timetuple())) * 1000
    newChannel = Channel(position=channel['position'],
                         name=channel['name'],
                         metadata=channel.get('metadata', ''),
                         url=channel['url'],
                         checked=result,
                         last_check=last_check)
    db.update_channel(int(id), newChannel)

    if json:
        return jsonify({'checked': result, 'last_check': last_check})
    else:
        return result


# check all the channels
@app.route("/channels/checkAll/", methods=['POST'])
def check_all_channels():
    if not check_request_key(request): return 'Unauthorized', 401
    logger.debug("Checking all the channels")
    online = offline = 0
    for channel in db.all_channels():
        check = check_channel(channel['ID'], False)
        if check:
            online = online + 1
        else:
            offline = offline + 1
    return jsonify({'online': online, 'offline': offline})


# channels list import
# html should be: enctype="multipart/form-data"
@app.route('/channels/upload/', methods=['GET', 'POST'])
def upload_file():
    if not check_request_key(request): return 'Unauthorized', 401
    logger.debug("Uploading a file")
    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            logger.debug('No file part')
            abort(404)

        file = request.files['file']
        logger.debug("File: %s", file)

        if file.filename == '':
            logger.debug('No selected file')
            abort(404)

        if file:
            filename = secure_filename(file.filename)

            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            # start parsing
            result = m3uio.parsem3u(filepath)

            added = 0
            for channel in result['channels']:
                id = db.add_channel(channel)
                if id >= 0: added = added + 1

            return jsonify({"success": result['stats'][0],
                            "errors": result['stats'][1],
                            "added": added})


# check all the channels
@app.route("/channels/export/<option>", methods=['GET'])
def export_file(option, json=True):
    if not check_request_key(request): return 'Unauthorized', 401
    logger.debug("Exporting " + option)

    if not option:
        abort(404)

    if option == "all":
        list = db.all_channels_sorted()
    else:
        if option == "online":
            list = db.get_online_channels()
        else:
            list = db.get_offline_channels()

    filepath = app.config['EXPORT_FOLDER'] + '/' + app.config['EXPORT_FILENAME']

    result = m3uio.saveChannelsToFile(filepath, list)

    if json:
        return jsonify({'result': result, 'filename': app.config['EXPORT_FILENAME']})
    else:
        return {'result': result, 'filename': app.config['EXPORT_FILENAME']}


@app.route("/channels/checkandexport/<option>", methods=['GET'])
def check_and_export(option):
    if not check_request_key(request): return 'Unauthorized', 401
    logger.debug("Checking and exporting: " + option)
    check_all_channels()
    result = export_file(option, False)

    if result['result']:
        return jsonify({'result': 1})
    else:
        return jsonify({'result': 0})


@app.route("/channels/download/<key>/<filename>/", methods=['GET'])
def download_file(key, filename):
    # key can be passed as header parameter or directly in the url
    if not check_request_key(request):
        if not key == pkey:
            return 'Unauthorized', 401
    logger.debug("Downloading the playlist")
    return send_from_directory(app.config['EXPORT_FOLDER'], filename, as_attachment=True)