#!/bin/sh

#=====variables=====
erl="erl"
webappname="pipeline"
webappdir="./$webappname"
sname="-sname $webappname"
adddirs="-pa $PWD/$webappname/ebin $PWD/$webappname/deps/*/ebin $PWD/mbrella/v1.4/ebin $PWD/lib/"
boot="-boot start_sasl"
startapp="-s $webappname"
#default is interactive
conf="-config $PWD/$webappname/errorlog.config";
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
echo " -s|--serialize                 serialized server state file location"
echo " -h|--help                      print this message"

exit 1
}

#=====interpret input=====

while [ $# -gt 0 ] 
	do
	arg=$1
	shift;
	case $arg in
		-i|--interactive)
			conf="-config $PWD/$webappname/errorlog";
			daemon="";;
		-d|--daemon)
			daemon="-detached";
			conf="-config $PWD/$webappname/errorlognotty";;
		-s|--serialize)
			serialize="serialize:start($1), ";;
		-h|--help)
			help;;
		*)
			help
	esac
done

eval='-eval "session:startManager(),memoize:start(),env:start(),objects:start()."'
# eval='-eval "memoize:start()."'
commonflags="$conf $sname $adddirs $boot $startapp $eval"

			

#=====execute=====
cd `dirname $0`
exec $erl $commonflags