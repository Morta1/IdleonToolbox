(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7851],{82169:function(e,n,l){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/world-4/cooking",function(){return l(81131)}])},86554:function(e,n,l){"use strict";var t=l(85893),i=l(87357),r=l(81458),s=l(15861);l(67294),n.Z=e=>{let{percent:n,bgColor:l,label:o=!0,sx:a,boxSx:c={},pre:d}=e;return(0,t.jsxs)(i.Z,{sx:{display:"flex",alignItems:"center",...c},children:[d,(0,t.jsx)(i.Z,{sx:{width:"100%",mr:1},children:(0,t.jsx)(r.Z,{sx:{width:"100%",height:10,borderRadius:5,"& .MuiLinearProgress-bar":{backgroundColor:l||""},...a},variant:"determinate",value:n>100?100:n})}),o?(0,t.jsx)(i.Z,{children:(0,t.jsx)(s.Z,{variant:"body2",color:"text.secondary",children:"".concat(Math.round(n),"%")})}):null]})}},33948:function(e,n,l){"use strict";var t=l(85893),i=l(67294),r=l(96986),s=l(33913),o=l(39574),a=l(15861);n.Z=e=>{let{date:n,startDate:l,lastUpdated:c,stopAtZero:d,type:u,pause:x,staticTime:h,placeholder:m,loop:v,variant:j="inherit"}=e,[p,g]=(0,i.useState)();(0,i.useEffect)(()=>{if(n){if(h){if(!isFinite(n))return;return g({...(0,o.getDuration)(new Date().getTime(),n)})}let e=new Date,l=e.getTime()-(null!=c?c:0),t=(0,s.Z)(n);g({...(0,o.getDuration)(null==e?void 0:e.getTime(),n+l*("countdown"===u?-1:1)),overtime:"countdown"===u&&t})}},[n,c]);let Z=()=>{let{days:e,hours:n,minutes:l,seconds:t}=p;60===(t+=1)&&(t=0,60===(l+=1)&&(l=0,24===(n+=1)&&(e+=1))),g({...p,days:e,hours:n,minutes:l,seconds:t})},f=()=>{let{days:e,hours:n,minutes:t,seconds:i}=p;if(0===e&&0===n&&0===t&&0===i){if(d)return;if(v)return g({...(0,o.getDuration)(new Date().getTime(),l)})}-1==(i-=1)&&(i=59,-1==(t-=1)&&(t=59,-1==(n-=1)&&(n=0,e-=1))),g({...p,days:e,hours:n,minutes:t,seconds:i})};(0,r.Z)(()=>{if(!p)return null;"countdown"!==u||(null==p?void 0:p.overtime)?Z():f()},x||h?null:1e3);let w=e=>{let n=String(e);return(null==n?void 0:n.length)===1?"0".concat(e):e};return p?((null==p?void 0:p.overtime)||x)&&m?m:(0,t.jsxs)(a.Z,{variant:j,sx:{color:"".concat((null==p?void 0:p.overtime)&&!v?"#f91d1d":"")},component:"span",children:[(null==p?void 0:p.days)?w(null==p?void 0:p.days)+"d:":"",w(null==p?void 0:p.hours)+"h:",w(null==p?void 0:p.minutes)+"m",(null==p?void 0:p.days)?"":":",(null==p?void 0:p.days)?"":w(null==p?void 0:p.seconds)+"s"]}):null}},81131:function(e,n,l){"use strict";l.r(n),l.d(n,{default:function(){return q}});var t=l(85893),i=l(98396),r=l(15861),s=l(11703),o=l(40044),a=l(67294),c=l(41422),d=l(82729),u=l(66242),x=l(44267),h=l(51233),m=l(67720),v=l(39574),j=l(51053),p=l(33948),g=l(21994),Z=l(61599),f=l(86554),w=l(9798);function b(){let e=(0,d._)(["\n  object-fit: contain;\n  width: 32px;\n"]);return b=function(){return e},e}function y(){let e=(0,d._)(["\n  object-fit: contain;\n  margin-top: -20px;\n  filter: ();\n  opacity: ","\n"]);return y=function(){return e},e}let N=e=>{var n;let{meal:l,lab:i,totalMealSpeed:s,achievements:o}=e,a=(0,g.Qo)(11,l,s,o),c=(0,g.sV)(null==l?void 0:l.level,o),d=(11-(null==l?void 0:l.level))*c,u=(null==l?void 0:l.amount)>=c?"0":(0,g.Kn)(c-(null==l?void 0:l.amount),null==l?void 0:l.cookReq,s),x=(0,w.c9)(i.labBonuses,8),h=(0,w.pc)(null==i?void 0:i.jewels,16,x),m=(1+(h+(null==l?void 0:l.shinyMulti))/100)*(null==l?void 0:l.level)*(null==l?void 0:l.baseStat);return(0,t.jsxs)(t.Fragment,{children:[(null==l?void 0:l.level)>=11||c===d?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(r.Z,{children:["Next Level in: ",(0,t.jsx)(p.Z,{date:new Date().getTime()+36e5*u,staticTime:!0})]}),(0,t.jsxs)(r.Z,{children:["(",(0,v.notateNumber)(null==l?void 0:l.amount,"Big")," / ",(0,v.notateNumber)(c,"Big"),")"]})]}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(r.Z,{children:["Next Level in: ",(0,t.jsx)(p.Z,{date:new Date().getTime()+36e5*u,staticTime:!0})]}),(0,t.jsxs)(r.Z,{children:["Diamond plate in: ",(0,t.jsx)(p.Z,{date:new Date().getTime()+36e5*a,staticTime:!0})," "]}),(0,t.jsxs)(r.Z,{children:["(",(0,v.notateNumber)(null==l?void 0:l.amount,"Big")," / ",(0,v.notateNumber)(d,"Big"),")"]})]}),(0,t.jsx)(r.Z,{fontSize:15,fontWeight:"bold",children:(0,v.cleanUnderscore)(null==l?void 0:null===(n=l.effect)||void 0===n?void 0:n.replace("{",(0,v.kFormatter)(m)))})]})},k=Z.Z.img(b()),C=Z.Z.img(y(),e=>{let{missing:n}=e;return n?.5:1});var S=e=>{var n,l;let{spices:i,kitchens:s,meals:o,totalMealSpeed:c,lastUpdated:d,achievements:Z,lab:w}=e,b=e=>null==e?void 0:e.reduce((e,n)=>{var l,t,i;let r=(null==n?void 0:n.status)===2;if(!r)return e;let{meal:s}=n;return{...e,[null==s?void 0:s.rawName]:{total:(null!==(i=null===(l=e[null==s?void 0:s.rawName])||void 0===l?void 0:l.total)&&void 0!==i?i:0)+(null==n?void 0:n.mealSpeed)/(null==n?void 0:null===(t=n.meal)||void 0===t?void 0:t.cookReq),...s}}},{}),y=(0,a.useMemo)(()=>b(s),[s]),S=e=>{if(!e)return 0;let n=e[e.length-1];return(null==n?void 0:n.index)<(null==o?void 0:o.length)?2*(null==n?void 0:n.cookReq):1e10},F=(e,n)=>Math.floor(2*e+n);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(u.Z,{sx:{width:"fit-content"},children:(0,t.jsx)(x.Z,{children:(0,t.jsxs)(r.Z,{children:["Claims: ",null==i?void 0:i.numberOfClaims," / ",g.Cz]})})}),(0,t.jsx)(h.Z,{my:2,direction:"row",gap:2,flexWrap:"wrap",children:null==i?void 0:null===(n=i.available)||void 0===n?void 0:n.map((e,n)=>{var l;return e?(0,t.jsx)(u.Z,{elevation:4,children:(0,t.jsxs)(x.Z,{sx:{display:"flex",flexDirection:"column",alignItems:"center"},children:[(0,t.jsx)(k,{src:"".concat(v.prefix,"data/").concat(null==e?void 0:e.rawName,".png"),alt:""}),(0,t.jsx)(j.Z,{title:parseInt(null==e?void 0:e.amount),children:(0,t.jsx)(r.Z,{children:(0,v.notateNumber)(parseInt(null==e?void 0:e.amount),"Big")})}),(0,t.jsxs)(r.Z,{sx:{color:"grey.400"},children:["(",(0,v.notateNumber)(parseInt(null!==(l=null==e?void 0:e.toClaim)&&void 0!==l?l:0),"Big"),")"]})]})},"".concat(null==e?void 0:e.spiceName,"-").concat(n)):null})}),(0,t.jsx)(r.Z,{variant:"h4",textAlign:"center",mb:3,children:"Totals"}),(0,t.jsxs)(h.Z,{sx:{height:160},my:2,direction:"row",alignItems:"center",justifyContent:"center",gap:2,children:[null===(l=Object.entries(y||{}))||void 0===l?void 0:l.map((e,n)=>{let[l,i]=e,{total:r}=i;return(0,t.jsx)(u.Z,{children:(0,t.jsxs)(x.Z,{sx:{display:"flex",flexDirection:"column",alignItems:"center"},children:[(0,t.jsx)(j.Z,{placement:"top",title:(0,t.jsx)(N,{achievements:Z,totalMealSpeed:c,meal:i,lab:w}),children:(0,t.jsx)(C,{src:"".concat(v.prefix,"data/").concat(l,".png"),alt:""})}),(0,t.jsxs)("div",{children:[(0,v.kFormatter)(r,2),"/hr"]}),(0,t.jsx)(N,{achievements:Z,totalMealSpeed:c,meal:i,lab:w})]})},"".concat(l,"-").concat(n,"-").concat(r))}),(0,t.jsx)(u.Z,{children:(0,t.jsx)(x.Z,{sx:{height:"100%"},children:(0,t.jsxs)(h.Z,{alignItems:"center",gap:2,justifyContent:"center",children:[(0,t.jsx)("img",{src:"".concat(v.prefix,"etc/Kitchen.png"),alt:""}),(0,t.jsx)(r.Z,{children:"Total Speed"}),(0,t.jsxs)(r.Z,{children:[(0,v.notateNumber)(c),"/hr"]})]})})})]}),(0,t.jsx)(h.Z,{direction:"row",justifyContent:"center",gap:3,flexWrap:"wrap",children:null==s?void 0:s.map((e,n)=>{var l,i,s,a,g,b,y,I;if(!e)return null;let B=(null==e?void 0:e.status)>=3,M=S(null==e?void 0:e.possibleMeals),T=Math.round((null==e?void 0:e.currentProgress)/M*100),L=(M-(null==e?void 0:e.currentProgress))/e.fireSpeed;return(0,t.jsx)(u.Z,{sx:{width:{xs:350,sm:400}},children:(0,t.jsxs)(x.Z,{sx:{padding:4},children:[(0,t.jsxs)(h.Z,{direction:"row",justifyContent:"center",children:[(0,t.jsxs)(h.Z,{children:[(0,t.jsxs)(r.Z,{sx:{color:"success.light"},children:["Speed (",null==e?void 0:e.speedLv,")"]}),(0,t.jsxs)(r.Z,{children:[null!==(b=(0,v.notateNumber)(null==e?void 0:e.mealSpeed,"Big"))&&void 0!==b?b:0,"/hr"]}),(0,t.jsxs)(h.Z,{mt:2,alignItems:"center",children:[(0,t.jsx)(k,{src:"".concat(v.prefix,"data/CookingSpice").concat(F(n,0),".png"),alt:""}),(0,t.jsx)(r.Z,{children:(0,v.notateNumber)(null==e?void 0:e.speedCost,"Big")})]})]}),(0,t.jsx)(m.Z,{sx:{mx:2,backgroundColor:"white"},orientation:"vertical",flexItem:!0}),(0,t.jsxs)(h.Z,{children:[(0,t.jsxs)(r.Z,{sx:{color:"error.light"},children:["Fire (",null==e?void 0:e.fireLv,")"]}),(0,t.jsxs)(r.Z,{children:[null!==(y=(0,v.notateNumber)(null==e?void 0:e.fireSpeed,"Big"))&&void 0!==y?y:0,"/hr"]}),(0,t.jsxs)(h.Z,{mt:2,alignItems:"center",children:[(0,t.jsx)(k,{src:"".concat(v.prefix,"data/CookingSpice").concat(F(n,1),".png"),alt:""}),(0,t.jsx)(r.Z,{children:(0,v.notateNumber)(null==e?void 0:e.fireCost,"Big")})]})]}),(0,t.jsx)(m.Z,{sx:{mx:2,backgroundColor:"white"},orientation:"vertical",flexItem:!0}),(0,t.jsxs)(h.Z,{children:[(0,t.jsxs)(r.Z,{sx:{color:"info.light"},children:["Luck (",null==e?void 0:e.luckLv,")"]}),(0,t.jsxs)(r.Z,{children:[null!==(I=null==e?void 0:e.mealLuck.toFixed(2))&&void 0!==I?I:0,"x"]}),(0,t.jsxs)(h.Z,{mt:2,alignItems:"center",children:[(0,t.jsx)(k,{src:"".concat(v.prefix,"data/CookingSpice").concat(F(n,2),".png"),alt:""}),(0,t.jsx)(r.Z,{children:(0,v.notateNumber)(null==e?void 0:e.luckCost,"Big")})]})]})]}),B?(0,t.jsxs)(h.Z,{children:[(0,t.jsxs)(h.Z,{mt:4,mb:1,direction:"row",justifyContent:"center",alignItems:"center",gap:2,children:[(0,t.jsx)(r.Z,{variant:"body1",children:"Spices: "}),null==e?void 0:null===(l=e.spices)||void 0===l?void 0:l.map((e,n)=>-1===e?null:(0,t.jsx)(k,{src:"".concat(v.prefix,"data/CookingSpice").concat(e,".png"),alt:""},"".concat(e,"-").concat(n)))]}),(null==e?void 0:null===(i=e.possibleMeals)||void 0===i?void 0:i.length)>0?(0,t.jsx)(h.Z,{direction:"row",justifyContent:"center",flexWrap:"wrap",alignItems:"center",rowGap:1.5,children:null==e?void 0:null===(s=e.possibleMeals)||void 0===s?void 0:s.map((e,n)=>{var l;return(0,t.jsx)(C,{missing:(null==o?void 0:null===(l=o[null==e?void 0:e.index])||void 0===l?void 0:l.level)===0,src:"".concat(v.prefix,"data/").concat(null==e?void 0:e.rawName,".png"),alt:""},"possible-".concat(null==e?void 0:e.rawName,"-").concat(n))})}):null,(0,t.jsx)(j.Z,{title:"".concat(T,"%"),children:(0,t.jsx)(f.Z,{percent:T})}),(0,t.jsxs)(h.Z,{direction:"row",gap:3,mt:1,children:[(0,t.jsxs)(r.Z,{variant:"body1",component:"span",children:[(0,v.kFormatter)(null==e?void 0:e.currentProgress,2)," / ",(0,v.kFormatter)(M)]}),(0,t.jsx)(p.Z,{placeholder:(0,t.jsx)(r.Z,{sx:{color:"success.light"},children:"Ready"}),type:"countdown",date:new Date().getTime()+36e5*L,lastUpdated:d})]})]}):(0,t.jsxs)(h.Z,{mt:2,justifyContent:"center",alignItems:"center",children:[(0,t.jsx)(j.Z,{placement:"top",title:(0,t.jsx)(N,{achievements:Z,totalMealSpeed:c,lab:w,meal:null==e?void 0:e.meal}),children:(0,t.jsx)(C,{src:"".concat(v.prefix,"data/").concat(null==e?void 0:null===(a=e.meal)||void 0===a?void 0:a.rawName,".png"),alt:""})}),(0,t.jsxs)("div",{children:[(0,v.kFormatter)((null==e?void 0:e.mealSpeed)/(null==e?void 0:null===(g=e.meal)||void 0===g?void 0:g.cookReq),2),"/hr"]})]})]})},"kitchen-".concat(n))})})]})},F=l(33454),I=l(96420),B=l(61903),M=l(87357),T=l(74721),L=l(93619),D=l(18972),W=l(64529);function _(){let e=(0,d._)(["\n  width: 82px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  margin-right: -20px;\n\n  & img:nth-of-type(1) {\n    margin-top: -30px;\n  }\n\n  & img {\n    margin-left: -30px;\n  }\n"]);return _=function(){return e},e}function E(){let e=(0,d._)(["\n  & {\n    display: flex;\n    align-items: center;\n  }\n"]);return E=function(){return e},e}let P=[-1,0,11,30],R=e=>Math.ceil(36e5*e/864e5),A=e=>{let{level:n,baseStat:l,multiplier:i,effect:s,achievements:o}=e,a=(0,g.sV)(n+1,o);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(r.Z,{fontWeight:"bold",children:["Next level bonus:\xa0",(0,t.jsx)(r.Z,{component:"span",sx:{fontWeight:400},children:(0,v.cleanUnderscore)(null==s?void 0:s.replace("{",(0,v.kFormatter)((n+1)*l*i)))})]}),(0,t.jsx)(M.Z,{children:(0,t.jsxs)(r.Z,{fontWeight:"bold",children:["Next level req:\xa0",(0,t.jsx)(r.Z,{component:"span",sx:{fontWeight:400},children:(0,v.numberWithCommas)(parseInt(a))})]})})]})},O=Z.Z.div(_()),U=(0,Z.Z)(r.Z)(E());var z=e=>{var n,l;let{characters:i,meals:s,totalMealSpeed:o,achievements:c,artifacts:d,lab:m}=e,[Z,f]=a.useState(()=>[]),[b,y]=(0,a.useState)(),[N,k]=(0,a.useState)([]),[C,S]=(0,a.useState)(30),[M,_]=(0,a.useState)(o),[E,z]=(0,a.useState)(P[0]),K=(0,w.c9)(m.labBonuses,8),q=(0,w.pc)(null==m?void 0:m.jewels,16,K),V=(null===(n=null===(l=m.jewels)||void 0===l?void 0:l.slice(0,3))||void 0===n?void 0:n.every(e=>{let{active:n}=e;return n}))?2:1,X=(0,w.pc)(m.jewels,0,K)*V,Q=()=>{let e=null==i?void 0:i.filter(e=>(null==e?void 0:e.class)==="Blood_Berserker");return e.reduce((e,n)=>{var l;let{talents:t}=n,i=null==t?void 0:null===(l=t[3])||void 0===l?void 0:l.orderedTalents.find(e=>(null==e?void 0:e.name)==="OVERFLOWING_LADLE"),r=(null==i?void 0:i.level)>(null==i?void 0:i.maxLevel)?null==i?void 0:i.level:null==i?void 0:i.maxLevel,s=(0,v.growth)(null==i?void 0:i.funcX,r,null==i?void 0:i.x1,null==i?void 0:i.x2,!1);return s>e?s:e},0)},G=(0,a.useMemo)(()=>Q(),[i]),H=(e,n)=>null==e?void 0:e.map(e=>{if(!e)return null;let{amount:l,level:t,cookReq:i}=e,r=(0,g.sV)(t,c),s=(11-t)*r,o=(30-t)*r,a=l>=r?"0":(0,g.Kn)(r-l,i,M),d=(0,g.Qo)(11,e,M,c),u=(0,g.Qo)(30,e,M,c);return n&&(a/=1+G/100,d/=1+G/100,u/=1+G/100),{...e,levelCost:r,diamondCost:s,timeTillNextLevel:a,timeToDiamond:d,timeToBlackVoid:u,blackVoidCost:o}}),Y=(0,a.useMemo)(()=>H(s),[s,M]);(0,a.useEffect)(()=>{let e=(0,W.YS)(d,"Causticolumn");e&&S(30+(null==e?void 0:e.bonus))},[d]),(0,a.useEffect)(()=>{let e;if(0===E){let n=[...Y];e=J(n,"timeTillNextLevel")}else if(11===E){let n=[...Y];e=J(n,"timeToDiamond",11)}else if(30===E){let n=[...Y];e=J(n,"timeToBlackVoid",30)}else e=Y;Z.includes("overflow")&&(e=H(e||s,G)),Z.includes("hide")&&(e=e.filter(e=>(null==e?void 0:e.level)<C)),Z.includes("amethystRhinestone")&&0===X?_(4.5*o):_(o);let n=$(e);k(n),y(e)},[Z,s,C,E,M]);let J=function(e,n){let l=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0,t=[...Y];return t.sort((e,t)=>{if(0!==l){if(e.level>=l)return 1;if(t.level>=l)return -1}return(null==e?void 0:e[n])-(null==t?void 0:t[n])}),t},$=e=>{let n=e.filter(e=>((null==e?void 0:e.stat)==="Mcook"||(null==e?void 0:e.stat)==="KitchenEff")&&(null==e?void 0:e.level)<C);return(n=n.map(e=>{let{level:n,baseStat:l,shinyMulti:t,timeTillNextLevel:i}=e,r=(1+(q+t)/100)*n*l,s=(1+(q+t)/100)*(n+1)*l;return{...e,currentLevelBonus:(0,v.notateNumber)(r),nextLevelBonus:(0,v.notateNumber)(s),bonusDiff:s-r,diff:(s-r)/i}})).sort((e,n)=>n.diff-e.diff),n};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(F.Z,{sx:{my:2},value:Z,onChange:(e,n)=>{f(n)},children:[(0,t.jsx)(I.Z,{value:"minimized",children:"Minimized"}),(0,t.jsx)(I.Z,{value:"hide",children:"Hide capped"}),(0,t.jsx)(I.Z,{value:"overflow",children:(0,t.jsxs)(h.Z,{direction:"row",gap:1,children:[(0,t.jsx)(r.Z,{children:"Overflowing Ladle"}),(0,t.jsx)(j.Z,{title:"Blood Berserker Talent: Ladles gives ".concat((0,v.kFormatter)(G,2),"% more afk time"),children:(0,t.jsx)(T.Z,{})})]})}),(0,t.jsx)(I.Z,{value:"amethystRhinestone",children:(0,t.jsxs)(h.Z,{direction:"row",gap:1,children:[(0,t.jsx)(r.Z,{children:"Amethyst Rhinestone"}),(0,t.jsx)(j.Z,{title:"Apply additional 4.5 multi bonus",children:(0,t.jsx)(T.Z,{})})]})})]}),(0,t.jsxs)(h.Z,{direction:"row",alignItems:"center",gap:3,children:[(0,t.jsx)(B.Z,{sx:{width:150},label:"Sort by",select:!0,value:E,onChange:e=>{z(e.target.value)},children:null==P?void 0:P.map(e=>(0,t.jsx)(D.Z,{value:e,children:-1===e?"Order":0===e?"Time":"Time to ".concat(e)},e))}),11!==E||(null==b?void 0:b.some(e=>{let{level:n,amount:l}=e;return l>0&&n<11}))?null:(0,t.jsx)(r.Z,{sx:{color:"#ffa726"},children:"All meals are higher than level 11 !"}),30!==E||(null==b?void 0:b.some(e=>{let{level:n,amount:l}=e;return l>0&&n<30}))?null:(0,t.jsx)(r.Z,{sx:{color:"#ffa726"},children:"All meals are higher than level 30 !"})]}),(0,t.jsxs)(h.Z,{my:2,children:[(0,t.jsx)(r.Z,{my:1,variant:"h5",children:"Best meal speed contribution"}),(0,t.jsx)(h.Z,{gap:2,direction:"row",flexWrap:"wrap",children:N.map((e,n)=>{let{currentLevelBonus:l,nextLevelBonus:i,level:s,name:o,rawName:a,bonusDiff:c,timeTillNextLevel:d}=e;return(0,t.jsx)(u.Z,{sx:{width:340},children:(0,t.jsx)(x.Z,{children:(0,t.jsxs)(h.Z,{direction:"row",alignItems:"center",children:[(0,t.jsxs)(O,{children:[(0,t.jsx)("img",{src:"".concat(v.prefix,"data/").concat(a,".png"),alt:""}),s>0?(0,t.jsx)("img",{className:"plate",src:"".concat(v.prefix,"data/CookingPlate").concat(s-1,".png"),alt:""}):null]}),(0,t.jsxs)(h.Z,{gap:1,children:[(0,t.jsxs)(U,{children:[(0,v.cleanUnderscore)(o)," (Lv. ",s," ",(0,t.jsx)(L.Z,{fontSize:"small"})," ",s+1,")"]}),(0,t.jsxs)(U,{children:[l,"% ",(0,t.jsx)(L.Z,{fontSize:"small"})," ",i,"% (",(0,v.kFormatter)(c),")"]}),(0,t.jsxs)(r.Z,{component:"span",children:["Next level: ",36e5*d<9007199254740992?(0,t.jsx)(p.Z,{date:new Date().getTime()+36e5*d,staticTime:!0}):"".concat(R(d)," days")]}),(0,t.jsxs)(h.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,t.jsx)("img",{src:"".concat(v.prefix,"data/Ladle.png"),alt:"",width:32,height:32}),(0,t.jsx)(j.Z,{title:(0,v.numberWithCommas)(parseFloat(d).toFixed(2)),children:(0,t.jsx)("span",{children:(0,v.notateNumber)(Math.ceil(d),"Big")})})]})]})]})})},"".concat(o,"-").concat(n))})})]}),(0,t.jsx)(r.Z,{my:1,variant:"h5",children:"Meals"}),(0,t.jsx)(h.Z,{direction:"row",flexWrap:"wrap",gap:2,children:null==b?void 0:b.map((e,n)=>{if(!e)return null;let{name:l,amount:i,rawName:s,effect:o,level:a,baseStat:d,multiplier:m,shinyMulti:g,levelCost:f,timeTillNextLevel:w,timeToDiamond:b,timeToBlackVoid:y}=e,N=(1+(q+g)/100)*a*d;return(0,t.jsx)(u.Z,{sx:{width:300,opacity:0===a?.5:1},children:(0,t.jsxs)(x.Z,{children:[(0,t.jsxs)(h.Z,{direction:"row",alignItems:"center",children:[(0,t.jsx)(j.Z,{title:(0,t.jsx)(A,{achievements:c,...e}),children:(0,t.jsxs)(O,{children:[(0,t.jsx)("img",{src:"".concat(v.prefix,"data/").concat(s,".png"),alt:""}),a>0?(0,t.jsx)("img",{className:"plate",src:"".concat(v.prefix,"data/CookingPlate").concat(a-1,".png"),alt:""}):null]})}),(0,t.jsxs)(r.Z,{children:[(0,v.cleanUnderscore)(l)," (Lv. ",a,")"]})]}),(0,t.jsxs)(h.Z,{mt:2,gap:1,children:[(0,t.jsx)(r.Z,{sx:{color:m>1?"info.light":""},children:(0,v.cleanUnderscore)(null==o?void 0:o.replace("{",(0,v.kFormatter)(N)))}),Z.includes("minimized")?null:(null==e?void 0:e.level)===C?(0,t.jsx)(r.Z,{color:"success.light",children:"MAXED"}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(r.Z,{sx:{color:i>=f?"success.light":a>0?"error.light":""},children:["Progress: ",(0,t.jsx)(j.Z,{title:(0,v.numberWithCommas)(parseInt(i)),children:(0,t.jsx)("span",{children:(0,v.notateNumber)(Math.floor(i),"Big")})})," / ",(0,t.jsx)(j.Z,{title:(0,v.numberWithCommas)(parseInt(f)),children:(0,t.jsx)("span",{children:(0,v.notateNumber)(Math.ceil(f),"Big")})})]}),a>0?(0,t.jsxs)(t.Fragment,{children:[0===E||-1===E?(0,t.jsxs)(r.Z,{component:"span",children:["Next level: ",36e5*w<9007199254740992?(0,t.jsx)(p.Z,{date:new Date().getTime()+36e5*w,staticTime:!0}):"".concat(R(w)," days")]}):null,11===E&&a<11?(0,t.jsxs)(r.Z,{children:["Next milestone: ",36e5*b<9007199254740992?(0,t.jsx)(p.Z,{date:new Date().getTime()+36e5*b,staticTime:!0}):"".concat(R(b)," days")]}):null,30===E&&a<30&&y>0?(0,t.jsxs)(r.Z,{children:["Next milestone: ",parseInt(R(y))," days"]}):null]}):null]}),(null==e?void 0:e.level)<C?(0,t.jsxs)(t.Fragment,{children:[(-1===E||0===E)&&(0,t.jsxs)(h.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,t.jsx)("img",{src:"".concat(v.prefix,"data/Ladle.png"),alt:"",width:32,height:32}),(0,t.jsx)(j.Z,{title:(0,v.numberWithCommas)(parseFloat(w).toFixed(2)),children:(0,t.jsx)("span",{children:(0,v.notateNumber)(Math.ceil(w),"Big")})})]}),11===E&&a<11&&a>0?(0,t.jsxs)(h.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,t.jsx)("img",{src:"".concat(v.prefix,"data/Ladle.png"),alt:"",width:32,height:32}),(0,t.jsx)(j.Z,{title:(0,v.numberWithCommas)(parseFloat(b).toFixed(2)),children:(0,t.jsx)("span",{children:(0,v.notateNumber)(Math.ceil(b),"Big")})})]}):null,30===E&&a<30&&a>0?(0,t.jsxs)(h.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,t.jsx)("img",{src:"".concat(v.prefix,"data/Ladle.png"),alt:"",width:32,height:32}),(0,t.jsx)(j.Z,{title:(0,v.numberWithCommas)(parseFloat(y).toFixed(2)),children:(0,t.jsx)("span",{children:(0,v.notateNumber)(Math.ceil(y),"Big")})})]}):null]}):null]})]})},"".concat(l,"-").concat(n))})})]})},K=l(2962),q=()=>{var e,n;let{state:l}=(0,a.useContext)(c.I),{cooking:d,achievements:u,sailing:x}=(null==l?void 0:l.account)||{},[h,m]=(0,a.useState)(0),v=(0,i.Z)(e=>e.breakpoints.down("md"),{noSsr:!0}),j=(0,a.useMemo)(()=>{var e;return null==d?void 0:null===(e=d.kitchens)||void 0===e?void 0:e.reduce((e,n)=>e+n.mealSpeed,0)},[d]);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(K.PB,{title:"Idleon Toolbox | Cooking",description:"Keep track of your kitchens and meals progression"}),(0,t.jsx)(r.Z,{variant:"h2",textAlign:"center",mb:3,children:"Cooking"}),(0,t.jsx)(s.Z,{centered:!0,sx:{marginBottom:3},variant:v?"fullWidth":"standard",value:h,onChange:(e,n)=>{m(n)},children:["Kitchens","Meals"].map((e,n)=>(0,t.jsx)(o.Z,{label:e},"".concat(e,"-").concat(n)))}),0===h?(0,t.jsx)(S,{...d,achievements:u,lastUpdated:null==l?void 0:l.lastUpdated,totalMealSpeed:j,lab:null==l?void 0:null===(e=l.account)||void 0===e?void 0:e.lab}):null,1===h?(0,t.jsx)(z,{characters:null==l?void 0:l.characters,...d,lab:null==l?void 0:null===(n=l.account)||void 0===n?void 0:n.lab,achievements:u,totalMealSpeed:j,artifacts:null==x?void 0:x.artifacts}):null]})}}},function(e){e.O(0,[2312,9774,2888,179],function(){return e(e.s=82169)}),_N_E=e.O()}]);