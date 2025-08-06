<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Demo user untuk testing
        User::factory()->create([
            'name' => 'Demo User',
            'email' => 'demo@umalo.com',
            'password' => bcrypt('password123'),
        ]);

        // Create additional test users
        User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@umalo.com',
            'password' => bcrypt('password123'),
        ]);

        User::factory()->create([
            'name' => 'Jane Smith',
            'email' => 'jane@umalo.com',
            'password' => bcrypt('password123'),
        ]);
    }
}
