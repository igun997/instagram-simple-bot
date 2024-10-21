require('dotenv').config();
const puppeteer = require('puppeteer');

const IG_USERNAME = process.env.IG_USERNAME;
const IG_PASSWORD = process.env.IG_PASSWORD;
const FOLLOW_LIMIT = 20;  // Set to 5 for testing
const BREAK_TIME = 5 * 60 * 1000;  // 5-minute break in milliseconds

async function login(page) {
  // Navigate to Instagram login page
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });

  // Fill in the username and password
  await page.type('input[name="username"]', IG_USERNAME, { delay: 100 });
  await page.type('input[name="password"]', IG_PASSWORD, { delay: 100 });

  // Click the login button
  await page.click('button[type="submit"]');

  // Wait for the main page to load after login
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log('Logged in successfully');
}

async function followSuggestedUsers(page) {
  let followCount = 0;

  // Navigate to the "Suggested for You" section
  await page.goto('https://www.instagram.com/explore/people/', { waitUntil: 'networkidle2' });
  console.log('Navigated to Suggested for You page');

  while (followCount < FOLLOW_LIMIT) {
    // Scroll to load more suggested users
    await autoScroll(page);

    // Get the follow buttons on the page
    const followButtons = await page.$$('button');

    for (const followButton of followButtons) {
      const buttonText = await page.evaluate(el => el.innerText, followButton);

      if (buttonText.toLowerCase() === 'follow') {
        await followButton.click();
        followCount++;
        console.log(`Followed a suggested user. Total follows: ${followCount}`);

        // Random delay between actions (5-10 seconds for testing)
        const delay = randomInt(5000, 10000);
        console.log(`Waiting for ${delay / 1000} seconds before next follow...`);
        await wait(delay);
      }

      // Stop if follow limit is reached
      if (followCount >= FOLLOW_LIMIT) break;
    }
  }

  console.log(`Reached follow limit (${FOLLOW_LIMIT}). Taking a 5-minute break...`);
  await wait(BREAK_TIME);  // 5-minute break
}

// Utility function to auto-scroll the page to load more users
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Utility function to wait for a specified time
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility function to generate random integers
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Login to Instagram
    await login(page);

    while (true) {
      // Keep following suggested users in a loop with a break after reaching the limit
      await followSuggestedUsers(page);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
})();
