<?php
$dir = new RecursiveDirectoryIterator(__DIR__ . '/../../frontend/pages/');
$ite = new RecursiveIteratorIterator($dir);

$version = time();

foreach($ite as $file) {
    if ($file->isFile() && $file->getExtension() === 'html') {
        $content = file_get_contents($file->getPathname());
        $content = preg_replace('/(\.js|\.css)\?v=\d+/', '$1?v=' . $version, $content);
        file_put_contents($file->getPathname(), $content);
    }
}
echo "Cache buster updated!";
