(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3989],{27036:function(n,e,l){"use strict";var i=l(64836);e.Z=void 0;var o=i(l(64938)),t=l(85893),r=(0,o.default)((0,t.jsx)("path",{d:"M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"}),"Check");e.Z=r},58849:function(n,e,l){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/constellations",function(){return l(10719)}])},33583:function(n,e,l){"use strict";var i=l(85893),o=l(67294),t=l(98396),r=l(11703),s=l(40044);e.Z=n=>{let{tabs:e,children:l,onTabChange:d}=n,[a,u]=(0,o.useState)(0),c=(0,t.Z)(n=>n.breakpoints.down("md"),{noSsr:!0}),v=Array.isArray(l)?l:[l];return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(r.Z,{centered:!c||c&&e.length<4,scrollButtons:!0,allowScrollButtonsMobile:!0,sx:{marginBottom:3},variant:c&&e.length>4?"scrollable":"standard",value:a,onChange:(n,e)=>{u(e),d&&d(e)},children:null==e?void 0:e.map((n,e)=>(0,i.jsx)(s.Z,{label:n},"".concat(n,"-").concat(e)))}),d?l:null==v?void 0:v.map((n,e)=>e===a?n:null)]})}},10719:function(n,e,l){"use strict";l.r(e),l.d(e,{default:function(){return P}});var i=l(85893),o=l(67294),t=l(41422),r=l(98396),s=l(51233),d=l(15861),a=l(86886),u=l(67720),c=l(39574),v=l(27036),p=n=>{let{constellations:e=[]}=n,l=(0,r.Z)(n=>n.breakpoints.down("md"),{noSsr:!0});return(0,i.jsxs)(s.Z,{gap:3,children:[(0,i.jsxs)(d.Z,{variant:"h5",textAlign:"center",children:["Total Points: ",(()=>{let{ownedPoints:n,totalPoints:l}=null==e?void 0:e.reduce((n,e)=>{let{points:l,done:i}=e;return i&&(n.ownedPoints+=l),n.totalPoints+=l,n},{ownedPoints:0,totalPoints:0});return"".concat(n," / ").concat(l)})()]}),(0,i.jsxs)(a.ZP,{rowGap:2,justifyContent:"center",container:!0,children:[l?null:(0,i.jsx)(a.ZP,{item:!0,xs:1,children:(0,i.jsx)(d.Z,{variant:"body1",component:"span",children:"Name"})}),(0,i.jsx)(a.ZP,{item:!0,xs:1,children:(0,i.jsx)(d.Z,{variant:"body1",component:"span",children:l?"":"Progress"})}),(0,i.jsx)(a.ZP,{item:!0,xs:2,children:(0,i.jsx)(d.Z,{pl:l?0:6,variant:"body1",component:"span",children:l?"Loc.":"Location"})}),(0,i.jsx)(a.ZP,{item:!0,xs:3,children:(0,i.jsx)(d.Z,{pl:l?0:6,variant:"body1",component:"span",children:l?"Req.":"Requirement"})}),(0,i.jsx)(a.ZP,{item:!0,xs:4,children:(0,i.jsx)(d.Z,{pl:l?0:6,variant:"body1",component:"span",children:"Points"})}),(0,i.jsx)(a.ZP,{item:!0,md:1})]}),null==e?void 0:e.map((n,t)=>{var r;let{name:s,points:p,done:x,requirement:h,completedChars:m,requiredPlayers:j,location:Z}=n;return(0,i.jsxs)(o.Fragment,{children:[(0,i.jsxs)(a.ZP,{rowGap:2,gap:1,container:!0,children:[l?null:(0,i.jsx)(a.ZP,{item:!0,xs:1,children:(0,i.jsx)(d.Z,{variant:"body1",component:"span",children:(0,c.cleanUnderscore)(s)})}),(0,i.jsx)(a.ZP,{item:!0,xs:1,children:x?(0,i.jsx)(v.Z,{color:"success"}):(0,i.jsx)(d.Z,{variant:"body1",component:"span",children:"".concat(null!==(r=null==m?void 0:m.length)&&void 0!==r?r:0,"/").concat(j)})}),(0,i.jsx)(a.ZP,{item:!0,xs:2,children:"End_Of_The_Road"===Z?(0,c.cleanUnderscore)(Z)+" *":(0,c.cleanUnderscore)(Z)}),(0,i.jsx)(a.ZP,{item:!0,xs:3,children:(0,c.cleanUnderscore)(h)}),(0,i.jsx)(a.ZP,{item:!0,xs:2,sm:1,children:p}),(0,i.jsx)(a.ZP,{item:!0,xs:2,children:(null==m?void 0:m.length)>0?(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(d.Z,{variant:"caption",component:"div",children:"Completed Chars"}),(0,i.jsxs)(d.Z,{variant:"caption",sx:{wordBreak:"break-word"},children:["indexes: ",(0,c.constellationIndexes)(m)]})]}):null})]}),e.length-1!==t?(0,i.jsx)(u.Z,{}):null]},s+" "+t)})]})},x=l(87357),h=l(33583),m=n=>{var e;let{starSigns:l,infiniteStars:t}=n,[p,m]=(0,o.useState)(0),j=(0,r.Z)(n=>n.breakpoints.down("md"),{noSsr:!0}),Z=(0,o.useMemo)(()=>l.filter(n=>{let{tree:e}=n;return"chronus"===e}),[l,t]),f=(0,o.useMemo)(()=>l.filter(n=>{let{tree:e}=n;return"hydron"===e}),[l,t]);return t=0===p?t:t-34,(0,i.jsx)(i.Fragment,{children:(0,i.jsx)(h.Z,{tabs:["chronus","hydron"],onTabChange:n=>m(n),children:(0,i.jsxs)(s.Z,{gap:3,children:[(0,i.jsxs)(a.ZP,{container:!0,children:[(0,i.jsx)(a.ZP,{item:!0,md:4,sx:{display:{sm:"none",md:"block"}},children:"Name"}),(0,i.jsx)(a.ZP,{item:!0,xs:8,md:4,children:"Bonuses"}),(0,i.jsx)(a.ZP,{item:!0,xs:2,md:4,pl:5,children:"Cost"})]}),null===(e=0===p?Z:f)||void 0===e?void 0:e.map((n,e)=>{let{indexedStarName:r,cost:s,unlocked:h,bonuses:m,description:Z}=n;return!r.includes("Filler")&&!r.includes("Unknown")&&(0,i.jsxs)(o.Fragment,{children:[(0,i.jsxs)(a.ZP,{rowGap:2,container:!0,children:[(0,i.jsxs)(a.ZP,{item:!0,alignItems:"center",gap:2,md:4,sx:{display:{sm:"none",md:"flex"},justifyContent:{xs:"center",sm:"center",md:"flex-start"}},children:[h?(0,i.jsx)(v.Z,{color:"success"}):(0,i.jsx)(x.Z,{width:24,height:24}),j?null:(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(d.Z,{variant:"body1",component:"span",children:(0,c.cleanUnderscore)(r)}),t>=e?(0,i.jsx)("img",{src:"".concat(c.prefix,"data/SignStarInf").concat(0===p?0:1,".png"),alt:""}):null]})]}),(0,i.jsxs)(a.ZP,{item:!0,sm:7,md:4,display:"flex",alignItems:"center",gap:2,children:[j&&h?(0,i.jsx)(v.Z,{color:"success"}):null,(0,i.jsx)(d.Z,{variant:"body1",component:"span",children:m?null==m?void 0:m.map(n=>{let{rawName:e,bonus:l}=n;return(0,c.cleanUnderscore)(e.replace("{",l))}).join(", "):(0,c.cleanUnderscore)(Z)})]}),(0,i.jsxs)(a.ZP,{item:!0,sm:4,md:4,children:[" ",(0,i.jsx)(d.Z,{variant:"body1",pl:5,component:"span",children:s})]})]}),l.length-1!==e?(0,i.jsx)(u.Z,{}):null]},name+" "+e)})]})})})},j=l(2962),Z=l(58696),f=l(65492);let g=["Constellations","Star Signs"];var P=()=>{var n,e,l,r,s;let{state:d}=(0,o.useContext)(t.I),a=(n,e)=>{if((0,f.R)(n,"Infinite_Stars"))return 5+(0,Z.du)(e,"Infinite_Star_Signs")},u=n=>{let e=null==n?void 0:n.sort((n,e)=>n.indexedStarName.localeCompare(e.indexedStarName,"en",{numeric:!0})),l=null==e?void 0:e.pop();return e.splice(21,0,l),e},c=(0,o.useMemo)(()=>{var n,e,l;return a(null==d?void 0:null===(n=d.account)||void 0===n?void 0:n.rift,null==d?void 0:null===(e=d.account)||void 0===e?void 0:null===(l=e.breeding)||void 0===l?void 0:l.pets)},[null==d?void 0:null===(n=d.account)||void 0===n?void 0:n.rift,null==d?void 0:null===(e=d.account)||void 0===e?void 0:null===(l=e.breeding)||void 0===l?void 0:l.pets]),v=(0,o.useMemo)(()=>{var n;return u(null==d?void 0:null===(n=d.account)||void 0===n?void 0:n.starSigns)},[null==d?void 0:null===(r=d.account)||void 0===r?void 0:r.starSigns]);return(0,i.jsxs)("div",{children:[(0,i.jsx)(j.PB,{title:"Idleon Toolbox | Constellations",description:"Constellation and star signs overview"}),(0,i.jsxs)(h.Z,{tabs:g,children:[(0,i.jsx)(p,{constellations:null==d?void 0:null===(s=d.account)||void 0===s?void 0:s.constellations}),(0,i.jsx)(m,{starSigns:v,infiniteStars:c})]})]})}},58696:function(n,e,l){"use strict";l.d(e,{N5:function(){return t},cg:function(){return d},du:function(){return s}});var i=l(72032),o=l(39574);let t=(n,e)=>{let l=(0,o.tryToParse)(null==n?void 0:n.Breeding)||(null==n?void 0:n.Breeding),i=(0,o.tryToParse)(null==n?void 0:n.Pets)||(null==n?void 0:n.Pets),t=(0,o.tryToParse)(null==n?void 0:n.PetsStored)||(null==n?void 0:n.PetsStored);return r(l,i,t,e)},r=(n,e,l,o)=>{var t,r,s,d,a,u,c;let v=null==n?void 0:n[0],p=null==n?void 0:null===(t=n[3])||void 0===t?void 0:t[8],x=null==n?void 0:n[1],h=null==n?void 0:null===(r=n[2])||void 0===r?void 0:r.map((n,e)=>({...i.petUpgrades[e]||[],level:n})),m=null==l?void 0:l.map(n=>{let[e,l,i]=n;return{name:e,level:l,power:i}}),j=null==n?void 0:n.slice(4,8),Z=null==n?void 0:n.slice(22,26),f=null==n?void 0:null===(s=n[2])||void 0===s?void 0:s[4],g=Math.round(5+f+2*(null!==(c=null==o?void 0:null===(d=o.gemShopPurchases)||void 0===d?void 0:d.find((n,e)=>125===e))&&void 0!==c?c:0)),P=null==e?void 0:e.slice(0,g),w=null==P?void 0:P.reduce((n,e)=>{let[l,,,i]=e;return 0===i?n:{...n,[l]:(null==n?void 0:n[l])?(null==n?void 0:n[l])+1:1}},{}),b=[],y={},S=null===i.petStats||void 0===i.petStats?void 0:i.petStats.map((n,e)=>{let l=null==x?void 0:x[e];return null==n?void 0:n.map((n,i)=>{var o,t,r,s,d;let a=null===(o=Array(19).fill(1))||void 0===o?void 0:o.reduce((n,l,o)=>{var t;return(null==Z?void 0:null===(t=Z[e])||void 0===t?void 0:t[i])>Math.floor((1+Math.pow(o+1,1.6))*Math.pow(1.7,o+1))?o+2:n},0);a=(null==Z?void 0:null===(t=Z[e])||void 0===t?void 0:t[i])===0?0:0===a?1:a;let u=Math.floor((1+Math.pow(a,1.6))*Math.pow(1.7,a)),c=Math.round((null==n?void 0:n.baseValue)*a),v={...n,level:null==j?void 0:null===(r=j[e])||void 0===r?void 0:r[i],shinyLevel:a,progress:null==Z?void 0:null===(s=Z[e])||void 0===s?void 0:s[i],goal:u,rawPassive:null==n?void 0:n.passive,passive:null==n?void 0:null===(d=n.passive)||void 0===d?void 0:d.replace("{",c),passiveValue:c,unlocked:i<l};return(null==y?void 0:y[null==n?void 0:n.passive])?y[null==n?void 0:n.passive]+=c:c>0&&(y[null==n?void 0:n.passive]=c),(null==w?void 0:w[null==n?void 0:n.monsterRawName])&&b.push(v),v})});return{passivesTotals:y,storedPets:m,eggs:v,deadCells:p,speciesUnlocks:x,fencePets:b,fencePetsObject:w,maxArenaLevel:null==o?void 0:null===(a=o.accountOptions)||void 0===a?void 0:a[89],timeToNextEgg:(null==o?void 0:null===(u=o.accountOptions)||void 0===u?void 0:u[87])*1e3,petUpgrades:h,arenaBonuses:i.arenaBonuses,pets:S}},s=(n,e)=>null==n?void 0:n.reduce((n,l)=>n+(null==l?void 0:l.reduce((n,l)=>{let{passive:i,passiveValue:o}=l;return n+(i.includes(e)&&o)},0)),0),d=(n,e,l,i)=>{if((null==n?void 0:n.shinyLevel)===i)return 0;let o=0;for(let e=null==n?void 0:n.shinyLevel;e<i;e++)o+=Math.floor((1+Math.pow(e,1.6))*Math.pow(1.7,e));return(o-(null==n?void 0:n.progress))/e/(l||1)*864e5}},65492:function(n,e,l){"use strict";l.d(e,{R:function(){return s},w:function(){return t}});var i=l(39574),o=l(72032);let t=n=>{let e=(0,i.tryToParse)(null==n?void 0:n.Rift)||(null==n?void 0:n.Rift);return r(e)},r=n=>{let[e,l,i]=n||[];return{list:o.riftInfo,currentRift:parseInt(e),currentProgress:l,chars:i}},s=(n,e)=>{var l;return null==n?void 0:null===(l=n.list)||void 0===l?void 0:l.find((l,i)=>{let{riftBonus:o}=l;return o===e&&i<=(null==n?void 0:n.currentRift)})}}},function(n){n.O(0,[6886,9774,2888,179],function(){return n(n.s=58849)}),_N_E=n.O()}]);