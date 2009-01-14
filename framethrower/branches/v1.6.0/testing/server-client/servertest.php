<?php

$q = $_SERVER['QUERY_STRING'];

if (strpos($q, 'newSession') === 0) {
	echo('{"sessionId":36}');
} else if (strpos($q, 'query') === 0) {
	echo("");
} else if (strpos($q, 'pipeline') === 0) {
	//sleep(40);
	sleep(10);
	echo('{"updates":[{"queryId":1, "action":"add","key":"'.rand(0,99999).'"}],"lastMessageId":16}');
} else {
	echo("\nrequest method: ");
	print_r($_SERVER['REQUEST_METHOD']);
	
	echo("\ntest: ");
	print_r(strpos($q, 'newSession'));

	echo("\nquery string: ");
	print_r($_SERVER['QUERY_STRING']);

	echo("\npost string: ");
	print_r($HTTP_RAW_POST_DATA);
}

/*
echo("\nrequest method: ");
print_r($_SERVER['REQUEST_METHOD']);

echo("\nquery string: ");
print_r($_SERVER['QUERY_STRING']);

echo("\npost string: ");
print_r($HTTP_RAW_POST_DATA);

//echo("\nrequest: ");
//print_r($_REQUEST);
*/

?>