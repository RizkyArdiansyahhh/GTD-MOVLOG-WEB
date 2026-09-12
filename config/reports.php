<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Stagnant shipment threshold (days)
    |--------------------------------------------------------------------------
    |
    | A session counts as "stagnant" when its active checkpoint has been
    | running longer than this many days without an actual_finish.
    | Override via the REPORTS_STAGNANT_DAYS environment variable.
    |
    */
    'stagnant_threshold_days' => (int) env('REPORTS_STAGNANT_DAYS', 3),

];
