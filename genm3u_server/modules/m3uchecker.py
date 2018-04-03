import urllib.request
import urllib.error

import logging
logger = logging.getLogger(__name__)

MAX_TIMEOUT = 10

def check_link(link, attempts):
    """
    Check if the link is online trying to open it
    :param link: the link to check
    :param attempts: the max number of attempts
    :return: True if the link is online, False otherwise
    """
    i = 0
    for i in range(0, attempts):
        try:
            # try to open the link
            logger.debug("try: %s", link)
            urllib.request.urlopen(link, timeout=MAX_TIMEOUT)
            return True
        except urllib.error.HTTPError as e:
            # retry
            logger.error("error: %s - attempt: %d", link, attempts)
        except urllib.error.URLError as e:
            # url error
            logger.error("url error: %s", link)
            return False
        except ValueError as e:
            # error with the link
            logger.error("value error: %s", link)
            return False
        except Exception as e:
            # timeout
            logger.error("general error: %s", link)
            return False

    if i >= attempts:
        logger.debug("max attempts reached: %s", link)
        return False


def check_links(links, maxAttemps):
    """
    Check a list of links
    :param links: a list of links to check
    :param maxAttemps: the max number of attempts
    :return: dict with 'stats': [numberOfOkLinks, numberOfKoLinks]
                       'okLinks': list of online links
                       'koLink': list of offline links
    """
    okLinks = []
    koLinks = []

    for link in links:
        if check_link(link, maxAttemps):
            okLinks.append(link)
        else:
            koLinks.append(link)

    return {'stats': [len(okLinks), len(koLinks)], 'okLinks': okLinks, 'koLinks': koLinks}

