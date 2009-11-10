#!/bin/sh

#=====variables=====
erl="erl"
webappname="pipeline"
webappdir="./$webappname"
if [ -e ../../.server ]; then
	servername=`cat ../../.server`
else
	servername='unknown'
fi
sname="-name $webappname@$servername"
# mbrellaversion="v1.4"

adddirs="-pa $PWD/$webappname/ebin $PWD/$webappname/deps/*/ebin $PWD/mbrella/ebin $PWD/mochiweb/ebin"
boot="-boot start_sasl"
serialize="\\\"test.ets\\\""
unserialize="undefined"
responsetime="undefined"
startapp="-s $webappname"
ENV_PGM=`which env`
program="$0"
originalargs=${1+"$@"}
#default is interactive
conf="-config errorlog";
#place servers that need to be started here

#====functions=====

help() {

echo "running without any flags starts up the pipelin/mochiweb/mbrella system without unserializing anything"
echo ""
echo "usage: "
echo ""
echo " mbrella -i|--interactive       puts you in the erlang shell with the system"
echo " mbrella -d|--daemon            starts the mbrella as a daemon, outside of ssh (if connected to server)"
echo ""
echo ""
echo " extra flags: "
echo ""
echo "    --help                      print this message"
echo "    --noconfig                  do not use a config file for sasl"
echo " -s|--serialize                 location to store serialized server state file (default: test.ets)"
echo "                                    ex: \"-s mbrella/data/serialize.ets\" "
echo " -u|--unserialize               serialized server state file location (default: test.ets)"
echo " -r|--responsetime              turn on responseTime server for debugging server-client message passing"
echo " -h|--heart                     use heart to reboot the runtime system if erlang happens to crap out"

exit 1
}


#=====heart=====
now=`date -u +%s`
if [ "$HEART" = true ]; then
    timediff=`expr $now - $MBRELLA_HEART_START`
    if [ $timediff -le 60 ]; then
        if [ $MBRELLA_HEART_RESTARTS -eq 5 ]; then
            echo "5 restarts attempted within 60 seconds, exiting"
            exit 1
        else
            restarts=`expr $MBRELLA_HEART_RESTARTS + 1`
            starttime=$MBRELLA_HEART_START
        fi
    else
        restarts=1
        starttime=$now
    fi
else
    restarts=1
    starttime=$now
fi

#=====interpret input=====
while [ $# -gt 0 ] 
	do
	arg=$1
	shift;
	case $arg in
		-i|--interactive)
			conf="-config errorlog";
			daemon="";;
		-d|--daemon)
			daemon="-detached";
			conf="-config errorlognotty";
			heart="-heart -env HEART_BEAT_TIMEOUT 30";;
		-s|--serialize)
			serialize="\\\"$1\\\"";
			shift;;
		-u|--unserialize)
			unserialize="\\\"$1\\\"";
			shift;;
		--noconfig)
			conf="";;
		-r|--responsetime)
			responsetime="true";;
		--help)
			help;
			exit 0;;
		-h|--heart)
			heart="-heart";
			daemon="-detached";
			conf="-config errorlognotty";
			heartenv="-env HEART_BEAT_TIMEOUT 30";;
		*)
			help
	esac
done

eval='-eval "mblib:startScript([{serialize, '${serialize}'},{unserialize, '${unserialize}'},{responsetime, '${responsetime}'}])."'

# eval='-eval "memoize:start()."'
commonflags="$heartenv $daemon $conf $sname $adddirs $boot $startapp $eval"

HEART_COMMAND="${ENV_PGM} HEART=true MBRELLA_HEART_RESTARTS=$restarts MBRELLA_HEART_START=$starttime $program $originalargs"
export HEART_COMMAND

if [ -z "$heart" ]; then
    unset HEART_COMMAND
fi
#=====execute=====
cd `dirname $0`
# echo "exec $erl $commonflags\n\n"
eval "exec $erl +P 1000000 $heart $commonflags"
# proc_open("eval exec $erl $commonflags", array(), something)

