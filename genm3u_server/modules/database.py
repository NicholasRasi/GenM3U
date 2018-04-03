import random
import string

from tinydb import TinyDB


class Database():
    """
    A bunch of functions useful to interact with the database
    """
    def __init__(self, databasePath):
        self.database = TinyDB(databasePath)

    def add_channel(self, channel):
        return self.database.table('channels').insert(channel.__dict__)

    def all_channels(self):
        list = self.database.table('channels').all()
        for channel in list:
            channel['ID'] = channel.doc_id
        return list

    def update_channel(self, id, channel):
        return self.database.table('channels').update(channel.__dict__, doc_ids=[id])

    def remove_channel(self, id):
        return self.database.table('channels').remove(doc_ids=[id])

    def get_channel(self, id):
        return self.database.table('channels').get(doc_id=id)

    def all_channels_sorted(self):
        channelsList = self.all_channels()
        return sorted(channelsList, key=lambda channel: channel['position'])

    def purge_channel_table(self):
        return self.database.purge_table('channels')

    def get_online_channels(self):
        list = []
        for channel in self.all_channels_sorted():
            if channel['checked']:
                list.append(channel)
        return list

    def get_offline_channels(self):
        list = []
        for channel in self.all_channels_sorted():
            if not channel['checked']:
                list.append(channel)
        return list

    def get_playlist_key(self):
        if len(self.database.table('playlist')) <= 0: # generate for the first time a key
            self.database.table('playlist').insert({'key': ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(10))})
        return self.database.table('playlist').get(doc_id=1)