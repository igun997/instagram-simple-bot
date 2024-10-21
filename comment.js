require('dotenv').config();
const puppeteer = require('puppeteer');

const IG_USERNAME = process.env.IG_USERNAME;
const IG_PASSWORD = process.env.IG_PASSWORD;
const HASHTAG = 'coding';  // Change this to the hashtag you want to explore
const COMMENT_TEXT = 'Awesome post! Keep it up!';  // Change this to your desired comment
const COMMENT_LIMIT = 5;  // Set to 5 comments for testing
const BREAK_TIME = 5 * 60 * 1000;  // 5-minute break between comment cycles

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

async function exploreHashtagAndComment(page) {
  let commentCount = 0;

  // Navigate to the hashtag page
  await page.goto(`https://www.instagram.com/explore/tags/${HASHTAG}/`, { waitUntil: 'networkidle2' });
  console.log(`Exploring hashtag: #${HASHTAG}`);

  while (commentCount < COMMENT_LIMIT) {
    // Get all the post links on the page
    const postLinks = await page.$$eval('a[href*="/p/"]', links => links.map(link => link.href));

    for (let postLink of postLinks) {
      if (commentCount >= COMMENT_LIMIT) break;

      // Visit the post page
      await page.goto(postLink, { waitUntil: 'networkidle2' });

      // Wait for the comment box and type the comment
      const commentBox = await page.waitForSelector('textarea');
      await commentBox.type(COMMENT_TEXT, { delay: 100 });

      // Submit the comment
      await page.keyboard.press('Enter');
      commentCount++;
      console.log(`Commented: "${COMMENT_TEXT}" on ${postLink}`);

      // Random delay between actions (5-10 seconds for testing)
      const delay = randomInt(5000, 10000);
      console.log(`Waiting for ${delay / 1000} seconds before the next comment...`);
      await wait(delay);
    }

    // Scroll down to load more posts
    await autoScroll(page);
  }

  console.log(`Reached comment limit (${COMMENT_LIMIT}). Taking a 5-minute break...`);
  await wait(BREAK_TIME);  // 5-minute break
}

// Utility function to auto-scroll the page to load more posts
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

    // Explore hashtag and comment on posts
    await exploreHashtagAndComment(page);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
})();
