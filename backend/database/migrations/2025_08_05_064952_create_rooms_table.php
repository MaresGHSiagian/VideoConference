<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('room_id')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(true);
            $table->integer('max_participants')->default(50);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
