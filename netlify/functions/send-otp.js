// send-otp.js — Kirim OTP via Fonnte WhatsApp
// Dipanggil dari register.html saat user submit nomor HP

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  // CORS headers
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
    const { phone } = JSON.parse(event.body);

    // Validasi format nomor HP Indonesia
    if (!phone) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nomor HP wajib diisi' }) };
    }

    // Normalize: 08xx → 628xx
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0')) normalized = '62' + normalized.slice(1);
    if (!normalized.startsWith('62') || normalized.length < 10 || normalized.length > 15) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Format nomor HP tidak valid' }) };
    }

    // Generate OTP 6 digit
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp + process.env.OTP_SECRET).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    // Simpan OTP hash ke Supabase (tabel sementara di health_logs)
    const phoneHash = crypto.createHash('sha256').update(normalized).digest('hex');
    
    await supabase.from('health_logs').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // placeholder
      event_type: 'otp_request',
      metadata: {
        phone_hash: phoneHash,
        otp_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        attempts: 0
      }
    });

    // Kirim OTP via Fonnte WhatsApp
    const message = `🔐 Kode OTP SkillArena.id kamu:\n\n*${otp}*\n\nBerlaku 5 menit. Jangan bagikan ke siapapun!\n\n_SkillArena.id — Adu Otak. Menang Nyata._`;

    const fonnteRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': process.env.FONNTE_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: normalized,
        message: message,
        countryCode: '62'
      })
    });

    const fonnteData = await fonnteRes.json();

    if (!fonnteData.status) {
      console.error('Fonnte error:', fonnteData);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Gagal kirim OTP. Coba lagi.' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'OTP dikirim via WhatsApp',
        phone_display: normalized.slice(0, 4) + '****' + normalized.slice(-4)
      })
    };

  } catch (err) {
    console.error('send-otp error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error. Coba lagi.' })
    };
  }
};
