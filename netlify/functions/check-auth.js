// check-auth.js — Cek apakah session token valid
// Dipanggil dari semua halaman yang butuh login

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token tidak ada' }) };
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Cari session
    const { data: sessions } = await supabase
      .from('health_logs')
      .select('*')
      .eq('event_type', 'session_created')
      .order('created_at', { ascending: false });

    let validSession = null;
    for (const s of (sessions || [])) {
      if (
        s.metadata?.token_hash === tokenHash &&
        new Date(s.metadata?.expires_at) > new Date()
      ) {
        validSession = s;
        break;
      }
    }

    if (!validSession) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Session expired' }) };
    }

    // Ambil data user
    const { data: user } = await supabase
      .from('users')
      .select('id, skill_bracket, total_tournaments, wins_today, daily_limit_idr, trust_score')
      .eq('id', validSession.user_id)
      .single();

    // Ambil wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance_idr, balance_coin')
      .eq('user_id', validSession.user_id)
      .single();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        user_id: validSession.user_id,
        skill_bracket: user?.skill_bracket || 'Pemula',
        total_tournaments: user?.total_tournaments || 0,
        wins_today: user?.wins_today || 0,
        daily_limit_idr: user?.daily_limit_idr || 25000,
        balance_idr: wallet?.balance_idr || 0,
        balance_coin: wallet?.balance_coin || 0
      })
    };

  } catch (err) {
    console.error('check-auth error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
