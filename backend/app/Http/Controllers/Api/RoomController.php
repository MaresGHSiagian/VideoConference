<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class RoomController extends Controller
{
    /**
     * Get all rooms for the authenticated user
     * 
     * @OA\Get(
     *     path="/rooms",
     *     tags={"Rooms"},
     *     summary="Get user's rooms",
     *     description="Get all rooms created by the user or public rooms",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="List of rooms",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Room")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated"
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $rooms = Room::where('created_by', $request->user()->id)
                    ->orWhere('is_public', true)
                    ->active()
                    ->with('creator')
                    ->latest()
                    ->get();

        return response()->json($rooms);
    }

    /**
     * Create a new room
     * 
     * @OA\Post(
     *     path="/rooms",
     *     tags={"Rooms"},
     *     summary="Create a new room",
     *     description="Create a new meeting room",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name"},
     *             @OA\Property(property="name", type="string", example="Team Meeting"),
     *             @OA\Property(property="description", type="string", nullable=true, example="Weekly team standup"),
     *             @OA\Property(property="is_public", type="boolean", example=false),
     *             @OA\Property(property="max_participants", type="integer", example=10, minimum=2, maximum=100)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Room created successfully",
     *         @OA\JsonContent(ref="#/components/schemas/Room")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error"
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated"
     *     )
     * )
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_public' => 'boolean',
            'max_participants' => 'integer|min:2|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $room = Room::create([
            'name' => $request->name,
            'description' => $request->description,
            'is_public' => $request->is_public ?? true,
            'max_participants' => $request->max_participants ?? 50,
            'created_by' => $request->user()->id,
            'started_at' => now(),
        ]);

        $room->load('creator');

        return response()->json($room, 201);
    }

    /**
     * Get a specific room
     */
    public function show(Request $request, string $roomId): JsonResponse
    {
        $room = Room::where('room_id', $roomId)
                   ->with('creator')
                   ->first();

        if (!$room) {
            return response()->json([
                'message' => 'Room not found'
            ], 404);
        }

        // Check if user has access to this room
        if (!$room->is_public && $room->created_by !== $request->user()->id) {
            return response()->json([
                'message' => 'Access denied'
            ], 403);
        }

        return response()->json($room);
    }

    /**
     * Update a room
     */
    public function update(Request $request, string $roomId): JsonResponse
    {
        $room = Room::where('room_id', $roomId)->first();

        if (!$room) {
            return response()->json([
                'message' => 'Room not found'
            ], 404);
        }

        // Only the creator can update the room
        if ($room->created_by !== $request->user()->id) {
            return response()->json([
                'message' => 'Access denied'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_public' => 'boolean',
            'max_participants' => 'integer|min:2|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $room->update($request->only([
            'name',
            'description',
            'is_public',
            'max_participants'
        ]));

        $room->load('creator');

        return response()->json($room);
    }

    /**
     * Delete a room
     */
    public function destroy(Request $request, string $roomId): JsonResponse
    {
        $room = Room::where('room_id', $roomId)->first();

        if (!$room) {
            return response()->json([
                'message' => 'Room not found'
            ], 404);
        }

        // Only the creator can delete the room
        if ($room->created_by !== $request->user()->id) {
            return response()->json([
                'message' => 'Access denied'
            ], 403);
        }

        $room->delete();

        return response()->json([
            'message' => 'Room deleted successfully'
        ]);
    }

    /**
     * Join a room
     */
    public function join(Request $request, string $roomId): JsonResponse
    {
        $room = Room::where('room_id', $roomId)->first();

        if (!$room) {
            return response()->json([
                'message' => 'Room not found'
            ], 404);
        }

        if (!$room->is_active) {
            return response()->json([
                'message' => 'Room is not active'
            ], 403);
        }

        // Check if user has access to this room
        if (!$room->is_public && $room->created_by !== $request->user()->id) {
            return response()->json([
                'message' => 'Access denied'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'room' => $room->load('creator')
        ]);
    }

    /**
     * Leave a room
     */
    public function leave(Request $request, string $roomId): JsonResponse
    {
        $room = Room::where('room_id', $roomId)->first();

        if (!$room) {
            return response()->json([
                'message' => 'Room not found'
            ], 404);
        }

        return response()->json([
            'success' => true
        ]);
    }

    /**
     * End a room (only by creator)
     */
    public function end(Request $request, string $roomId): JsonResponse
    {
        $room = Room::where('room_id', $roomId)->first();

        if (!$room) {
            return response()->json([
                'message' => 'Room not found'
            ], 404);
        }

        // Only the creator can end the room
        if ($room->created_by !== $request->user()->id) {
            return response()->json([
                'message' => 'Access denied'
            ], 403);
        }

        $room->update([
            'is_active' => false,
            'ended_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Room ended successfully'
        ]);
    }
}
