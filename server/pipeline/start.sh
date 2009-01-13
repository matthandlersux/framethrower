#!/bin/sh
cd `dirname $0`
exec erl -pa $PWD/ebin $PWD/deps/*/ebin $PWD/../mbrella/v1.4/ebin $PWD/../lib/ -boot start_sasl -s pipeline -eval "session:startManager(), memoize:start(), env:start()."
