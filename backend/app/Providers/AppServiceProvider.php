<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Singleton: one trace writer instance per request lifecycle
        $this->app->singleton(
            \App\Support\AgentTraceWriter::class,
            fn() => new \App\Support\AgentTraceWriter()
        );

        // Agent Triumvirate — registered for constructor injection

        $this->app->bind(
            \App\Services\Agents\FiscalThreatAnalyzer::class,
            fn() => new \App\Services\Agents\FiscalThreatAnalyzer()
        );

        $this->app->bind(
            \App\Services\Agents\DatabasePatchAgent::class,
            fn($app) => new \App\Services\Agents\DatabasePatchAgent(
                $app->make(\App\Support\AgentTraceWriter::class)
            )
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
