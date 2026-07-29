<?php
require __DIR__.'/vendor/autoload.php';
echo "1. Loaded autoloader\n";

$app = require_once __DIR__.'/bootstrap/app.php';
echo "2. Bootstrapped application configuration\n";

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
echo "3. Kernel resolved\n";

$reflector = new ReflectionObject($kernel);
$property = $reflector->getProperty('bootstrappers');
$property->setAccessible(true);
$bootstrappers = $property->getValue($kernel);

foreach ($bootstrappers as $bootstrapper) {
    echo " -> Running bootstrapper: $bootstrapper\n";
    $app->make($bootstrapper)->bootstrap($app);
    echo "    Completed: $bootstrapper\n";
}

echo "4. Done\n";
