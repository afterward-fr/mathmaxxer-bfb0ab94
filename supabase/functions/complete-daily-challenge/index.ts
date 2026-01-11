import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Complete daily challenge function loaded")

interface CompleteDailyChallengeRequest {
  sessionId: string;
  challengeId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client with user's auth token for validation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { sessionId, challengeId }: CompleteDailyChallengeRequest = await req.json()

    // Validate required fields
    if (!sessionId || !challengeId) {
      throw new Error('Missing required fields: sessionId and challengeId')
    }

    console.log('Completing daily challenge:', { sessionId, challengeId, userId: user.id })

    // Get session details and verify it belongs to this user and challenge
    const { data: session, error: sessionError } = await supabaseClient
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      throw new Error('Game session not found')
    }

    // Validate user owns this session
    if (session.user_id !== user.id) {
      throw new Error('Unauthorized: You can only complete your own games')
    }

    // Validate session is linked to the challenge
    if (session.challenge_id !== challengeId) {
      throw new Error('Session is not associated with this challenge')
    }

    // Check if already completed
    if (session.is_completed) {
      throw new Error('Game already completed')
    }

    // Calculate score from answers (server-side verification - same pattern as solo games)
    const { data: answers, error: answersError } = await supabaseClient
      .from('game_answers')
      .select('is_correct')
      .eq('game_session_id', sessionId)
      .eq('user_id', user.id)

    if (answersError) {
      throw answersError
    }

    const calculatedScore = answers?.filter(a => a.is_correct).length || 0

    console.log('Server-calculated score:', calculatedScore)

    // Create service role client for calling the internal function
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Call the internal function with verified score
    const { data: result, error: completeError } = await supabaseAdmin.rpc('complete_daily_challenge_internal', {
      p_user_id: user.id,
      p_challenge_id: challengeId,
      p_session_id: sessionId,
      p_verified_score: calculatedScore
    })

    if (completeError) {
      // Handle specific error messages
      if (completeError.message?.includes('already completed')) {
        throw new Error('Challenge already completed')
      }
      if (completeError.message?.includes('did not meet target')) {
        throw new Error(completeError.message)
      }
      throw completeError
    }

    // Mark the game session as completed
    const { error: sessionUpdateError } = await supabaseAdmin
      .from('game_sessions')
      .update({
        score: calculatedScore,
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (sessionUpdateError) {
      console.error('Failed to update session:', sessionUpdateError)
    }

    console.log('Daily challenge completed successfully:', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in complete-daily-challenge function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
