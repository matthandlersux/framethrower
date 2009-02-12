#!/bin/sh

#=====variables=====
erl="erl"
webappname="pipeline"
webappdir="./$webappname"
sname="-sname $webappname"
mbrellaversion="v1.4"
adddirs="-pa $PWD/$webappname/ebin $PWD/$webappname/deps/*/ebin $PWD/mbrella/${mbrellaversion}/ebin $PWD/lib/"
boot="-boot start_sasl"
startapp="-s $webappname"
#default is interactive
conf="-config errorlog";
#place servers that need to be started here

#====functions=====

help() {

echo "usage: "
echo ""
echo " mbrella -i|--interactive       puts you in the erlang shell with the system"
echo " mbrella -d|--daemon            starts the mbrella as a daemon, outside of ssh (if connected to server)"
echo ""
echo ""
echo " extra flags: "
echo ""
echo " -s|--serialize                 serialized server state file location (default: none)"
echo "                                    ex: \"-s mbrella/v1.4/data/serialize.ets\" "
echo " -r|--responsetime              turn on responseTime server for debugging server-client message passing"
echo " -h|--help                      print this message"
echo " -b|--bootJson                  run bootJSON script against the server upon startup (default: off)"
echo " --noconfig                     do not use a config file for sasl"

exit 1
}

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
			conf="-config errorlognotty";;
		-s|--serialize)
			serialize="serialize:start(\\\"$1\\\"),";
			shift;;
		--noconfig)
			conf="";;
		-b|--bootJson)
			bootscript=',mblib:bootJsonScript( )';;
		-r|--responsetime)
			responsetime=',responseTime:start( )';;
		-h|--help)
			help;;
		*)
			help
	esac
done

eval='-eval "'${serialize}'session:startManager(),memoize:start(),env:start(),objects:start()'${responsetime}${bootscript}'."'
# eval='-eval "memoize:start()."'
commonflags="$conf $sname $adddirs $boot $startapp $eval"

			

#=====execute=====
cd `dirname $0`
# echo "exec $erl $commonflags"
eval "exec $erl $commonflags"
# proc_open("eval exec $erl $commonflags", array(), something)