<?php

use App\Http\Controllers\Api\FinanceController;
use Illuminate\Support\Facades\Route;

Route::match(['get', 'post'], '/sheets', [FinanceController::class, 'handle']);
