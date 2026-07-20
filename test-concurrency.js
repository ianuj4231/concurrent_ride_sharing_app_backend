/**
 * CONCURRENCY RACE CONDITION TEST SCRIPT
 * Place this file in your project root: ./test-concurrency.js
 * Run using: node test-concurrency.js
 */

const BASE_URL = "http://localhost:3000/api/booking/accept";

// CONFIGURATION: Adjust these IDs based on an active PENDING booking in your database
const BOOKING_ID = 19; 
const COMPETING_DRIVERS = [1, 2, 3]; 

async function simulateDriverAcceptance(driverId) {
  const startTime = Date.now();
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        driverId: driverId,
        bookingId: BOOKING_ID,
      }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text || "Server returned non-JSON response" };
    }

    const duration = Date.now() - startTime;

    return {
      driverId,
      status: response.status,
      ok: response.ok,
      data,
      duration,
    };
  } catch (error) {
    return {
      driverId,
      status: 500,
      ok: false,
      data: { message: error.message },
    };
  }
}

async function runConcurrencyTest() {
  console.clear();
  console.log("==================================================================");
  console.log("🚀 [RACE CONDITION STRESS TEST] Starting Concurrency Simulation");
  console.log(`🎯 Target Booking ID : ${BOOKING_ID}`);
  console.log(`🏎️ Competing Drivers : [ ${COMPETING_DRIVERS.join(", ")} ]`);
  console.log(`⚙️ Endpoint         : POST ${BASE_URL}`);
  console.log("==================================================================\n");

  console.log(`⚡ Firing ${COMPETING_DRIVERS.length} concurrent requests simultaneously...`);
  const launchTime = Date.now();

  // Fire all driver requests at the exact same microsecond using Promise.all
  const promises = COMPETING_DRIVERS.map((driverId) => simulateDriverAcceptance(driverId));
  const results = await Promise.all(promises);

  const totalDuration = Date.now() - launchTime;

  console.log("\n==================================================================");
  console.log(`📊 TEST RESULTS (Completed in ${totalDuration}ms)`);
  console.log("==================================================================\n");

  let winners = 0;
  let losers = 0;

  results.forEach((res) => {
    const responseMessage = res.data?.message || res.data?.error || "Unknown response format";
    if (res.ok && res.data?.success) {
      winners++;
      console.log(`🏆 [WINNER] 🥇 Driver ${res.driverId} won the race! (HTTP 200)`);
      console.log(`   └─ Message: "${responseMessage}"`);
    } else {
      losers++;
      console.log(`❌ [BLOCKED] 🛡️ Driver ${res.driverId} was rejected (HTTP ${res.status})`);
      console.log(`   └─ Reason: "${responseMessage}"`);
    }
  });

  console.log("\n==================================================================");
  if (winners === 1 && losers === COMPETING_DRIVERS.length - 1) {
    console.log("✨ [TEST PASSED] 🎉 Redis Atomic Lock successfully prevented double-booking!");
    console.log(`   └─ Exactly 1 winner and ${losers} safely blocked requests.`);
  } else {
    console.log("⚠️ [TEST WARNING] Unexpected outcome pattern. Check database states.");
  }
  console.log("==================================================================\n");
}

runConcurrencyTest();