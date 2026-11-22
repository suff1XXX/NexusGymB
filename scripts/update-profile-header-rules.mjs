import {readFileSync,writeFileSync} from 'node:fs';
const path=process.argv[2]||'firestore.rules';let source=readFileSync(path,'utf8');
const start=source.indexOf('    function validAppearance(a) {'),end=source.indexOf('    function validPublicProfile(uid)',start);
if(start<0||end<0)throw Error('Profile appearance validation not found.');
let block=source.slice(start,end);
if(!block.includes("'headerMode'")){
  block=block.replace("'hoverEffect','motion'])","'hoverEffect','motion','headerMode','headerBackground','headerAccent','headerSurface','headerShape','headerTitle'])");
  if(!block.includes("'headerMode'"))throw Error('Appearance field allowlist not found.');
}
const rules=`        // PROFILE HEADER BEGIN
        && a.get('headerMode','default') in ['default','profile','custom']
        && a.get('headerBackground','#ffffff') is string && a.get('headerBackground','#ffffff').matches('#[0-9a-fA-F]{6}')
        && a.get('headerAccent','#2563eb') is string && a.get('headerAccent','#2563eb').matches('#[0-9a-fA-F]{6}')
        && a.get('headerSurface','solid') in ['solid','glass','gradient']
        && a.get('headerShape','rounded') in ['rounded','pill','square']
        && a.get('headerTitle','Nexus GymB') is string && a.get('headerTitle','Nexus GymB').matches('[^[:cntrl:]]{1,32}')
        // PROFILE HEADER END
`;
if(block.includes('        // PROFILE HEADER BEGIN'))block=block.replace(/        \/\/ PROFILE HEADER BEGIN[\s\S]*?        \/\/ PROFILE HEADER END\r?\n/,rules);
else block=block.replace('        && a.angle is int',rules+'        && a.angle is int');
if(!block.includes('        // PROFILE HEADER BEGIN'))throw Error('Appearance parameter validation not found.');
source=source.slice(0,start)+block+source.slice(end);writeFileSync(path,source);console.log('Updated profile header appearance rules.');
