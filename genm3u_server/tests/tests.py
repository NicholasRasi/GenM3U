import os

from ..modules import m3uchecker, m3uio
import unittest

class TestM3UChecker(unittest.TestCase):

    def setUp(self):
        self.ok_link = "http://github.com/"
        self.ko_link = "http://errorlink123"
        self.max_attempts = 1

    def test_check_link_true(self):
        self.assertTrue(m3uchecker.check_link(self.ok_link, self.max_attempts))

    def test_check_link_false(self):
        self.assertFalse(m3uchecker.check_link(self.ko_link, self.max_attempts))

    def test_check_links_false(self):
        self.assertDictEqual(m3uchecker.check_links([self.ok_link, self.ko_link], self.max_attempts),
                             {'stats': [1, 1], 'okLinks': [self.ok_link],
                                                      'koLinks': [self.ko_link]})

    def test_parsem3u(self):
        stats = m3uio.parsem3u(os.path.dirname(os.path.realpath(__file__)) + "/test_list.m3u")['stats']
        self.assertEqual(stats, [2, 0])

if __name__ == '__main__':
    unittest.main()