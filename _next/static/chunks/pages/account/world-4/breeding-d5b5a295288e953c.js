(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6057],{52177:function(e,n,l){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/world-4/breeding",function(){return l(7684)}])},33583:function(e,n,l){"use strict";var i=l(85893),t=l(67294),o=l(98396),r=l(11703),a=l(40044);n.Z=e=>{let{tabs:n,children:l,onTabChange:d}=e,[c,s]=(0,t.useState)(0),u=(0,o.Z)(e=>e.breakpoints.down("md"),{noSsr:!0}),v=Array.isArray(l)?l:[l];return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(r.Z,{centered:!u||u&&n.length<4,scrollButtons:!0,allowScrollButtonsMobile:!0,sx:{marginBottom:3},variant:u&&n.length>4?"scrollable":"standard",value:c,onChange:(e,n)=>{s(n),d&&d(n)},children:null==n?void 0:n.map((e,n)=>(0,i.jsx)(a.Z,{label:e},"".concat(e,"-").concat(n)))}),d?l:null==v?void 0:v.map((e,n)=>n===c?e:null)]})}},33948:function(e,n,l){"use strict";var i=l(85893),t=l(67294),o=l(96986),r=l(33913),a=l(39574),d=l(15861);let c=(0,t.forwardRef)((e,n)=>{let{date:l,startDate:c,lastUpdated:s,stopAtZero:u,type:v,pause:x,staticTime:h,placeholder:p,loop:g,variant:m="inherit",...j}=e,[Z,f]=(0,t.useState)();(0,t.useEffect)(()=>{if(l){if(h){if(!isFinite(l))return;return f({...(0,a.getDuration)(new Date().getTime(),l)})}let e=new Date,n=e.getTime()-(null!=s?s:0),i=(0,r.Z)(l);f({...(0,a.getDuration)(null==e?void 0:e.getTime(),l+n*("countdown"===v?-1:1)),overtime:"countdown"===v&&i})}},[l,s]);let w=()=>{let{days:e,hours:n,minutes:l,seconds:i}=Z;60===(i+=1)&&(i=0,60===(l+=1)&&(l=0,24===(n+=1)&&(e+=1))),f({...Z,days:e,hours:n,minutes:l,seconds:i})},b=()=>{let{days:e,hours:n,minutes:l,seconds:i}=Z;if(0===e&&0===n&&0===l&&0===i){if(u)return;if(g)return f({...(0,a.getDuration)(new Date().getTime(),c)})}-1==(i-=1)&&(i=59,-1==(l-=1)&&(l=59,-1==(n-=1)&&(n=0,e-=1))),f({...Z,days:e,hours:n,minutes:l,seconds:i})};(0,o.Z)(()=>{if(!Z)return null;"countdown"!==v||(null==Z?void 0:Z.overtime)?w():b()},x||h?null:1e3);let y=e=>{let n=String(e);return(null==n?void 0:n.length)===1?"0".concat(e):e};return Z?((null==Z?void 0:Z.overtime)||x)&&p?(0,i.jsx)(d.Z,{...j,ref:n,children:p}):(0,i.jsxs)(d.Z,{...j,ref:n,variant:m,sx:{color:"".concat((null==Z?void 0:Z.overtime)&&!g?"#f91d1d":"")},component:"span",children:[(null==Z?void 0:Z.days)?y(null==Z?void 0:Z.days)+"d:":"",y(null==Z?void 0:Z.hours)+"h:",y(null==Z?void 0:Z.minutes)+"m",(null==Z?void 0:Z.days)?"":":",(null==Z?void 0:Z.days)?"":y(null==Z?void 0:Z.seconds)+"s"]}):null});n.Z=c},7684:function(e,n,l){"use strict";l.r(n),l.d(n,{default:function(){return W}});var i=l(85893),t=l(67294),o=l(41422),r=l(15861),a=l(51233),d=l(66242),c=l(44267),s=l(82729),u=l(39574),v=l(61599),x=l(66148),h=l(21994);function p(){let e=(0,s._)(["\n  object-fit: contain;\n  width: 72px;\n"]);return p=function(){return e},e}function g(){let e=(0,s._)(["\n  width: 82px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  margin-right: -20px;\n\n  & img:nth-of-type(1) {\n    margin-top: -30px;\n  }\n\n  & img {\n    margin-left: -30px;\n  }\n"]);return g=function(){return e},e}let m=v.Z.img(p()),j=v.Z.div(g());var Z=e=>{let{account:n,petUpgrades:l,meals:t}=e,o=e=>(null==e?void 0:e.baseCost)*(1+(null==e?void 0:e.level))*Math.pow(null==e?void 0:e.costScale,null==e?void 0:e.level),s=e=>(null==e?void 0:e.baseMatCost)*(1+(null==e?void 0:e.level))*Math.pow(null==e?void 0:e.costMatScale,null==e?void 0:e.level),v=(e,n)=>{let l=0;for(let i=null==e?void 0:e.level;i<(null==e?void 0:e.maxLevel);i++)l+=n?o({...e,level:i}):s({...e,level:i});return null!=l?l:0},p=(e,l)=>{if(9===l){var i;let l=(0,h.eA)(null==n?void 0:null===(i=n.cooking)||void 0===i?void 0:i.kitchens);return Math.pow(Math.max(1,e),l/100)}return 0},g=(e,l)=>0===l||2===l||4===l?null==e?void 0:e.level:1===l?4*(null==e?void 0:e.level):3===l?25*(null==e?void 0:e.level):5===l?(1+.25*(null==e?void 0:e.level))*Math.min(2,Math.max(1,1+.1*(0,x.k)(null==n?void 0:n.achievements,221))):6===l?6*(null==e?void 0:e.level):7===l?1+.15*(null==e?void 0:e.level):8===l?1+2*(null==e?void 0:e.level):9===l?1+.02*(null==e?void 0:e.level):10===l?10*(null==e?void 0:e.level):11===l?Math.ceil(12*Math.pow(null==e?void 0:e.level,.698)):0;return(0,i.jsx)(a.Z,{direction:"row",flexWrap:"wrap",justifyContent:"center",gap:2,children:null==l?void 0:l.map((e,n)=>{var l;if((null==e?void 0:e.name)==="Filler")return null;let x=null==t?void 0:null===(l=t[null==e?void 0:e.foodIndex])||void 0===l?void 0:l.amount,h=o(e),Z=(0,u.notateNumber)(v(e,!0)),f=(0,u.notateNumber)(v(e)),w=g(e,n),b=p(w,n);return(0,i.jsx)(d.Z,{sx:{width:300,opacity:(null==e?void 0:e.level)===0?.5:1},children:(0,i.jsxs)(c.Z,{children:[(0,i.jsxs)(a.Z,{direction:"row",alignItems:"center",mb:2,children:[(0,i.jsxs)(a.Z,{alignItems:"center",children:[(0,i.jsx)(m,{style:{opacity:0===n?0:1},src:"".concat(u.prefix,"data/PetUpg").concat(0===n?0:n-1,".png"),alt:""}),(0,i.jsxs)(r.Z,{children:["Lv.",null==e?void 0:e.level," / ",null==e?void 0:e.maxLevel]})]}),(0,i.jsx)(r.Z,{variant:"h6",sx:{fontWeight:"bold"},children:(0,u.cleanUnderscore)(null==e?void 0:e.name)})]}),(0,i.jsx)(a.Z,{children:(0,i.jsx)(r.Z,{children:(0,u.cleanUnderscore)(null==e?void 0:e.description)})}),(0,i.jsxs)("div",{className:"info",children:[(0,i.jsxs)(a.Z,{direction:"row",my:1,children:[(0,i.jsx)(r.Z,{sx:{fontWeight:"bold"},children:"Effect:\xa0"}),(0,i.jsx)(r.Z,{children:(null==e?void 0:e.boostEffect)==="_"?"NOTHING":(0,u.cleanUnderscore)(null==e?void 0:e.boostEffect.replace("}",w))})]}),(0,i.jsxs)(a.Z,{mt:2,gap:2,children:[(0,i.jsxs)(a.Z,{direction:"row",alignItems:"center",gap:2,children:[(0,i.jsx)("img",{src:"".concat(u.prefix,"data/").concat(null==e?void 0:e.material,".png"),alt:""}),(0,u.notateNumber)(s(e)),(0,i.jsxs)("div",{children:["(",f,")"]})]}),n>0?(0,i.jsxs)(a.Z,{direction:"row",alignItems:"center",children:[(0,i.jsxs)(j,{children:[(0,i.jsx)("img",{src:"".concat(u.prefix,"data/CookingMB").concat(null==e?void 0:e.foodIndex,".png"),alt:""}),(0,i.jsx)("img",{src:"".concat(u.prefix,"data/CookingPlate0.png"),alt:""})]}),(0,i.jsx)("div",{style:{textAlign:"center"},children:(0,i.jsxs)(r.Z,{children:[(0,u.notateNumber)(x)," / ",(0,u.notateNumber)(h)," (",Z,")"]})})]}):null,b>0?(0,i.jsxs)(r.Z,{children:["Total Bonus: ",(0,u.notateNumber)(b,"MultiplierInfo"),"x"]}):null]})]})]})},(null==e?void 0:e.name)+""+n)})})},f=e=>{let{maxArenaLevel:n,arenaBonuses:l}=e;return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(a.Z,{direction:"row",justifyContent:"center",my:3,children:(0,i.jsx)(d.Z,{children:(0,i.jsx)(c.Z,{children:(0,i.jsxs)(r.Z,{sx:{color:"success.light"},children:["Max level: ",n]})})})}),(0,i.jsx)(a.Z,{direction:"row",justifyContent:"center",flexWrap:"wrap",gap:2,children:null==l?void 0:l.map((e,l)=>{let{bonus:t,wave:o}=e;return(0,i.jsx)(d.Z,{variant:"outlined",sx:{width:200,opacity:n<o?.5:1},children:(0,i.jsxs)(c.Z,{children:[(0,i.jsxs)(r.Z,{sx:{fontWeight:"bold"},children:["Wave ",o]}),(0,i.jsx)(r.Z,{children:(0,u.cleanUnderscore)((0,u.pascalCase)(t))})]})},"".concat(o,"-").concat(l))})})]})},w=l(2962),b=l(49425),y=l(50480),T=l(69368),_=l(61903),N=l(67720),M=l(9798),U=l(58696),k=l(33948),C=l(51053);function I(){let e=(0,s._)(["\n  width: 44px;\n  height: 44px;\n"]);return I=function(){return e},e}function S(){let e=(0,s._)(["\n  width: 48px;\n  height: 48px;\n  object-fit: ",";\n  ","\n"]);return S=function(){return e},e}let A=v.Z.img(I()),E=v.Z.img(S(),e=>{let{missingIcon:n}=e;return n?"contain":"none"},e=>{let{missingIcon:n}=e;return n&&"object-position: 0 100%;"});var L=e=>{let{pets:n,lab:l,fencePetsObject:o,fencePets:s,passivesTotals:v,lastUpdated:x}=e,[h,p]=(0,t.useState)(!0),[g,m]=(0,t.useState)(5),[j,Z]=(0,t.useState)(!1),f=()=>{let e=(0,M.c9)(l.labBonuses,8),i=(0,M.pc)(l.jewels,15,e),t=(0,U.du)(n,"Faster_Shiny_Pet_Lv_Up_Rate");return 1+(i+t)/100},w=(0,t.useMemo)(()=>f(),[n]),I=(0,t.useMemo)(()=>null==s?void 0:s.map(e=>({...e,timeLeft:((null==e?void 0:e.goal)-(null==e?void 0:e.progress))/w/((null==o?void 0:o[null==e?void 0:e.monsterRawName])||1)*864e5})).sort((e,n)=>(null==e?void 0:e.timeLeft)-(null==n?void 0:n.timeLeft)),[s]);return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(a.Z,{direction:"row",flexWrap:"wrap",gap:2,my:5,children:null==I?void 0:I.map((e,n)=>{let l=((null==e?void 0:e.icon)==="Mface23"||(null==e?void 0:e.icon)==="Mface21")&&(null==e?void 0:e.monsterRawName)!=="shovelR",t=null==o?void 0:o[null==e?void 0:e.monsterRawName],s=((null==e?void 0:e.goal)-(null==e?void 0:e.progress))/w/((null==o?void 0:o[null==e?void 0:e.monsterRawName])||1)*864e5,h=(0,U.cg)(e,w,t,5);return(0,i.jsx)(b.Z,{anchorOrigin:{vertical:"top",horizontal:"left"},badgeContent:t,color:"primary",children:(0,i.jsx)(d.Z,{sx:{width:200,display:"flex",alignItems:"center",p:0},children:(0,i.jsxs)(c.Z,{sx:{"&:last-child":{padding:1}},children:[(0,i.jsxs)(a.Z,{alignItems:"center",direction:"row",gap:1,children:[(0,i.jsx)(E,{style:{filter:"hue-rotate(".concat((0,u.randomFloatBetween)(45,180),"deg)")},src:l?"".concat(u.prefix,"afk_targets/").concat(null==e?void 0:e.monsterName,".png"):"".concat(u.prefix,"data/").concat(null==e?void 0:e.icon,".png"),missingIcon:l,alt:""}),(0,i.jsxs)(a.Z,{children:[(0,i.jsxs)(r.Z,{children:["Lv. ",null==e?void 0:e.shinyLevel]}),(0,i.jsxs)(a.Z,{direction:"row",gap:1,children:[(0,i.jsx)(r.Z,{component:"span",variant:"caption",children:"Next:"}),(0,i.jsx)(k.Z,{variant:"caption",type:"countdown",lastUpdated:x,staticTime:(null==e?void 0:e.progress)===0,date:new Date().getTime()+s})]}),h>0&&h!==s?(0,i.jsxs)(a.Z,{direction:"row",gap:1,children:[(0,i.jsx)(r.Z,{component:"span",variant:"caption",children:"To 5:"}),(0,i.jsx)(k.Z,{variant:"caption",type:"countdown",lastUpdated:x,staticTime:(null==e?void 0:e.progress)===0,date:new Date().getTime()+h})]}):null]})]}),(0,i.jsx)(a.Z,{sx:{mt:1},children:(0,i.jsxs)(r.Z,{textAlign:"center",variant:"caption",children:[(0,u.cleanUnderscore)(null==e?void 0:e.passive)," (",null==v?void 0:v[null==e?void 0:e.rawPassive],")"]})})]})})},"fence"+n)})}),(0,i.jsxs)(a.Z,{justifyContent:"center",flexWrap:"wrap",gap:2,children:[(0,i.jsxs)(a.Z,{children:[(0,i.jsx)(y.Z,{control:(0,i.jsx)(T.Z,{name:"mini",checked:h,size:"small",onChange:()=>p(!h)}),label:"Compact view"}),(0,i.jsx)(y.Z,{control:(0,i.jsx)(T.Z,{name:"mini",checked:j,size:"small",onChange:()=>Z(!j)}),label:"Apply level threshold"}),(0,i.jsx)(_.Z,{sx:{width:"fit-content"},type:"number",value:g,label:"Pet level threshold",onChange:e=>m(e.target.value),helperText:"Show pets under this level only"})]}),null==n?void 0:n.map((e,n)=>(0,i.jsxs)(t.Fragment,{children:[(0,i.jsxs)(r.Z,{variant:"h3",children:["World ",n+1]}),(0,i.jsx)(d.Z,{children:(0,i.jsx)(c.Z,{children:(0,i.jsx)(a.Z,{direction:"row",flexWrap:"wrap",gap:1,children:null==e?void 0:e.map(e=>{let{monsterName:l,monsterRawName:t,icon:s,passive:v,level:p,shinyLevel:m,gene:Z,unlocked:f,progress:b,goal:y}=e,T=(y-b)/w/((null==o?void 0:o[t])||1)*864e5;if(j&&m>=g)return;let _=("Mface23"===s||"Mface21"===s)&&"shovelR"!==t;return(0,i.jsx)(d.Z,{variant:"outlined",sx:{opacity:f?1:.6},children:(0,i.jsxs)(c.Z,{sx:{width:300},children:[(0,i.jsxs)(a.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,i.jsx)(E,{src:_?"".concat(u.prefix,"afk_targets/").concat(l,".png"):"".concat(u.prefix,"data/").concat(s,".png"),missingIcon:_,alt:""}),(0,i.jsxs)(a.Z,{children:[(0,i.jsx)(r.Z,{children:(0,u.cleanUnderscore)(l)}),(0,i.jsxs)(r.Z,{variant:"caption",children:["Lv. ",p]}),(0,i.jsxs)(r.Z,{variant:"caption",sx:{opacity:m>0?1:.6},children:["Shiny Lv. ",m]}),(0,i.jsx)(C.Z,{title:"Faster Shiny Level Multi: ".concat(w,"x"),children:(0,i.jsxs)(r.Z,{variant:"caption",children:["Days ",(0,u.notateNumber)(b)," / ",y]})}),(0,i.jsx)(k.Z,{type:"countdown",lastUpdated:x,staticTime:0===b,date:new Date().getTime()+T})]})]}),(0,i.jsx)(N.Z,{sx:{my:1}}),(0,i.jsxs)(a.Z,{sx:{opacity:m>0?1:.6},children:[(0,i.jsx)(r.Z,{variant:"caption",children:"Shiny Passive:"}),(0,i.jsx)(r.Z,{children:(0,u.cleanUnderscore)(v)})]}),(0,i.jsx)(N.Z,{sx:{my:1}}),(0,i.jsxs)(a.Z,{children:[(0,i.jsx)(r.Z,{variant:"caption",children:"Gene:"}),(0,i.jsxs)(a.Z,{direction:"row",gap:1,children:[(0,i.jsx)(A,{src:"".concat(u.prefix,"data/GeneReady").concat(null==Z?void 0:Z.index,".png"),alt:""}),(0,i.jsx)(r.Z,{children:(0,u.cleanUnderscore)(null==Z?void 0:Z.name)})]})]}),h?null:(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(a.Z,{sx:{mt:2},children:[(0,i.jsx)(r.Z,{variant:"caption",sx:{color:"error.light"},children:"Combat Ability:"}),(0,i.jsx)(r.Z,{children:(0,u.cleanUnderscore)(null==Z?void 0:Z.combatAbility)})]}),(0,i.jsxs)(a.Z,{sx:{mt:1},children:[(0,i.jsx)(r.Z,{variant:"caption",sx:{color:"success.light"},children:"Bonus Ability:"}),(0,i.jsx)(r.Z,{children:(0,u.cleanUnderscore)(null==Z?void 0:Z.bonusAbility)})]})]})]})},"".concat(l,"-").concat(n))})})})},"world-".concat(n))]},"world-".concat(n)))]})]})},B=l(29222),D=l(91909),F=l(33583),W=()=>{var e,n,l,s,v,p,g,m,j,b,y,T;let{state:_}=(0,t.useContext)(o.I),N=()=>{var e,n,l,i,t,o,r,a,d,c,s,u,v;let p=(0,M.c9)(null==_?void 0:null===(e=_.account)||void 0===e?void 0:null===(n=e.lab)||void 0===n?void 0:n.labBonuses,8),g=(0,M.pc)(null==_?void 0:null===(l=_.account)||void 0===l?void 0:null===(i=l.lab)||void 0===i?void 0:i.jewels,16,p),m=(0,M.pc)(null==_?void 0:null===(t=_.account)||void 0===t?void 0:null===(o=t.lab)||void 0===o?void 0:o.jewels,11,p),j=(0,h.F4)(null==_?void 0:_.account,null,"TimeEgg",g),Z=(0,B.om)(null==_?void 0:null===(r=_.account)||void 0===r?void 0:null===(a=r.alchemy)||void 0===a?void 0:a.bubbles,"kazam","EGG_INK",!1),f=(0,x.k)(null==_?void 0:null===(d=_.account)||void 0===d?void 0:d.achievements,220),w=(0,D.pA)(null==_?void 0:null===(c=_.account)||void 0===c?void 0:c.rift,null==_?void 0:null===(s=_.account)||void 0===s?void 0:null===(u=s.totalSkillsLevels)||void 0===u?void 0:null===(v=u.breeding)||void 0===v?void 0:v.rank,1);return 7200/(1+(m+(j+(Z+(10*f+15*w))))/100)*1e3},U=(0,t.useMemo)(()=>N(),[_]),C=new Date().getTime();return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(w.PB,{title:"Idleon Toolbox | Breeding",description:"Keep track of your breeding upgrades, eggs and arena upgrades"}),(0,i.jsx)(r.Z,{variant:"h2",textAlign:"center",mb:3,children:"Breeding"}),(0,i.jsx)(a.Z,{my:2,direction:"row",alignItems:"center",flexWrap:"wrap",gap:2,children:null==_?void 0:null===(e=_.account)||void 0===e?void 0:null===(n=e.breeding)||void 0===n?void 0:null===(l=n.eggs)||void 0===l?void 0:l.map((e,n)=>e>0?(0,i.jsx)(d.Z,{children:(0,i.jsx)(c.Z,{sx:{"&:last-child":{padding:"8px"},display:"flex",alignItems:"center"},children:(0,i.jsx)("img",{src:"".concat(u.prefix,"data/PetEgg").concat(e,".png"),alt:""})})},"egg-".concat(n)):null)}),(0,i.jsxs)(a.Z,{direction:"row",gap:2,flexWrap:"wrap",children:[(0,i.jsx)(d.Z,{children:(0,i.jsxs)(c.Z,{children:[(0,i.jsx)(r.Z,{variant:"subtitle2",children:"Time to next egg"}),(0,i.jsx)(k.Z,{type:"countdown",stopAtZero:!0,date:C+(U-(null==_?void 0:null===(s=_.account)||void 0===s?void 0:null===(v=s.breeding)||void 0===v?void 0:v.timeToNextEgg)),lastUpdated:null==_?void 0:_.lastUpdated})]})}),(0,i.jsx)(d.Z,{children:(0,i.jsxs)(c.Z,{children:[(0,i.jsx)(r.Z,{variant:"subtitle2",children:"Time per egg"}),(0,i.jsx)(k.Z,{staticTime:!0,date:new Date().getTime()+U})]})})]}),(0,i.jsx)(r.Z,{variant:"caption",children:"*Time to next egg timer will be updated only when entering world 4 town"}),(0,i.jsxs)(F.Z,{tabs:["Pets","Upgrades","Arena"],children:[(0,i.jsx)(L,{...null==_?void 0:null===(p=_.account)||void 0===p?void 0:p.breeding,lab:null==_?void 0:null===(g=_.account)||void 0===g?void 0:g.lab,lastUpdated:null==_?void 0:_.lastUpdated}),(0,i.jsx)(Z,{petUpgrades:null==_?void 0:null===(m=_.account)||void 0===m?void 0:null===(j=m.breeding)||void 0===j?void 0:j.petUpgrades,account:null==_?void 0:_.account,meals:null==_?void 0:null===(b=_.account)||void 0===b?void 0:null===(y=b.cooking)||void 0===y?void 0:y.meals}),(0,i.jsx)(f,{...null==_?void 0:null===(T=_.account)||void 0===T?void 0:T.breeding})]})]})}}},function(e){e.O(0,[3554,9774,2888,179],function(){return e(e.s=52177)}),_N_E=e.O()}]);