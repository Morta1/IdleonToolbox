(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1178],{20466:function(t,e,n){"use strict";n.d(e,{Z:function(){return o}});var i=n(19013),l=n(13882);function o(t){return(0,l.Z)(1,arguments),(0,i.Z)(t).getDay()}},33913:function(t,e,n){"use strict";n.d(e,{Z:function(){return o}});var i=n(19013),l=n(13882);function o(t){return(0,l.Z)(1,arguments),(0,i.Z)(t).getTime()<Date.now()}},49352:function(t,e,n){"use strict";n.d(e,{Z:function(){return o}});var i=n(19013),l=n(13882);function o(t){return(0,l.Z)(1,arguments),4===(0,i.Z)(t).getDay()}},85148:function(t,e,n){"use strict";n.d(e,{Z:function(){return s}});var i=n(77349),l=n(20466),o=n(13882);function s(t){return(0,o.Z)(1,arguments),function(t,e){(0,o.Z)(2,arguments);var n=4-(0,l.Z)(t);return n<=0&&(n+=7),(0,i.Z)(t,n)}(t,4)}},23284:function(t,e,n){"use strict";n.d(e,{Z:function(){return s}});var i=n(13882),l=n(20466),o=n(7069);function s(t){return(0,i.Z)(1,arguments),function(t,e){(0,i.Z)(2,arguments);var n=(0,l.Z)(t)-4;return n<=0&&(n+=7),(0,o.Z)(t,n)}(t,4)}},28366:function(t,e,n){"use strict";n.d(e,{Z:function(){return l}});var i=n(69119);function l(){return(0,i.Z)(Date.now())}},17598:function(t,e,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/misc/general",function(){return n(86043)}])},86043:function(t,e,n){"use strict";n.r(e),n.d(e,{default:function(){return E}});var i=n(85893),l=n(51233),o=n(49260),s=n(23472),r=n(15861),a=n(82557),c=n(44358);let d={style:{width:32,height:32,objectFit:"contain"}};var u=t=>{var e;let{money:n=[],WorldTeleports:o,ObolFragments:u,ColosseumTickets:v,SilverPens:x,gems:h,KeysAll:j,minigamePlays:m}=t;return(0,i.jsxs)(l.Z,{children:[(0,i.jsx)(s.Z,{className:"box",money:n}),(0,i.jsx)(r.Z,{mt:2,mb:1,textAlign:"center",children:"Currencies"}),(0,i.jsxs)(l.Z,{flexWrap:"wrap",gap:1,justifyContent:"center",direction:"row",children:[(0,i.jsx)(a.M5,{title:"World Teleports",stat:o,icon:"rtt0",img:d}),(0,i.jsx)(a.M5,{title:"Obol Fragments",stat:u,icon:"ObolFrag",img:d}),(0,i.jsx)(c.Z,{title:(0,i.jsx)(l.Z,{gap:2,children:null==v?void 0:null===(e=v.allTickets)||void 0===e?void 0:e.map((t,e)=>{let{rawName:n,amount:o,totalAmount:s,amountPerDay:r,daysSincePickup:c}=t;return(0,i.jsxs)(l.Z,{direction:"row",gap:1,children:[(0,i.jsx)(l.Z,{children:(0,i.jsx)(a.M5,{stat:"",icon:n,img:d})}),(0,i.jsxs)(l.Z,{children:[(0,i.jsx)(a.uQ,{title:"Tickets Per Day",value:r}),(0,i.jsx)(a.uQ,{title:"Days Since Pickup",value:isNaN(c)?0:c}),(0,i.jsx)(a.uQ,{title:"Total Keys",value:isNaN(s)?0:s})]})]},"".concat(n,"-").concat(e))})}),children:(0,i.jsx)(a.M5,{stat:null==v?void 0:v.totalAmount,icon:"TixCol",img:d})}),(0,i.jsx)(a.M5,{title:"Silver Pens",stat:x,icon:"SilverPen",img:d}),(0,i.jsx)(a.M5,{title:"Gems",stat:h,icon:"PremiumGem",img:d}),(0,i.jsx)(a.M5,{title:"Minigame Plays",stat:m,img:d,icon:"MGp"}),null==j?void 0:j.map((t,e)=>{let{rawName:n,amount:o,totalAmount:s,amountPerDay:r,daysSincePickup:u}=t;return(0,i.jsx)(c.Z,{title:(0,i.jsxs)(l.Z,{children:[(0,i.jsx)(a.uQ,{title:"Keys Per Day",value:r}),(0,i.jsx)(a.uQ,{title:"Days Since Pickup",value:isNaN(u)?0:u}),(0,i.jsx)(a.uQ,{title:"Total Keys",value:isNaN(s)?0:s})]}),children:(0,i.jsx)(a.M5,{stat:o,icon:n,img:d})},"".concat(n,"-").concat(e))})]})]})},v=n(66092),x=n(24438),h=n(67924),j=n(94217);let m=t=>{let{name:e,description:n,shrineLevel:l,progress:o,mapId:s,affectingCharacters:a,progressPerHour:c}=t,d=Math.floor(20*(l-1)+6*l*Math.pow(1.63,l-1));return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(r.Z,{fontWeight:"bold",variant:"h5",children:[(0,v.cleanUnderscore)(e)," Lv.",l]}),(0,i.jsx)(r.Z,{variant:"body1",children:n}),(0,i.jsxs)(r.Z,{fontWeight:"bold",variant:"body1",children:["Map: ",(0,v.cleanUnderscore)(h.mapNames[s])]}),(0,i.jsx)(r.Z,{fontWeight:"bold",children:"Progress:"}),(0,i.jsx)(x.Z,{percent:o/d*100,label:!1}),(0,i.jsxs)(r.Z,{variant:"body1",children:[(0,v.numberWithCommas)(parseInt(o))," / ",(0,v.numberWithCommas)(parseInt(d))]}),(0,i.jsx)(r.Z,{sx:{fontWeight:"bold"},mt:1,children:"Affected by:"}),(0,i.jsx)(r.Z,{variant:"body1",children:null==a?void 0:a.join(", ")}),(0,i.jsxs)(r.Z,{sx:{fontWeight:"bold"},mt:1,children:[c.toFixed(2),"/hr"]}),(0,i.jsx)(j.Z,{date:new Date().getTime()+(d-o)/c*36e5,staticTime:!0})]})};var Z=t=>{let{shrines:e,shrinesExpBonus:n}=t;return(0,i.jsx)(l.Z,{sx:{height:"fit-content"},justifyContent:"center",direction:"row",flexWrap:"wrap",gap:2,children:null==e?void 0:e.map((t,e)=>{var l,o,s;let{name:r,rawName:d,shrineLevel:u,desc:x,bonus:h}=t,j=null==n?void 0:null===(o=n.breakdown)||void 0===o?void 0:null===(l=o[e])||void 0===l?void 0:l.reduce((t,e)=>{let{name:n,value:i}=e;return i>0?[...t,n]:t},[]),Z=null==n?void 0:null===(s=n.total)||void 0===s?void 0:s[e],p=(0,v.cleanUnderscore)(null==x?void 0:x.replace("{",(0,v.kFormatter)(h,2)));return(0,i.jsx)(c.Z,{title:(0,i.jsx)(m,{...t,affectingCharacters:j,progressPerHour:Z,description:p}),children:(0,i.jsx)(a.M5,{stat:u,icon:d,img:{style:{width:50,height:50}}})},r+e)})})},p=n(98216),g=n(87357),f=n(84664);let b=t=>{let{effect:e,bonus:n,talentMulti:o,name:s,rawName:c,level:d,progress:u,statues:h,characters:j}=t,m=d*n*o,Z=Math.round(Math.pow(d,1.17)*Math.pow(1.35,d/10)+1),g=(0,v.cleanUnderscore)((0,v.pascalCase)(null==e?void 0:e.replace(/(%?)(@)/,"$2$1_").replace("@",Math.floor(10*m)/10)));return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(r.Z,{fontWeight:"bold",variant:"h5",children:(0,p.Z)((0,v.cleanUnderscore)(s.toLowerCase()))}),(0,i.jsx)(r.Z,{variant:"body1",children:g}),(0,i.jsx)(x.Z,{percent:u/Z*100,label:!1}),(0,i.jsxs)(r.Z,{variant:"body2",children:[(0,v.notateNumber)(u,"Big")," / ",(0,v.notateNumber)(Z,"Big")]}),(0,i.jsxs)(r.Z,{my:2,component:"div",variant:"caption",children:["Voodo Statufication: ",(0,v.notateNumber)(o,"MultiplierInfo"),"x"]}),(0,i.jsx)(l.Z,{children:null==j?void 0:j.map(t=>{let{name:e,talents:n}=t,l=(0,f.U6)(h,c,n);return(0,i.jsx)(a.uQ,{title:e,value:Math.floor(10*l)/10},e)})})]})};var w=t=>{let{statues:e,characters:n}=t;return(0,i.jsx)(l.Z,{sx:{height:"fit-content"},flexWrap:"wrap",direction:"row",justifyContent:"center",gap:2,children:null==e?void 0:e.map((t,l)=>{let{name:o,rawName:s,level:r}=t;return(0,i.jsx)(g.Z,{children:(0,i.jsx)(c.Z,{title:(0,i.jsx)(b,{...t,statues:e,characters:n}),children:(0,i.jsx)(a.M5,{stat:r,icon:s,img:{style:{width:40,height:50,objectFit:"contain"}}})})},o+l)})})},y=n(7906),M=n(295),k=n(53252),T=n(72882),C=n(53184),N=n(53816),P=n(67294);let S=t=>{let{title:e,rows:n}=t;return(0,i.jsx)(T.Z,{children:(0,i.jsxs)(y.Z,{"aria-label":"simple table",children:[(0,i.jsx)(C.Z,{children:(0,i.jsxs)(N.Z,{children:[(0,i.jsx)(k.Z,{children:e}),(0,i.jsx)(k.Z,{children:"Score"})]})}),(0,i.jsx)(M.Z,{children:n.sort((t,e)=>e.score-t.score).map(t=>(0,i.jsxs)(N.Z,{sx:{"&:last-child td, &:last-child th":{border:0}},children:[(0,i.jsx)(k.Z,{sx:{p:1},component:"th",scope:"row",children:t.name}),(0,i.jsx)(k.Z,{sx:{p:1},component:"th",scope:"row",children:(0,v.numberWithCommas)(parseInt(t.score))})]},t.name))})]})})};var W=t=>{let{title:e,highscore:n}=t;return(0,i.jsx)(l.Z,{gap:1.5,justifyContent:"center",children:(0,i.jsx)(S,{title:e,rows:n})})},_=n(42915);let D=t=>{let{text:e,icon:n,stat:o}=t;return(0,i.jsxs)(l.Z,{direction:"row",alignItems:"center",gap:1.5,children:[(0,i.jsx)("img",{style:{width:35,height:35},src:"".concat(v.prefix,"data/").concat(n,".png"),alt:""}),(0,i.jsxs)(r.Z,{variant:"body1",component:"span",children:[e," :"]}),(0,i.jsx)(c.Z,{title:o,children:(0,i.jsx)(r.Z,{variant:"body1",component:"span",children:(0,v.notateNumber)(o)})})]})};var I=t=>{var e,n,o,s,a,c,d,u,v,x,h,j,m,Z,p,g,f,b,w,y,M;let{account:k}=t,T=t=>{var e;return t?null===(e=Object.values(t))||void 0===e?void 0:e.reduce((t,e)=>t+(null==e?void 0:e.reduce((t,e)=>{let{level:n}=e;return t+n},0)),0):0},C=t=>{var e;return t?null===(e=Object.values(t))||void 0===e?void 0:e.reduce((t,e)=>{let{level:n}=e;return t+n},0):0},N=t=>{var e;return t?null===(e=Object.values(t))||void 0===e?void 0:e.reduce((t,e)=>{let{shrineLevel:n}=e;return t+n},0):0},S=(0,P.useMemo)(()=>{var t;return T(null==k?void 0:null===(t=k.alchemy)||void 0===t?void 0:t.bubbles)},[k]),W=(0,P.useMemo)(()=>(0,_.bL)(null==k?void 0:k.stamps),[k]),I=(0,P.useMemo)(()=>C(null==k?void 0:k.statues),[k]),O=(0,P.useMemo)(()=>N(null==k?void 0:k.shrines),[k]);return(0,i.jsxs)(l.Z,{gap:1,children:[(0,i.jsx)(r.Z,{variant:"h5",children:"Totals"}),(0,i.jsx)(D,{text:"Total Bubbles",icon:"aBrewOptionA0",stat:S}),(0,i.jsx)(D,{text:"Total Stamps",icon:"StampA34",stat:W}),(0,i.jsx)(D,{text:"Total Statues",icon:"EquipmentStatues1",stat:I}),(0,i.jsx)(D,{text:"Total Shrines",icon:"UISkillIcon639",stat:O}),(0,i.jsx)(D,{text:"Highest Damage",icon:"StampA8",stat:null==k?void 0:null===(o=k.tasks)||void 0===o?void 0:null===(n=o[0])||void 0===n?void 0:null===(e=n[1])||void 0===e?void 0:e[0]}),(0,i.jsx)(D,{text:"PO Orders",icon:"DeliveryBox",stat:null==k?void 0:null===(c=k.tasks)||void 0===c?void 0:null===(a=c[0])||void 0===a?void 0:null===(s=a[1])||void 0===s?void 0:s[5]}),(0,i.jsx)(D,{text:"Monsters Killed",icon:"UISkillIcon110",stat:null==k?void 0:null===(v=k.tasks)||void 0===v?void 0:null===(u=v[0])||void 0===u?void 0:null===(d=u[0])||void 0===d?void 0:d[0]}),(0,i.jsx)(D,{text:"Refined Salts",icon:"TaskSc6",stat:null==k?void 0:null===(j=k.tasks)||void 0===j?void 0:null===(h=j[0])||void 0===h?void 0:null===(x=h[2])||void 0===x?void 0:x[0]}),(0,i.jsx)(D,{text:"Total Mats Printed",icon:"PrintSlot",stat:null==k?void 0:null===(p=k.tasks)||void 0===p?void 0:null===(Z=p[0])||void 0===Z?void 0:null===(m=Z[2])||void 0===m?void 0:m[3]}),(0,i.jsx)(D,{text:"Trashed Cogs",icon:"Cog3B4",stat:null==k?void 0:null===(b=k.tasks)||void 0===b?void 0:null===(f=b[0])||void 0===f?void 0:null===(g=f[2])||void 0===g?void 0:g[1]}),(0,i.jsx)(D,{text:"Plants Picked",icon:"GamingPlant1",stat:null==k?void 0:null===(M=k.tasks)||void 0===M?void 0:null===(y=M[0])||void 0===y?void 0:null===(w=y[4])||void 0===w?void 0:w[3]})]})},O=n(80782),B=n(2962),E=()=>{var t,e,n,s,r,a,c,d,v;let{state:x}=(0,P.useContext)(O.I);return(0,i.jsxs)(g.Z,{sx:{width:"100%"},children:[(0,i.jsx)(B.PB,{title:"General | Idleon Toolbox",description:"General account information"}),(0,i.jsxs)(l.Z,{sx:{"& > div":{maxWidth:300}},gap:2,justifyContent:"center",direction:"row",flexWrap:"wrap",children:[(0,i.jsx)(o.Z,{obols:null==x?void 0:null===(t=x.account)||void 0===t?void 0:t.obols,type:"account"}),(0,i.jsx)(u,{...(null==x?void 0:null===(e=x.account)||void 0===e?void 0:e.currencies)||{}}),(0,i.jsx)(Z,{shrines:null==x?void 0:null===(n=x.account)||void 0===n?void 0:n.shrines,shrinesExpBonus:null==x?void 0:null===(s=x.account)||void 0===s?void 0:s.shrinesExpBonus}),(0,i.jsx)(w,{statues:null==x?void 0:null===(r=x.account)||void 0===r?void 0:r.statues,characters:null==x?void 0:x.characters}),(0,i.jsxs)(l.Z,{gap:1.5,children:[(0,i.jsx)(W,{title:"Colosseum",highscore:null==x?void 0:null===(c=x.account)||void 0===c?void 0:null===(a=c.highscores)||void 0===a?void 0:a.coloHighscores}),(0,i.jsx)(W,{title:"Minigame",highscore:null==x?void 0:null===(v=x.account)||void 0===v?void 0:null===(d=v.highscores)||void 0===d?void 0:d.minigameHighscores})]}),(0,i.jsx)(I,{account:null==x?void 0:x.account})]})]})}}},function(t){t.O(0,[5127,2307,5039,6426,4401,9774,2888,179],function(){return t(t.s=17598)}),_N_E=t.O()}]);