// verify-otp.js — Verifikasi OTP + buat/login akun
// Dipanggil dari register.html saat user submit kode OTP

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { phone, otp, device_fingerprint } = JSON.parse(event.body);

    if (!phone || !otp) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Data tidak lengkap' }) };
    }

    // Normalize nomor HP
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0')) normalized = '62' + normalized.slice(1);

    const phoneHash = crypto.createHash('sha256').update(normalized).digest('hex');
    const otpHash = crypto.createHash('sha256').update(otp + process.env.OTP_SECRET).digest('hex');

    // Cari OTP yang valid dari health_logs
    const { data: otpRecords } = await supabase
      .from('health_logs')
      .select('*')
      .eq('event_type', 'otp_request')
      .order('created_at', { ascending: false })
      .limit(5);

    let validOTP = null;
    for (const record of (otpRecords || [])) {
      const meta = record.metadata;
      if (
        meta.phone_hash === phoneHash &&
        meta.otp_hash === otpHash &&
        new Date(meta.expires_at) > new Date() &&
        (meta.attempts || 0) < 3
      ) {
        validOTP = record;
        break;
      }
    }

    if (!validOTP) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Kode OTP tidak valid atau sudah expired' })
      };
    }

    // Hapus OTP yang sudah dipakai
    await supabase.from('health_logs').delete().eq('id', validOTP.id);

    // Cek apakah user sudah ada
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, phone_hash')
      .eq('phone_hash', phoneHash)
      .single();

    let userId;
    let isNewUser = false;

    if (existingUser) {
      // User sudah ada → login
      userId = existingUser.id;
      
      // Update device fingerprint jika berbeda
      if (device_fingerprint) {
        const fpHash = crypto.createHash('sha256').update(device_fingerprint).digest('hex');
        await supabase.from('users').update({
          device_fingerprint_hash: fpHash,
          updated_at: new Date().toISOString()
        }).eq('id', userId);
      }
    } else {
      // User baru → daftar
      isNewUser = true;
      const fpHash = device_fingerprint
        ? crypto.createHash('sha256').update(device_fingerprint).digest('hex')
        : null;

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          phone_hash: phoneHash,
          device_fingerprint_hash: fpHash,
          daily_limit_idr: 25000,
          trust_score: 50,
          skill_bracket: 'Pemula',
          total_tournaments: 0,
          wins_today: 0
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert user error:', insertError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Gagal membuat akun. Coba lagi.' })
        };
      }

      userId = newUser.id;

      // Buat wallet untuk user baru
      await supabase.from('wallets').insert({
        user_id: userId,
        balance_idr: 0,
        balance_coin: 0
      });
    }

    // Generate session token sederhana
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    // Simpan session di health_logs (sementara sebelum ada tabel sessions)
    await supabase.from('health_logs').insert({
      user_id: userId,
      event_type: 'session_created',
      metadata: {
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 hari
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        is_new_user: isNewUser,
        user_id: userId,
        session_token: sessionToken,
        message: isNewUser ? 'Akun berhasil dibuat!' : 'Selamat datang kembali!'
      })
    };

  } catch (err) {
    console.error('verify-otp error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error. Coba lagi.' })
    };
  }
};
