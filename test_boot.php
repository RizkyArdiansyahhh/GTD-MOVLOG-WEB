<?php
define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
echo "1. Autoloader registered.\n";

$app = require_once __DIR__.'/bootstrap/app.php';
echo "2. App bootstrapped.\n";

$request = Illuminate\Http\Request::create('/login', 'GET');
echo "3. Request created.\n";

$response = $app->handleRequest($request);
echo "4. Response received. Status: " . $response->getStatusCode() . "\n";
