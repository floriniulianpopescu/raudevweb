import app from "./index";
import { prisma } from "./lib/prisma";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("Starting Better Auth verification test suite...\n");

  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "SuperSecurePassword123!";
  const testName = "Test Developer";

  try {
    // 1. Test Health endpoint
    console.log("1. Testing GET /health...");
    const healthRes = await app.fetch(new Request(`${BASE_URL}/health`));
    const healthJson = await healthRes.json();
    console.log("   Health status:", healthJson.status);
    if (healthRes.status !== 200 || healthJson.status !== "ok") {
      throw new Error(`Health check failed: ${JSON.stringify(healthJson)}`);
    }

    // 2. Test Sign-Up
    console.log(`\n2. Testing POST /api/auth/sign-up/email for ${testEmail}...`);
    const signUpRes = await app.fetch(
      new Request(`${BASE_URL}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: testName,
        }),
      })
    );

    const signUpJson = await signUpRes.json();
    console.log("   Sign-up status code:", signUpRes.status);
    console.log("   User created:", signUpJson.user?.email, "ID:", signUpJson.user?.id);
    if (signUpRes.status !== 200) {
      throw new Error(`Sign-up failed: ${JSON.stringify(signUpJson)}`);
    }

    // Extract cookie
    const setCookie = signUpRes.headers.get("set-cookie") || "";
    console.log("   Set-Cookie received:", setCookie.slice(0, 40) + "...");

    // 3. Test Unauthenticated access to protected route
    console.log("\n3. Testing GET /api/user/me without auth (expecting 401)...");
    const unauthRes = await app.fetch(new Request(`${BASE_URL}/api/user/me`));
    console.log("   Status code:", unauthRes.status);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got: ${unauthRes.status}`);
    }

    // 4. Test Authenticated access via Cookie
    console.log("\n4. Testing GET /api/user/me with session cookie...");
    const cookieRes = await app.fetch(
      new Request(`${BASE_URL}/api/user/me`, {
        headers: {
          Cookie: setCookie,
        },
      })
    );
    const cookieJson = await cookieRes.json();
    console.log("   Status code:", cookieRes.status);
    console.log("   Authenticated as:", cookieJson.user?.email, "Role:", cookieJson.user?.role);
    if (cookieRes.status !== 200 || cookieJson.user?.email !== testEmail) {
      throw new Error(`Cookie auth failed: ${JSON.stringify(cookieJson)}`);
    }

    // 5. Test Bearer Token access (Dual Mode)
    console.log("\n5. Testing GET /api/user/me with Bearer token (Bearer plugin)...");
    const sessionToken = cookieJson.session.token;
    const bearerRes = await app.fetch(
      new Request(`${BASE_URL}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      })
    );
    const bearerJson = await bearerRes.json();
    console.log("   Status code:", bearerRes.status);
    console.log("   Bearer authenticated as:", bearerJson.user?.email);
    if (bearerRes.status !== 200 || bearerJson.user?.email !== testEmail) {
      throw new Error(`Bearer token auth failed: ${JSON.stringify(bearerJson)}`);
    }

    // 6. Test Admin Role protection on /api/user/admin/dashboard
    console.log("\n6. Testing GET /api/user/admin/dashboard with regular user (expecting 403)...");
    const forbiddenRes = await app.fetch(
      new Request(`${BASE_URL}/api/user/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      })
    );
    console.log("   Status code:", forbiddenRes.status);
    if (forbiddenRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got: ${forbiddenRes.status}`);
    }

    // 7. Elevate user to admin in DB and re-test
    console.log("\n7. Elevating user role to 'admin' in PostgreSQL and re-testing...");
    await prisma.user.update({
      where: { email: testEmail },
      data: { role: "admin" },
    });

    const adminRes = await app.fetch(
      new Request(`${BASE_URL}/api/user/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      })
    );
    const adminJson = await adminRes.json();
    console.log("   Status code:", adminRes.status);
    console.log("   Admin dashboard stats:", JSON.stringify(adminJson.stats));
    if (adminRes.status !== 200 || !adminJson.stats) {
      throw new Error(`Admin route failed after role elevation: ${JSON.stringify(adminJson)}`);
    }

    // 8. Test Sign-Out (with Origin header for CSRF protection)
    console.log("\n8. Testing POST /api/auth/sign-out...");
    const signOutRes = await app.fetch(
      new Request(`${BASE_URL}/api/auth/sign-out`, {
        method: "POST",
        headers: {
          Cookie: setCookie,
          Origin: BASE_URL,
        },
      })
    );
    console.log("   Sign-out status code:", signOutRes.status);

    // 9. Verify session invalidated
    console.log("\n9. Verifying session is invalidated after sign-out (expecting 401)...");
    const afterSignOutRes = await app.fetch(
      new Request(`${BASE_URL}/api/user/me`, {
        headers: {
          Cookie: setCookie,
        },
      })
    );
    console.log("   Status code:", afterSignOutRes.status);
    if (afterSignOutRes.status !== 401) {
      throw new Error(`Expected 401 after sign-out, got: ${afterSignOutRes.status}`);
    }

    console.log("\n ALL 9 VERIFICATION CHECKS PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("\n Test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
