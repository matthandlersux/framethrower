<?php

//error_reporting(E_ALL);
ini_set("display_errors", "on");

$url = $_REQUEST['url'];
$width = $_REQUEST['width'];
$height = $_REQUEST['height'];

list($width_orig, $height_orig, $image_type) = getimagesize($url);


if (isset($_REQUEST['cropX'])) $cropX = $_REQUEST['cropX'];
else $cropX = 0;

if (isset($_REQUEST['cropY'])) $cropY = $_REQUEST['cropY'];
else $cropY = 0;

if (isset($_REQUEST['cropWidth'])) $cropWidth = $_REQUEST['cropWidth'];
else $cropWidth = $width_orig;

if (isset($_REQUEST['cropHeight'])) $cropHeight = $_REQUEST['cropHeight'];
else $cropHeight = $height_orig;


//echo($url);

//Get Image size info
// 

// if (!isset($cropX)) $cropX = 0;
// if (!isset($cropY)) $cropY = 0;
// if (!isset($cropWidth)) $cropWidth = $width_orig;
// if (!isset($cropHeight)) $cropHeight = $height_orig;

switch ($image_type) {
	case 1: $im = imagecreatefromgif($url); break;
	case 2: $im = imagecreatefromjpeg($url);  break;
	case 3: $im = imagecreatefrompng($url); break;
	default:  trigger_error('Unsupported filetype!', E_USER_WARNING);  break;
}

//$imaaa = imagecreatefromjpeg($url);

//echo("aaaa");


$newImg = imagecreatetruecolor($width, $height);


imagecopyresampled($newImg, $im, 0, 0, $cropX, $cropY, $width, $height, $cropWidth, $cropHeight);



header('Content-Type: image/jpeg');
imagejpeg($newImg);
imagedestroy($newImg);
imagedestroy($im);

// header('Content-Type: image/jpeg');
// imagejpeg($im);
// imagedestroy($im);

// Create a blank image and add some text
// $im = imagecreatetruecolor(120, 20);
// $text_color = imagecolorallocate($im, 233, 14, 91);
// imagestring($im, 1, 5, 5,  'A Simple Text String', $text_color);
// 
// // Set the content type header - in this case image/jpeg
// header('Content-type: image/jpeg');
// 
// // Output the image
// imagejpeg($im);
// 
// // Free up memory
// imagedestroy($im);

?>