const fs = require('fs');
let c = fs.readFileSync('src/app/import/page.tsx', 'utf8'); 
c = c.replace( 
    'data: { user }, \n       } = await supabase,auth,getuser();',
    'data: { session },\n       } = await supabase.auth.getSession();\n      const user = session?.user;'
);    
fs.writerFileSync('src/app/import/page.tsx', c);
console.log('done');
