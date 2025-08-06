<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RoomController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::get('user', [AuthController::class, 'user']);
        Route::get('users', [AuthController::class, 'getAllUsers']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('logout-all', [AuthController::class, 'logoutAll']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });

    // Room routes
    Route::prefix('rooms')->group(function () {
        Route::get('/', [RoomController::class, 'index']);
        Route::post('/', [RoomController::class, 'store']);
        Route::get('{roomId}', [RoomController::class, 'show']);
        Route::put('{roomId}', [RoomController::class, 'update']);
        Route::delete('{roomId}', [RoomController::class, 'destroy']);
        Route::post('{roomId}/join', [RoomController::class, 'join']);
        Route::post('{roomId}/leave', [RoomController::class, 'leave']);
        Route::post('{roomId}/end', [RoomController::class, 'end']);
    });
});

// Health check
Route::get('health', function () {
    return response()->json([
        'status' => 'OK',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0'
    ]);
});
