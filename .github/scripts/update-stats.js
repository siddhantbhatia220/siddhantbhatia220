const https = require('https');
const fs = require('fs');
const path = require('path');

const USERNAME = 'bhatiasiddhant';
const README_PATH = path.join(__dirname, '..', '..', 'README.md');

function fetchLeetCodeStats(username) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `,
      variables: { username }
    });

    const options = {
      hostname: 'leetcode.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.data && json.data.matchedUser && json.data.matchedUser.submitStats) {
            const stats = json.data.matchedUser.submitStats.acSubmissionNum;
            const result = {
              all: 0,
              easy: 0,
              medium: 0,
              hard: 0
            };
            stats.forEach(item => {
              if (item.difficulty === 'All') result.all = item.count;
              if (item.difficulty === 'Easy') result.easy = item.count;
              if (item.difficulty === 'Medium') result.medium = item.count;
              if (item.difficulty === 'Hard') result.hard = item.count;
            });
            resolve(result);
          } else {
            reject(new Error('Invalid LeetCode response structure: ' + body.slice(0, 200)));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

async function updateReadme() {
  try {
    console.log(`Fetching LeetCode stats for ${USERNAME}...`);
    const stats = await fetchLeetCodeStats(USERNAME);
    console.log('Fetched stats:', stats);

    if (!fs.existsSync(README_PATH)) {
      console.error('README.md not found at', README_PATH);
      process.exit(1);
    }

    let readme = fs.readFileSync(README_PATH, 'utf8');

    // Replace badge numbers
    readme = readme.replace(
      /badge\/Solved-[0-9\+\%]+-38bdf8/g,
      `badge/Solved-${stats.all}+-38bdf8`
    );
    readme = readme.replace(
      /badge\/Easy-[0-9\+\%]+-22c55e/g,
      `badge/Easy-${stats.easy}-22c55e`
    );
    readme = readme.replace(
      /badge\/Medium-[0-9\+\%]+-eab308/g,
      `badge/Medium-${stats.medium}-eab308`
    );
    readme = readme.replace(
      /badge\/Hard-[0-9\+\%]+-ef4444/g,
      `badge/Hard-${stats.hard}-ef4444`
    );

    fs.writeFileSync(README_PATH, readme, 'utf8');
    console.log('README.md successfully updated with latest LeetCode stats!');
  } catch (error) {
    console.error('Error updating LeetCode stats:', error);
    process.exit(1);
  }
}

updateReadme();
