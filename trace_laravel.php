<?php
define('LARAVEL_START', microtime(true));

echo "1. Register autoloader\n";
require __DIR__.'/vendor/autoload.php';

echo "2. Autoloader registered. Bootstrapping app...\n";
$app = new Illuminate\Foundation\Application(
    $_ENV['APP_BASE_PATH'] ?? __DIR__
);

echo "3. Application instance created.\n";

echo "4. Bootstrapping core elements...\n";
$bootstrappers = [
    \Illuminate\Foundation\Bootstrap\DetectEnvironment::class,
    \Illuminate\Foundation\Bootstrap\LoadConfiguration::class,
    \Illuminate\Foundation\Bootstrap\ConfigureLogging::class,
    \Illuminate\Foundation\Bootstrap\HandleExceptions::class,
    \Illuminate\Foundation\Bootstrap\RegisterProviders::class,
    \Illuminate\Foundation\Bootstrap\BootProviders::class,
];

foreach ($bootstrappers as $bootstrapper) {
    echo " -> Running bootstrapper: $bootstrapper\n";
    $app->make($bootstrapper)->bootstrap($app);
}

echo "5. Bootstrap complete!\n";
