const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');
code = code.replace(/<\/div>\n      <\/div>\n    <\/header>/, '</div>\n    </header>');
fs.writeFileSync('src/components/Header.tsx', code);
