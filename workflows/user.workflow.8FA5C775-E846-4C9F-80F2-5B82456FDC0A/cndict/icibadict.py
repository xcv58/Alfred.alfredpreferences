#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import urllib
import json
from utils import *


def lookup(word):
    params = {
        'key': 'E93A321FB1995DF5EC118B51ABAF8DC7',
        'type': 'json',
        'w': word
    }
    url = '{}?{}'.format('http://dict-co.iciba.com/api/dictionary.php', urllib.urlencode(params))
    try:
        data = urllib.urlopen(url).read()
        data = convert(json.loads(data))
    except:
        raise DictLookupError('error to fetch data.')
    result = []
    symbol = data.get('symbols', [{}])[0]
    if is_english(word):
        for elem in symbol.get('parts', []):
            result.append('{} {}'.format(elem.get('part', ''), '；'.join(elem.get('means', []))))
        if result:
            phonetic = symbol.get('ph_am', '')
            result.insert(0, '{}{}'.format(word, ' /{}/'.format(phonetic) if phonetic else ''))
    else:
        elem = symbol.get('parts', [{}])[0]
        for mean in elem.get('means', []):
            word_mean = mean.get('word_mean', '')
            if word_mean:
                result.append(word_mean)
        if result:
            phonetic = symbol.get('word_symbol', '')
            result.insert(0, '{}{}'.format(word, ' /{}/'.format(phonetic) if phonetic else ''))
    return result


def copy(item):
    os.system("printf '{}' | pbcopy".format(item.replace("'", "\\'")))


def open(word):
    url = 'http://www.iciba.com/' + urllib.quote(word)
    os.system('open {}'.format(url))


def say(word):
    os.system("say '{}'".format(word.replace("'", "\\'")))
