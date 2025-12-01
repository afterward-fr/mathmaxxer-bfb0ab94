import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Complete solo game function loaded")

interface CompleteSoloGameRequest {
  sessionId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { sessionId }: CompleteSoloGameRequest = await req.json()

    console.log('Completing solo game:', { sessionId, userId: user.id })

    // Get session details
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

    // Check if already completed
    if (session.is_completed) {
      throw new Error('Game already completed')
    }

    // Calculate score from answers (server-side verification)
    const { data: answers, error: answersError } = await supabaseClient
      .from('game_answers')
      .select('is_correct')
      .eq('game_session_id', sessionId)
      .eq('user_id', user.id)

    if (answersError) {
      throw answersError
    }

    const calculatedScore = answers?.filter(a => a.is_correct).length || 0
    const totalQuestions = session.total_questions
    const scorePercentage = (calculatedScore / totalQuestions) * 100

    // Get current profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('practice_rating, total_games')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Profile not found')
    }

    // Calculate points based on difficulty, games played, and performance
    const difficultyPoints: Record<string, { base: number; loss: number }> = {
      beginner: { base: 15, loss: -8 },
      elementary: { base: 18, loss: -9 },
      intermediate: { base: 21, loss: -10 },
      advanced: { base: 24, loss: -12 },
      expert: { base: 27, loss: -13 },
      master: { base: 30, loss: -15 },
    }

    const { base: basePoints, loss: lossPoints } = difficultyPoints[session.difficulty] || difficultyPoints.beginner

    let pointsEarned: number

    // Determine points based on performance
    // If score is below 40%, player loses points
    // If score is 40-70%, reduced points
    // If score is above 70%, full points with scaling based on games played
    if (scorePercentage < 40) {
      // Poor performance - lose points
      pointsEarned = lossPoints
    } else if (scorePercentage < 70) {
      // Average performance - reduced points
      pointsEarned = Math.floor(basePoints * 0.5)
    } else {
      // Good performance - full points with scaling
      if (profile.total_games < 10) {
        pointsEarned = basePoints
      } else if (profile.total_games < 30) {
        pointsEarned = Math.floor(basePoints * 0.8)
      } else if (profile.total_games < 50) {
        pointsEarned = Math.floor(basePoints * 0.67)
      } else {
        pointsEarned = Math.floor(basePoints * 0.53)
      }
    }

    // Update profile - practice rating can't go below 0
    const newPracticeRating = Math.max(0, profile.practice_rating + pointsEarned)

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        practice_rating: newPracticeRating,
        total_games: profile.total_games + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    // Update session
    const { error: sessionUpdateError } = await supabaseClient
      .from('game_sessions')
      .update({
        score: calculatedScore,
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (sessionUpdateError) {
      throw sessionUpdateError
    }

    console.log('Solo game completed successfully:', { 
      score: calculatedScore, 
      pointsEarned, 
      newRating: newPracticeRating 
    })

    return new Response(
      JSON.stringify({
        success: true,
        score: calculatedScore,
        points_earned: pointsEarned,
        new_practice_rating: newPracticeRating,
        total_games: profile.total_games + 1,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in complete-solo-game function:', error)
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