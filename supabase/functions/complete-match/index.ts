import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Complete match function loaded")

interface CompleteMatchRequest {
  matchId: string;
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

    const { matchId }: CompleteMatchRequest = await req.json()

    console.log('Completing match:', { matchId, userId: user.id })

    // Get match details
    const { data: match, error: matchError } = await supabaseClient
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      throw new Error('Match not found')
    }

    // Validate user is part of this match
    if (match.player1_id !== user.id && match.player2_id !== user.id) {
      throw new Error('Unauthorized: You are not part of this match')
    }

    // Check if match is already completed
    if (match.status === 'completed') {
      throw new Error('Match already completed')
    }

    // Calculate scores server-side from match_answers table (prevents score manipulation)
    const { data: answers, error: answersError } = await supabaseClient
      .from('match_answers')
      .select('user_id, is_correct')
      .eq('match_id', matchId)

    if (answersError) {
      console.error('Error fetching match answers:', answersError)
      throw new Error('Failed to fetch match answers')
    }

    // Calculate actual scores from verified answers
    const player1Score = answers?.filter(a => a.user_id === match.player1_id && a.is_correct).length || 0
    const player2Score = answers?.filter(a => a.user_id === match.player2_id && a.is_correct).length || 0

    console.log('Calculated scores:', { player1Score, player2Score })

    // Determine winner
    let winnerId: string | null = null
    if (player1Score > player2Score) {
      winnerId = match.player1_id
    } else if (player2Score > player1Score) {
      winnerId = match.player2_id
    }

    // Calculate rating changes based on difficulty
    const ratingChanges: Record<string, { winner: number; loser: number }> = {
      beginner: { winner: 15, loser: -8 },
      elementary: { winner: 18, loser: -9 },
      intermediate: { winner: 21, loser: -10 },
      advanced: { winner: 24, loser: -12 },
      expert: { winner: 27, loser: -13 },
      master: { winner: 30, loser: -15 },
    }

    const { winner: winnerPoints, loser: loserPoints } = ratingChanges[match.difficulty] || ratingChanges.beginner

    // Get current profiles to calculate new ratings
    const { data: player1Profile } = await supabaseClient
      .from('profiles')
      .select('iq_rating, wins, losses, total_games')
      .eq('id', match.player1_id)
      .single()

    const { data: player2Profile } = await supabaseClient
      .from('profiles')
      .select('iq_rating, wins, losses, total_games')
      .eq('id', match.player2_id)
      .single()

    if (!player1Profile || !player2Profile) {
      throw new Error('Player profiles not found')
    }

    // Calculate player 1 updates
    const player1RatingChange = winnerId === match.player1_id ? winnerPoints : (winnerId === null ? 0 : loserPoints)
    const player1NewRating = Math.max(0, player1Profile.iq_rating + player1RatingChange)
    const player1NewWins = winnerId === match.player1_id ? player1Profile.wins + 1 : player1Profile.wins
    const player1NewLosses = winnerId === match.player2_id ? player1Profile.losses + 1 : player1Profile.losses

    // Calculate player 2 updates
    const player2RatingChange = winnerId === match.player2_id ? winnerPoints : (winnerId === null ? 0 : loserPoints)
    const player2NewRating = Math.max(0, player2Profile.iq_rating + player2RatingChange)
    const player2NewWins = winnerId === match.player2_id ? player2Profile.wins + 1 : player2Profile.wins
    const player2NewLosses = winnerId === match.player1_id ? player2Profile.losses + 1 : player2Profile.losses

    // Update player 1 profile
    const { error: p1Error } = await supabaseClient
      .from('profiles')
      .update({
        iq_rating: player1NewRating,
        wins: player1NewWins,
        losses: player1NewLosses,
        total_games: player1Profile.total_games + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match.player1_id)

    if (p1Error) {
      console.error('Error updating player 1:', p1Error)
      throw p1Error
    }

    // Update player 2 profile
    const { error: p2Error } = await supabaseClient
      .from('profiles')
      .update({
        iq_rating: player2NewRating,
        wins: player2NewWins,
        losses: player2NewLosses,
        total_games: player2Profile.total_games + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match.player2_id)

    if (p2Error) {
      console.error('Error updating player 2:', p2Error)
      throw p2Error
    }

    // Update match
    const { error: matchUpdateError } = await supabaseClient
      .from('matches')
      .update({
        player1_score: player1Score,
        player2_score: player2Score,
        winner_id: winnerId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', matchId)

    if (matchUpdateError) {
      throw matchUpdateError
    }

    console.log('Match completed successfully:', { winnerId, player1RatingChange, player2RatingChange })

    return new Response(
      JSON.stringify({
        success: true,
        winnerId,
        player1RatingChange,
        player2RatingChange,
        player1Score,
        player2Score,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in complete-match function:', error)
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
