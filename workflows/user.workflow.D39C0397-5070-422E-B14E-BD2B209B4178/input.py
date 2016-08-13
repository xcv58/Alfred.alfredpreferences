#!/usr/bin/env python
# encoding: utf-8

from workflow import Workflow, web

def key_for_history(item):
    return item[0]

def get_url(query):
    return 'http://go/{}'.format(query)

def get_title(query):
    return 'go/{}'.format(query)

def main(wf):
    if len(wf.args):
        query = wf.args[0]
    else:
        query = None
    wf.logger.debug('1st query %d: %s', len(wf.args), query)

    raw_data = wf.stored_data('history')
    data = []
    if raw_data:
        data = raw_data.items()

    wf.logger.debug('data len: %d', len(data))
    if query:
        data = wf.filter(query, data, key_for_history)

    for i in reversed(sorted(data, key=lambda x: x[1])):
        title = i[0]
        value = str(i[1])

        wf.add_item(
            title = get_title(title),
            subtitle = value,
            arg = get_url(title),
            valid = True
        )

    if len(data) == 0 or query not in raw_data:
        wf.add_item(
            title = get_title(query),
            arg = get_url(query),
            valid = True
        )

    wf.send_feedback()

if __name__ == '__main__':
    wf = Workflow()
    wf.run(main)
