<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * @OA\Schema(
 *     schema="Room",
 *     type="object",
 *     title="Room",
 *     description="Room model",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="room_id", type="string", example="abc123def456"),
 *     @OA\Property(property="name", type="string", example="Team Meeting"),
 *     @OA\Property(property="description", type="string", nullable=true, example="Daily standup meeting"),
 *     @OA\Property(property="is_public", type="boolean", example=false),
 *     @OA\Property(property="max_participants", type="integer", example=10),
 *     @OA\Property(property="created_by", type="string", example="1"),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="started_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="ended_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(property="creator", ref="#/components/schemas/User", nullable=true)
 * )
 */
class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_id',
        'name',
        'description',
        'is_public',
        'max_participants',
        'created_by',
        'is_active',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_active' => 'boolean',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    /**
     * Generate a unique room ID when creating a room
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($room) {
            if (empty($room->room_id)) {
                $room->room_id = static::generateUniqueRoomId();
            }
        });
    }

    /**
     * Generate a unique room ID
     */
    public static function generateUniqueRoomId(): string
    {
        do {
            $roomId = Str::random(10);
        } while (static::where('room_id', $roomId)->exists());

        return $roomId;
    }

    /**
     * Get the user who created this room
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to get active rooms
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get public rooms
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }
}
