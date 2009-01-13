<?php

echo("\nrequest method: ");
print_r($_SERVER['REQUEST_METHOD']);

echo("\nquery string: ");
print_r($_SERVER['QUERY_STRING']);

echo("\npost string: ");
print_r($HTTP_RAW_POST_DATA);

//echo("\nrequest: ");
//print_r($_REQUEST);

?>