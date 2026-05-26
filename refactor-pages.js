const fs = require('fs');
const path = require('path');

const srcPagesDir = path.join(__dirname, 'react-vite', 'src', 'pages');
const appDir = path.join(__dirname, 'app');

const marketingPages = {
  'Landing.tsx': '(marketing)/page.tsx',
  'Loans.tsx': '(marketing)/loans/page.tsx',
  'About.tsx': '(marketing)/about/page.tsx',
  'Contact.tsx': '(marketing)/contact/page.tsx',
  'Blog.tsx': '(marketing)/blog/page.tsx',
  'Features.tsx': '(marketing)/features/page.tsx',
};

const authPages = {
  'Login.tsx': 'login/page.tsx',
  'Signup.tsx': 'signup/page.tsx',
};

const dashboardPages = {
  'app/Dashboard.tsx': 'app/dashboard/page.tsx',
  'app/Rewards.tsx': 'app/rewards/page.tsx',
  'app/ServiceDetail.tsx': 'app/services/[id]/page.tsx',
  'app/Services.tsx': 'app/services/page.tsx',
  'app/Settings.tsx': 'app/settings/page.tsx',
  'app/Transactions.tsx': 'app/transactions/page.tsx',
  'app/Wallet.tsx': 'app/wallet/page.tsx',
};

function processContent(content) {
  content = '"use client";\n' + content;
  
  content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react-router-dom['"];/g, (match, imports) => {
    let newImports = [];
    if (imports.includes('Link')) newImports.push('import Link from "next/link";');
    
    let navHooks = [];
    if (imports.includes('useNavigate')) navHooks.push('useRouter as useNavigate');
    if (imports.includes('useLocation')) navHooks.push('usePathname as useLocation');
    if (imports.includes('useParams')) navHooks.push('useParams');
    
    if (navHooks.length > 0) {
      newImports.push(`import { ${navHooks.join(', ')} } from "next/navigation";`);
    }
    
    return newImports.join('\n');
  });

  content = content.replace(/<Link\s+to=/g, '<Link href=');

  return content;
}

function migratePages(pageMap) {
  for (const [srcName, destPath] of Object.entries(pageMap)) {
    const srcFile = path.join(srcPagesDir, srcName);
    if (!fs.existsSync(srcFile)) continue;

    const destFile = path.join(appDir, destPath);
    const destDir = path.dirname(destFile);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    let content = fs.readFileSync(srcFile, 'utf8');
    content = processContent(content);
    fs.writeFileSync(destFile, content);
    console.log(`Migrated ${srcName} -> ${destPath}`);
  }
}

migratePages(marketingPages);
migratePages(authPages);
migratePages(dashboardPages);
