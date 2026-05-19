#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Checks if your project is ready to deploy
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Jammazing Deployment Readiness Check\n');

const checks = [];

// Check 1: package.json exists
checks.push({
    name: 'package.json exists',
    check: () => fs.existsSync('package.json'),
    fix: 'Ensure package.json is in the root directory'
});

// Check 2: .env.example exists
checks.push({
    name: '.env.example exists',
    check: () => fs.existsSync('.env.example'),
    fix: 'Create .env.example with environment variables'
});

// Check 3: netlify.toml exists
checks.push({
    name: 'netlify.toml exists',
    check: () => fs.existsSync('netlify.toml'),
    fix: 'Create netlify.toml for Netlify configuration'
});

// Check 4: railway.json exists
checks.push({
    name: 'railway.json exists',
    check: () => fs.existsSync('railway.json'),
    fix: 'Create railway.json for Railway deployment'
});

// Check 5: Procfile exists
checks.push({
    name: 'Procfile exists',
    check: () => fs.existsSync('Procfile'),
    fix: 'Create Procfile with: web: npm start'
});

// Check 6: server.js exists
checks.push({
    name: 'server.js exists',
    check: () => fs.existsSync('server.js'),
    fix: 'Ensure server.js is in the root directory'
});

// Check 7: Pages directory exists
checks.push({
    name: 'Pages/ directory exists',
    check: () => fs.existsSync('Pages'),
    fix: 'Ensure Pages/ directory with HTML files exists'
});

// Check 8: .gitignore exists
checks.push({
    name: '.gitignore exists',
    check: () => fs.existsSync('.gitignore'),
    fix: 'Create .gitignore to exclude node_modules and .env'
});

// Check 9: DEPLOYMENT.md exists
checks.push({
    name: 'DEPLOYMENT.md exists',
    check: () => fs.existsSync('DEPLOYMENT.md'),
    fix: 'Create DEPLOYMENT.md with deployment instructions'
});

// Check 10: js/api.js uses dynamic API URL
checks.push({
    name: 'js/api.js uses dynamic API URL',
    check: () => {
        if (!fs.existsSync('js/api.js')) return false;
        const content = fs.readFileSync('js/api.js', 'utf8');
        return content.includes('getApiUrl') || content.includes('REACT_APP_API_URL');
    },
    fix: 'Update js/api.js to use environment variables instead of hardcoded localhost'
});

// Check 11: server.js has environment variable support
checks.push({
    name: 'server.js has dotenv and env var support',
    check: () => {
        if (!fs.existsSync('server.js')) return false;
        const content = fs.readFileSync('server.js', 'utf8');
        return content.includes('dotenv') || content.includes('process.env');
    },
    fix: 'Update server.js to require dotenv and use environment variables'
});

// Check 12: npm start in package.json
checks.push({
    name: 'npm start command configured',
    check: () => {
        if (!fs.existsSync('package.json')) return false;
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return pkg.scripts && pkg.scripts.start;
    },
    fix: 'Add start script to package.json: "start": "node server.js"'
});

// Run checks
let passed = 0;
let failed = 0;

checks.forEach((check, index) => {
    const result = check.check();
    const status = result ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${check.name}`);
    if (!result) {
        console.log(`   → ${check.fix}`);
        failed++;
    } else {
        passed++;
    }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`\nResults: ${passed}/${checks.length} checks passed\n`);

if (failed === 0) {
    console.log('🎉 Your project is ready for deployment!\n');
    console.log('Next steps:');
    console.log('1. Push to GitHub: git push -u origin main');
    console.log('2. Deploy backend to Railway/Render');
    console.log('3. Deploy frontend to Netlify');
    console.log('\nSee QUICK_START_DEPLOY.md for detailed instructions\n');
    process.exit(0);
} else {
    console.log(`⚠️  Fix ${failed} issue(s) before deploying\n`);
    process.exit(1);
}
