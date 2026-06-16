const fs = require('fs');
const path = require('path');
const net = require('net');
const http = require('http');

// ANSI Color helper functions
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function printHeader(title) {
  console.log('\n' + colors.bold + colors.cyan + '='.repeat(60));
  console.log(`  🔍 ${title}`);
  console.log('='.repeat(60) + colors.reset + '\n');
}

// 1. Check Node.js Version
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.replace('v', '').split('.')[0], 10);
  console.log(`${colors.bold}Node.js Version Check:${colors.reset}`);
  if (major >= 18) {
    console.log(`  ${colors.green}✔${colors.reset} Running Node.js ${version} (Recommended >= 18)`);
    return true;
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} Running Node.js ${version}. It is highly recommended to use Node.js v18 or higher for Next.js compatibility.`);
    return false;
  }
}

// 2. Check Directory Structure & Dependencies
function checkDependencies() {
  console.log(`\n${colors.bold}Dependency Checks:${colors.reset}`);
  const rootModules = fs.existsSync(path.join(__dirname, 'node_modules'));
  const frontendModules = fs.existsSync(path.join(__dirname, 'frontend', 'node_modules'));
  const backendModules = fs.existsSync(path.join(__dirname, 'backend', 'node_modules'));

  let healthy = true;

  if (rootModules) {
    console.log(`  ${colors.green}✔${colors.reset} Root node_modules: Installed`);
  } else {
    console.log(`  ${colors.red}✘${colors.reset} Root node_modules: Missing!`);
    healthy = false;
  }

  if (frontendModules) {
    console.log(`  ${colors.green}✔${colors.reset} Frontend node_modules: Installed`);
  } else {
    console.log(`  ${colors.red}✘${colors.reset} Frontend node_modules: Missing!`);
    healthy = false;
  }

  if (backendModules) {
    console.log(`  ${colors.green}✔${colors.reset} Backend node_modules: Installed`);
  } else {
    console.log(`  ${colors.red}✘${colors.reset} Backend node_modules: Missing!`);
    healthy = false;
  }

  if (!healthy) {
    console.log(`\n  ${colors.yellow}👉 FIX: Run "npm run setup" or "npm install" at root to install all dependencies.${colors.reset}`);
  }
  return healthy;
}

// 3. Check Ports
function checkPort(port, name) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve({ port, name, status: 'occupied', free: false });
      } else {
        resolve({ port, name, status: 'error', free: false });
      }
    });
    server.once('listening', () => {
      server.close();
      resolve({ port, name, status: 'free', free: true });
    });
    server.listen(port, '127.0.0.1');
  });
}

// 4. Test Health Check endpoints if servers are online
function checkHealth(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve({ ok: true, data: json });
          } catch {
            resolve({ ok: true, text: data.substring(0, 100) });
          }
        } else {
          resolve({ ok: false, status: res.statusCode });
        }
      });
    });
    req.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });
    req.setTimeout(1500, () => {
      req.destroy();
      resolve({ ok: false, error: 'Timeout' });
    });
  });
}

// 5. Environment File Checks
function checkEnvironments() {
  console.log(`\n${colors.bold}Environment Configurations:${colors.reset}`);
  
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env.local');
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  
  let healthy = true;
  
  // Check backend env
  if (fs.existsSync(backendEnvPath)) {
    console.log(`  ${colors.green}✔${colors.reset} Backend env configuration (.env): Found`);
    const content = fs.readFileSync(backendEnvPath, 'utf8');
    if (!content.includes('PORT=4000')) {
      console.log(`    ${colors.yellow}⚠${colors.reset} PORT in backend/.env is not set to 4000`);
      healthy = false;
    }
  } else {
    console.log(`  ${colors.red}✘${colors.reset} Backend env configuration (.env): Missing!`);
    healthy = false;
  }

  // Check frontend env
  if (fs.existsSync(frontendEnvPath)) {
    console.log(`  ${colors.green}✔${colors.reset} Frontend env configuration (.env.local): Found`);
    const content = fs.readFileSync(frontendEnvPath, 'utf8');
    if (!content.includes('NEXT_PUBLIC_API_URL') || !content.includes('localhost:4000')) {
      console.log(`    ${colors.yellow}⚠${colors.reset} NEXT_PUBLIC_API_URL in frontend/.env.local may not be configured to localhost:4000`);
      healthy = false;
    }
  } else {
    console.log(`  ${colors.red}✘${colors.reset} Frontend env configuration (.env.local): Missing!`);
    healthy = false;
  }

  if (!healthy) {
    console.log(`\n  ${colors.yellow}👉 FIX: Verify your env files match standard configurations. Ensure port is 4000 for backend and 3001 for frontend.${colors.reset}`);
  }
  return healthy;
}

// Main diagnostics runner
async function runDoctor() {
  printHeader('AI Growth Systems - Diagnostic Tool (npm run doctor)');

  checkNodeVersion();
  checkEnvironments();
  checkDependencies();

  console.log(`\n${colors.bold}Port & Process Checks:${colors.reset}`);
  const ports = [
    { num: 3001, name: 'Frontend (Next.js)' },
    { num: 4000, name: 'Backend Express Server' },
    { num: 3306, name: 'MySQL (XAMPP/Local)' }
  ];

  const results = await Promise.all(ports.map(p => checkPort(p.num, p.name)));

  results.forEach(r => {
    if (r.status === 'occupied') {
      console.log(`  ${colors.cyan}ℹ${colors.reset} Port ${r.port} (${r.name}): Active/Occupied`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Port ${r.port} (${r.name}): Offline/Free`);
    }
  });

  console.log(`\n${colors.bold}Health Connection Status Checks:${colors.reset}`);
  
  // Probe backend
  const backendOccupied = results.find(r => r.port === 4000).status === 'occupied';
  if (backendOccupied) {
    console.log(`  Pinging Backend health endpoint...`);
    const beHealth = await checkHealth('http://127.0.0.1:4000/health');
    if (beHealth.ok && beHealth.data && beHealth.data.status === 'ok') {
      console.log(`  ${colors.green}✔${colors.reset} Backend Health GET /health: Online (status: ok)`);
    } else {
      console.log(`  ${colors.red}✘${colors.reset} Backend Health GET /health: Failed (invalid response or status code)`);
    }
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} Backend server offline: Health check skipped.`);
  }

  // Probe frontend
  const frontendOccupied = results.find(r => r.port === 3001).status === 'occupied';
  if (frontendOccupied) {
    console.log(`  Pinging Frontend home page...`);
    const feHealth = await checkHealth('http://127.0.0.1:3001/');
    if (feHealth.ok) {
      console.log(`  ${colors.green}✔${colors.reset} Frontend Health GET /: Online (status: 200)`);
    } else {
      console.log(`  ${colors.red}✘${colors.reset} Frontend Health GET /: Failed (offline or timeout)`);
    }
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} Frontend server offline: Health check skipped.`);
  }

  printHeader('Diagnostics Summary & Actions');
  
  const isHealthy = results.find(r => r.port === 3001).status === 'occupied' && results.find(r => r.port === 4000).status === 'occupied';
  
  if (isHealthy) {
    console.log(`${colors.green}${colors.bold}CONGRATULATIONS! Both Frontend and Backend servers are up and running!${colors.reset}`);
    console.log(`Visit your application here: ${colors.bold}http://localhost:3001${colors.reset}`);
  } else {
    console.log(`${colors.yellow}${colors.bold}System status is OFFLINE.${colors.reset}`);
    console.log(`To run the application, choose one of these actions:`);
    console.log(`  1. Windows: Double-click ${colors.bold}START_DEV.bat${colors.reset} in the project root.`);
    console.log(`  2. PowerShell: Run ${colors.bold}.\\START_DEV.ps1${colors.reset}`);
    console.log(`  3. Terminal: Run ${colors.bold}npm run dev${colors.reset}`);
  }
  console.log('\n');
}

runDoctor();
