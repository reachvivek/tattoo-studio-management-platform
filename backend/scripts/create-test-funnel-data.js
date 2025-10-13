const http = require('http');

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: JSON.parse(responseData) });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function createTestFunnelData() {
  console.log('🎯 Creating complete funnel test data...\n');

  const sessionId = `test-session-${Date.now()}`;
  console.log(`Session ID: ${sessionId}\n`);

  try {
    // Step 1: Create session
    console.log('1. Creating analytics session...');
    const sessionResult = await makeRequest('/api/analytics-detailed/create-session', 'POST', {
      sessionId: sessionId,
      userFingerprint: 'test-fp-' + Date.now(),
      utmSource: 'facebook',
      utmMedium: 'cpc',
      utmCampaign: 'winter2025',
      landingPage: 'http://localhost:4200/lead-form',
      deviceType: 'desktop',
      browser: 'Chrome',
      os: 'Windows'
    });
    console.log(`   ✅ ${sessionResult.data.message}\n`);

    // Step 2: Landing page view
    console.log('2. Tracking landing page view...');
    await makeRequest('/api/analytics-detailed/track-event', 'POST', {
      sessionId: sessionId,
      eventType: 'page_view',
      eventCategory: 'navigation',
      eventLabel: 'Lead Form Page',
      pageUrl: 'http://localhost:4200/lead-form',
      pageTitle: 'Lead Form - BookInk Tattoo'
    });
    console.log('   ✅ Landing page view tracked\n');

    // Step 3: Form start
    console.log('3. Tracking form start...');
    await makeRequest('/api/analytics-detailed/track-event', 'POST', {
      sessionId: sessionId,
      eventType: 'form_start',
      eventCategory: 'engagement',
      eventLabel: 'Lead Form',
      pageUrl: 'http://localhost:4200/lead-form'
    });
    console.log('   ✅ Form start tracked\n');

    // Step 4: Form submit
    console.log('4. Tracking form submission...');
    await makeRequest('/api/analytics-detailed/track-event', 'POST', {
      sessionId: sessionId,
      eventType: 'form_submit',
      eventCategory: 'conversion',
      eventLabel: 'Lead Form',
      pageUrl: 'http://localhost:4200/lead-form',
      metadata: {
        email: 'test@example.com',
        name: 'Test User'
      }
    });
    console.log('   ✅ Form submission tracked\n');

    // Step 5: Wheel view
    console.log('5. Tracking wheel page view...');
    await makeRequest('/api/analytics-detailed/track-event', 'POST', {
      sessionId: sessionId,
      eventType: 'wheel_view',
      eventCategory: 'navigation',
      eventLabel: 'Lottery Wheel Page',
      pageUrl: 'http://localhost:4200/spin-wheel',
      pageTitle: 'Spin the Wheel - BookInk Tattoo'
    });
    console.log('   ✅ Wheel view tracked\n');

    // Step 6: Wheel spin
    console.log('6. Tracking wheel spin...');
    await makeRequest('/api/analytics-detailed/track-event', 'POST', {
      sessionId: sessionId,
      eventType: 'wheel_spin',
      eventCategory: 'engagement',
      eventLabel: 'Wheel Spin',
      pageUrl: 'http://localhost:4200/spin-wheel',
      metadata: {
        prize: '30%'
      }
    });
    console.log('   ✅ Wheel spin tracked\n');

    // Step 7: Prize claim
    console.log('7. Tracking prize claim...');
    await makeRequest('/api/analytics-detailed/track-event', 'POST', {
      sessionId: sessionId,
      eventType: 'prize_claim',
      eventCategory: 'engagement',
      eventLabel: 'Prize Claimed',
      pageUrl: 'http://localhost:4200/spin-wheel',
      metadata: {
        prize: '30%',
        discount: 30
      }
    });
    console.log('   ✅ Prize claim tracked\n');

    // Step 8: WhatsApp redirect (FINAL CONVERSION!)
    console.log('8. Tracking WhatsApp redirect (final conversion)...');
    await makeRequest('/api/analytics-detailed/track-event', 'POST', {
      sessionId: sessionId,
      eventType: 'whatsapp_redirect',
      eventCategory: 'conversion',
      eventLabel: 'WhatsApp Redirect',
      pageUrl: 'http://localhost:4200/thank-you',
      pageTitle: 'Thank You - BookInk Tattoo',
      metadata: {
        phone: '+491516439197',
        message: 'Thank you page redirect'
      }
    });
    console.log('   ✅ WhatsApp redirect tracked (FINAL CONVERSION!)\n');

    // Get updated funnel stats
    console.log('9. Fetching updated funnel statistics...');
    const statsResult = await makeRequest('/api/analytics-detailed/funnel-stats', 'GET');
    console.log('\n📊 Updated Funnel Statistics:');
    console.log('   Total Sessions:', statsResult.data.data.funnel_steps.total_sessions);
    console.log('   Visited Landing:', statsResult.data.data.funnel_steps.visited_landing);
    console.log('   Submitted Form:', statsResult.data.data.funnel_steps.submitted_form);
    console.log('   Viewed Wheel:', statsResult.data.data.funnel_steps.viewed_wheel);
    console.log('   Spun Wheel:', statsResult.data.data.funnel_steps.spun_wheel);
    console.log('   Claimed Prize:', statsResult.data.data.funnel_steps.claimed_prize);
    console.log('   WhatsApp Redirect:', statsResult.data.data.funnel_steps.whatsapp_redirect);
    console.log('\n💯 Conversion Rates:');
    console.log('   Landing → Form:', statsResult.data.data.conversion_rates.landing_to_form + '%');
    console.log('   Form → Wheel:', statsResult.data.data.conversion_rates.form_to_wheel + '%');
    console.log('   Wheel → Spin:', statsResult.data.data.conversion_rates.wheel_to_spin + '%');
    console.log('   Spin → Claim:', statsResult.data.data.conversion_rates.spin_to_claim + '%');
    console.log('   Claim → WhatsApp:', statsResult.data.data.conversion_rates.claim_to_whatsapp + '%');
    console.log('   Overall Conversion:', statsResult.data.data.conversion_rates.overall_conversion + '%');

    console.log('\n✅ Complete funnel test data created successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

createTestFunnelData();
