<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Project Defuser One — Configuration
    |--------------------------------------------------------------------------
    |
    | Central config for the Autonomous Regulatory Firewall.
    | Override any value via .env file.
    |
    */

    // Assumed daily unit run-rate per SKU for margin leakage calculation
    'sku_daily_run_rate' => env('SKU_DAILY_RUN_RATE', 100),

    // Agent trace log storage disk
    'trace_disk' => env('AGENT_TRACE_DISK', 'local'),

];
