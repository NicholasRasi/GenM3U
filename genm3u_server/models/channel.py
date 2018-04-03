class Channel():
    def __init__(self, name, url, metadata, position=1, checked=False, last_check=False):
        """
        A channel is composed by:
        :param name: the channel name
        :param url: the channel url
        :param metadata: some extra data about the channel
        :param position: the channel position within the channels list
        :param checked: false if the channel was not checked or not online, true otherwise
        :param last_check: the last time, in Date format, when the channel was checked
        """
        self.name = name
        self.url = url
        self.metadata = metadata
        self.position = position
        self.checked = checked
        self.last_check = last_check

    def __str__(self) -> str:
        return self.name

    def getUrl(self):
        return self.url