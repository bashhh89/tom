const fs = require('fs');
const path = require('path');

console.log('Copying public assets and static files to standalone build...');

// Copy public folder
const publicSrc = path.join(process.cwd(), 'public');
const publicDest = path.join(process.cwd(), '.next/standalone/public');

if (fs.existsSync(publicSrc)) {
  // Create the public directory in standalone if it doesn't exist
  if (!fs.existsSync(publicDest)) {
    fs.mkdirSync(publicDest, { recursive: true });
  }
  
  // Copy all files from public to standalone/public
  const copyRecursive = (src, dest) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  copyRecursive(publicSrc, publicDest);
  console.log('✅ Public assets copied successfully');
} else {
  console.log('⚠️ Public folder not found');
}

// Copy static folder
const staticSrc = path.join(process.cwd(), '.next/static');
const staticDest = path.join(process.cwd(), '.next/standalone/.next/static');

if (fs.existsSync(staticSrc)) {
  // Create the static directory in standalone if it doesn't exist
  if (!fs.existsSync(staticDest)) {
    fs.mkdirSync(staticDest, { recursive: true });
  }
  
  // Copy all files from .next/static to standalone/.next/static
  const copyRecursive = (src, dest) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  copyRecursive(staticSrc, staticDest);
  console.log('✅ Static files copied successfully');
} else {
  console.log('⚠️ Static folder not found');
}

// Copy API route templates
const apiTemplates = [
  'app/api/generate-scorecard-weasyprint-report/template.html',
  'app/api/generate-presentation-weasyprint-report/template-full-width.html'
];

for (const templatePath of apiTemplates) {
  const srcPath = path.join(process.cwd(), templatePath);
  const destPath = path.join(process.cwd(), '.next/standalone', templatePath);
  
  if (fs.existsSync(srcPath)) {
    // Create the destination directory if it doesn't exist
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy the template file
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Template copied: ${templatePath}`);
  } else {
    console.log(`⚠️ Template not found: ${templatePath}`);
  }
}

console.log('✅ All assets copied to standalone build'); 