const https = require('https');
const fs = require('fs');

const token = process.env.GITHUB_TOKEN || process.argv[2];
const owner = 'projectmock1804';
const repo = 'project-focus';

// Check if release already exists
const options = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/releases/tags/v1.0.6`,
  method: 'GET',
  headers: {
    'Authorization': `token ${token}`,
    'User-Agent': 'Node.js'
  }
};

https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const release = JSON.parse(data);
      console.log('Release found:', release.tag_name, 'ID:', release.id);
      console.log('Assets:', release.assets.length);
    } catch(e) {
      console.log('No release found yet (Status:', res.statusCode + ')');
    }
  });
}).end();
