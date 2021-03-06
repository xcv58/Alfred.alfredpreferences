#!/usr/bin/env python
# encoding: utf-8

from workflow import Workflow, web

def main(wf):
    if len(wf.args):
        query = wf.args[0][10:]
    else:
        return

    data = wf.stored_data('history')
    if data is None:
        data = {}
    if query in data:
        del data[query]
    wf.store_data('history', data)

if __name__ == '__main__':
    wf = Workflow()
    wf.run(main)
