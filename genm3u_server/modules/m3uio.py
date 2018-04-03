import logging
import re
logger = logging.getLogger(__name__)

from models.channel import Channel

def parsem3u(infile):
    """
    Parse a m3u file generating a list of Channel objects.
    Channels file is formatted in this way:
    #EXTINF:-1 metadata, channel_name
    channel_url

    e.g.:
    #EXTINF:-1 tvg-id="" group-title="GROUP1" tvg-logo="001.png",Channel 1
    http://url

    :param infile: the file to parse
    :return: a dict with 'stats': [parsedChannel, parsedErrors], 'channels': [channels_list]
    """
    infile = open(infile, 'r')

    errors = 0
    success = 0
    channels = []

    line = infile.readline()
    while line:
        if line.startswith('#EXTINF:'):
            channelInfo = line.strip('#EXTINF:-1 ').split(',')
            try:
                metadata = channelInfo[0].strip()
                name = re.sub(r'\[[^]]*\]', '', channelInfo[1].strip())

                # read the url on the next line
                url = infile.readline().strip()

                channel = Channel(position=len(channels)+1, metadata=metadata, name=name, url=url)
                channels.append(channel)

                success += 1

                # new entry
                line = infile.readline()
            except IndexError:
                # the channel has no name, skip it
                errors += 1
                print("error")

                # skip the url
                infile.readline()
                line = infile.readline()
        else:
            # non interesting line, skip it
            line = infile.readline()
    infile.close()

    return {'stats': [success, errors], 'channels': channels}

def saveChannelsToFile(filepath, channels):
    """
    Export a list of Channel objects into a file
    :param filepath: the export file
    :param channels: the list of channels to export
    :return:
    """
    logger.debug("Opening export file")
    try:
        file = open(filepath, 'w')
        file.write('#EXTM3U\n')
        for channel in channels:
            logger.debug("Exporting: %s", channel)
            file.write('#EXTINF:-1 ' + channel['metadata'] + ',' + channel['name'] + '\n' + channel['url']+ '\n\n')
        #file.write('#EXT-X-ENDLIST')
        file.close()
        return True
    except IOError:
        logger.error('Cannot open output file')
        return False