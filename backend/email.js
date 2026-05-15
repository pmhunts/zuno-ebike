import nodemailer from 'nodemailer';

// ─── Build transporter from environment variables ──────────────────────────────
// Supports Gmail (easiest), or any SMTP provider (SendGrid, Brevo, Resend, etc.)
//
// For Gmail — set these in .env:
//   EMAIL_HOST=smtp.gmail.com
//   EMAIL_PORT=587
//   EMAIL_USER=youraddress@gmail.com
//   EMAIL_PASS=your_16_char_app_password   ← Gmail App Password, NOT your real password
//   EMAIL_FROM=Zuno eBikes <youraddress@gmail.com>
//
// For SendGrid — set these in .env:
//   EMAIL_HOST=smtp.sendgrid.net
//   EMAIL_PORT=587
//   EMAIL_USER=apikey
//   EMAIL_PASS=SG.xxxxxxxxxxxx
//   EMAIL_FROM=Zuno eBikes <noreply@yourdomain.com>
//
// For Brevo (formerly Sendinblue) — set:
//   EMAIL_HOST=smtp-relay.brevo.com
//   EMAIL_PORT=587
//   EMAIL_USER=your_brevo_login_email
//   EMAIL_PASS=your_brevo_smtp_key
//   EMAIL_FROM=Zuno eBikes <noreply@yourdomain.com>

function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    return null; // email not configured — log warning, skip silently
  }

  return nodemailer.createTransport({
    host,
    port:   parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true only for port 465
    auth: { user, pass },
    tls: { rejectUnauthorized: false },  // avoids cert errors in dev
  });
}

const FROM = process.env.EMAIL_FROM || 'Zuno eBikes <noreply@zunobikes.in>';

// ─── Send with graceful fallback ───────────────────────────────────────────────
async function send(to, subject, html, text) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[EMAIL SKIPPED] Email not configured. Would have sent to: ${to} | Subject: ${subject}`);
    return false;
  }

  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html, text });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject} | ID: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, err.message);
    return false;
  }
}

// ─── Email Templates ───────────────────────────────────────────────────────────

const BASE_STYLE = `
  font-family: 'Segoe UI', Arial, sans-serif;
  background: #080c12;
  color: #b0c4d8;
  margin: 0; padding: 0;
`;

function wrap(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Zuno eBikes</title>
</head>
<body style="${BASE_STYLE}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080c12;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0e1420;border-radius:12px 12px 0 0;padding:28px 36px;border-bottom:1px solid #1e2a3a;">
            <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
              <span style="color:#00e5a0;">Z</span><span style="color:#e8f0f8;">UNO</span>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#0e1420;padding:36px 36px 28px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#080c12;border-radius:0 0 12px 12px;padding:20px 36px;border-top:1px solid #1e2a3a;">
            <p style="font-size:12px;color:#4a6080;margin:0;line-height:1.6;">
              You received this email because an account was created on Zuno eBikes.<br/>
              &copy; ${new Date().getFullYear()} Zuno Mobility Pvt. Ltd. &nbsp;·&nbsp;
              <a href="#" style="color:#7a96b4;">Unsubscribe</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Welcome email ─────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(user) {
  const subject = 'Welcome to Zuno — your account is ready';

  const html = wrap(`
    <h1 style="font-size:26px;font-weight:800;color:#e8f0f8;margin:0 0 8px;letter-spacing:-0.5px;">
      Welcome aboard, ${user.name.split(' ')[0]}.
    </h1>
    <p style="font-size:15px;color:#b0c4d8;line-height:1.7;margin:16px 0 0;">
      Your Zuno account is set up and ready. You have
      <strong style="color:#00e5a0;">Rs.${user.walletBalance} free credit</strong>
      waiting in your wallet — enough to start your first few rides right now.
    </p>

    <!-- Wallet credit banner -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td style="background:rgba(0,229,160,0.08);border:1px solid rgba(0,229,160,0.22);border-radius:10px;padding:20px 24px;">
          <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#7a96b4;margin-bottom:6px;">
            Wallet Balance
          </div>
          <div style="font-size:40px;font-weight:800;color:#00e5a0;line-height:1;letter-spacing:-1px;">
            Rs.${user.walletBalance}
          </div>
          <div style="font-size:12px;color:#7a96b4;margin-top:8px;">
            Deducted automatically when you end a ride
          </div>
        </td>
      </tr>
    </table>

    <!-- How it works -->
    <p style="font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#7a96b4;margin:0 0 16px;">
      How it works
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${[
        ['01', 'Find a station', 'Open the app and pick a Zuno station near you.'],
        ['02', 'Unlock a bike',  'Tap Unlock — a bike number is assigned instantly.'],
        ['03', 'Ride',           'The electric motor assists up to 25 km/h. No fuel needed.'],
        ['04', 'Drop off & pay', 'Return at any Zuno station. Fare auto-deducted from wallet.'],
      ].map(([n, title, desc]) => `
        <tr>
          <td style="padding:0 0 14px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:36px;vertical-align:top;padding-top:2px;">
                  <div style="width:26px;height:26px;border-radius:50%;background:rgba(0,229,160,0.12);border:1px solid rgba(0,229,160,0.25);display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#00e5a0;text-align:center;line-height:26px;">
                    ${n}
                  </div>
                </td>
                <td style="padding-left:12px;">
                  <div style="font-size:14px;font-weight:600;color:#e8f0f8;">${title}</div>
                  <div style="font-size:13px;color:#7a96b4;margin-top:2px;">${desc}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join('')}
    </table>

    <!-- Pricing quick ref -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #1e2a3a;border-radius:8px;overflow:hidden;">
      <tr style="background:#141c2a;">
        <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#7a96b4;letter-spacing:0.5px;">Unlock fee</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#e8f0f8;text-align:right;">Rs.10</td>
      </tr>
      <tr style="background:#0e1420;border-top:1px solid #1e2a3a;">
        <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#7a96b4;letter-spacing:0.5px;">First 5 km</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#e8f0f8;text-align:right;">Rs.3 / km</td>
      </tr>
      <tr style="background:#141c2a;border-top:1px solid #1e2a3a;">
        <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#7a96b4;letter-spacing:0.5px;">Beyond 5 km</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#e8f0f8;text-align:right;">Rs.2 / km</td>
      </tr>
    </table>

    <!-- CTA button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td>
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/stations"
             style="display:inline-block;background:#00e5a0;color:#000a06;font-size:15px;font-weight:700;
                    padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:0.2px;">
            Find a Bike Near You
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#4a6080;margin-top:28px;line-height:1.6;">
      Your account: <strong style="color:#b0c4d8;">${user.email}</strong><br/>
      If you did not create this account, you can safely ignore this email.
    </p>
  `);

  const text = `Welcome to Zuno, ${user.name}!

Your account is ready. You have Rs.${user.walletBalance} free credit in your wallet.

How it works:
1. Find a station near you
2. Unlock a bike
3. Ride to your destination
4. Drop off at any Zuno station — fare auto-deducted

Pricing: Rs.10 unlock + Rs.3/km (first 5km) + Rs.2/km beyond.

Start riding: ${process.env.APP_URL || 'http://localhost:3000'}/stations

— The Zuno Team`;

  return send(user.email, subject, html, text);
}

// ─── Ride receipt email ────────────────────────────────────────────────────────
export async function sendRideReceiptEmail(user, ride) {
  const subject = `Ride receipt — Rs.${ride.fare} · ${ride.distanceKm} km`;

  const html = wrap(`
    <h1 style="font-size:24px;font-weight:800;color:#e8f0f8;margin:0 0 6px;letter-spacing:-0.5px;">
      Ride complete
    </h1>
    <p style="font-size:14px;color:#7a96b4;margin:0 0 28px;">
      ${new Date(ride.endedAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
    </p>

    <!-- Stats row -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #1e2a3a;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="background:#141c2a;padding:18px 20px;text-align:center;border-right:1px solid #1e2a3a;width:33%;">
          <div style="font-size:22px;font-weight:800;color:#e8f0f8;">${ride.distanceKm} km</div>
          <div style="font-size:11px;color:#4a6080;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Distance</div>
        </td>
        <td style="background:#141c2a;padding:18px 20px;text-align:center;border-right:1px solid #1e2a3a;width:33%;">
          <div style="font-size:22px;font-weight:800;color:#e8f0f8;">${ride.durationMinutes} min</div>
          <div style="font-size:11px;color:#4a6080;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Duration</div>
        </td>
        <td style="background:rgba(0,229,160,0.07);padding:18px 20px;text-align:center;width:33%;">
          <div style="font-size:22px;font-weight:800;color:#00e5a0;">Rs.${ride.fare}</div>
          <div style="font-size:11px;color:#4a6080;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Fare charged</div>
        </td>
      </tr>
    </table>

    <!-- Route -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #1e2a3a;">
          <span style="font-size:12px;color:#4a6080;text-transform:uppercase;letter-spacing:0.5px;">Pickup</span><br/>
          <span style="font-size:14px;font-weight:600;color:#e8f0f8;">${ride.pickupStationName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;">
          <span style="font-size:12px;color:#4a6080;text-transform:uppercase;letter-spacing:0.5px;">Drop-off</span><br/>
          <span style="font-size:14px;font-weight:600;color:#e8f0f8;">${ride.dropStationName}</span>
        </td>
      </tr>
    </table>

    <!-- Fare breakdown -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e2a3a;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:#141c2a;">
        <td style="padding:11px 16px;font-size:13px;color:#7a96b4;">Unlock fee</td>
        <td style="padding:11px 16px;font-size:13px;color:#e8f0f8;text-align:right;">Rs.${ride.fareBreakdown.unlockFee}</td>
      </tr>
      <tr style="background:#0e1420;border-top:1px solid #1e2a3a;">
        <td style="padding:11px 16px;font-size:13px;color:#7a96b4;">Distance charge (${ride.distanceKm} km)</td>
        <td style="padding:11px 16px;font-size:13px;color:#e8f0f8;text-align:right;">Rs.${ride.fareBreakdown.distanceCharge}</td>
      </tr>
      <tr style="background:#141c2a;border-top:1px solid #263244;">
        <td style="padding:13px 16px;font-size:14px;font-weight:700;color:#e8f0f8;">Total charged</td>
        <td style="padding:13px 16px;font-size:14px;font-weight:700;color:#00e5a0;text-align:right;">Rs.${ride.fareBreakdown.total}</td>
      </tr>
    </table>

    <p style="font-size:13px;color:#4a6080;line-height:1.6;margin:0;">
      Bike: <strong style="color:#b0c4d8;">${ride.bikeNumber}</strong> &nbsp;·&nbsp;
      Ride ID: <strong style="color:#b0c4d8;">${ride.id.slice(0, 8).toUpperCase()}</strong>
    </p>
  `);

  const text = `Ride complete — Receipt

Distance: ${ride.distanceKm} km
Duration: ${ride.durationMinutes} min
Fare: Rs.${ride.fare}

${ride.pickupStationName} → ${ride.dropStationName}

Breakdown:
  Unlock fee: Rs.${ride.fareBreakdown.unlockFee}
  Distance charge: Rs.${ride.fareBreakdown.distanceCharge}
  Total: Rs.${ride.fare}

Bike: ${ride.bikeNumber}
Ride ID: ${ride.id.slice(0, 8).toUpperCase()}

— The Zuno Team`;

  return send(user.email, subject, html, text);
}
