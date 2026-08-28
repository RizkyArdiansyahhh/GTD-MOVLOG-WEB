<?php
require 'vendor/autoload.php';
\ = require_once 'bootstrap/app.php';
\ = \->make(Illuminate\Contracts\Console\Kernel::class);
\->bootstrap();

\ = app(App\Services\MonitoringBarangService::class)->getMonitoringItems();
foreach (\ as \) {
    echo " ID: \
