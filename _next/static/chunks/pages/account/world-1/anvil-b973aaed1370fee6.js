(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7339],{75079:function(e,n,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/world-1/anvil",function(){return t(21005)}])},89309:function(e,n,t){"use strict";var i=t(85893),l=t(87357),r=t(81458),o=t(15861);t(67294),n.Z=e=>{let{percent:n,bgColor:t,label:a=!0,sx:c,boxSx:d={},pre:s}=e;return(0,i.jsxs)(l.Z,{sx:{display:"flex",alignItems:"center",...d},children:[s,(0,i.jsx)(l.Z,{sx:{width:"100%",mr:a?1:0},children:(0,i.jsx)(r.Z,{sx:{width:"100%",height:10,borderRadius:5,"& .MuiLinearProgress-bar":{backgroundColor:t||""},...c},variant:"determinate",value:n>100?100:n})}),a?(0,i.jsx)(l.Z,{children:(0,i.jsx)(o.Z,{variant:"body2",color:"text.secondary",children:"".concat(Math.round(n),"%")})}):null]})}},57005:function(e,n,t){"use strict";var i=t(85893),l=t(67294),r=t(71924),o=t(33913),a=t(30925),c=t(15861);let d=(0,l.forwardRef)((e,n)=>{let{date:t,startDate:d,lastUpdated:s,stopAtZero:u,type:h,pause:v,staticTime:x,placeholder:p,loop:m,variant:j="inherit",...g}=e,[f,Z]=(0,l.useState)();(0,l.useEffect)(()=>{if(t){if(x){if(!isFinite(t))return;return Z({...(0,a.getDuration)(new Date().getTime(),t)})}let e=new Date,n=e.getTime()-(null!=s?s:0),i=(0,o.Z)(t);Z({...(0,a.getDuration)(null==e?void 0:e.getTime(),t+n*("countdown"===h?-1:1)),overtime:"countdown"===h&&i})}},[t,s]);let tickUp=()=>{let{days:e,hours:n,minutes:t,seconds:i}=f;60===(i+=1)&&(i=0,60===(t+=1)&&(t=0,24===(n+=1)&&(e+=1))),Z({...f,days:e,hours:n,minutes:t,seconds:i})},tickDown=()=>{let{days:e,hours:n,minutes:t,seconds:i}=f;if(0===e&&0===n&&0===t&&0===i){if(u)return;if(m)return Z({...(0,a.getDuration)(new Date().getTime(),d)})}-1==(i-=1)&&(i=59,-1==(t-=1)&&(t=59,-1==(n-=1)&&(n=0,e-=1))),Z({...f,days:e,hours:n,minutes:t,seconds:i})};(0,r.Z)(()=>{if(!f)return null;"countdown"!==h||(null==f?void 0:f.overtime)?tickUp():tickDown()},v||x?null:1e3);let wrapNumber=e=>{let n=String(e);return(null==n?void 0:n.length)===1?"0".concat(e):e};return f?((null==f?void 0:f.overtime)||v)&&p?(0,i.jsx)(c.Z,{...g,ref:n,children:p}):(0,i.jsxs)(c.Z,{...g,ref:n,variant:j,sx:{color:"".concat((null==f?void 0:f.overtime)&&!m?"#f91d1d":"")},component:"span",children:[(null==f?void 0:f.days)?wrapNumber(null==f?void 0:f.days)+"d:":"",wrapNumber(null==f?void 0:f.hours)+"h:",wrapNumber(null==f?void 0:f.minutes)+"m",(null==f?void 0:f.days)?"":":",(null==f?void 0:f.days)?"":wrapNumber(null==f?void 0:f.seconds)+"s"]}):null});n.Z=d},21005:function(e,n,t){"use strict";t.r(n);var i=t(82729),l=t(85893),r=t(67294),o=t(21480),a=t(51233),c=t(15861),d=t(66242),s=t(44267),u=t(49425),h=t(30925),v=t(57005),x=t(61599),p=t(33739),m=t(2962),j=t(2511),g=t(89309);function _templateObject(){let e=(0,i._)(["\n  width: 42px;\n  height: 42px;\n"]);return _templateObject=function(){return e},e}let f=x.Z.img(_templateObject());n.default=()=>{let{state:e}=(0,r.useContext)(o.I),{anvil:n}=(null==e?void 0:e.account)||{},t=(0,r.useMemo)(()=>(0,p.J7)(null==e?void 0:e.account,null==e?void 0:e.characters),[null==e?void 0:e.account,null==e?void 0:e.characters]);return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(m.PB,{title:"Anvil | Idleon Toolbox",description:"Keep track of your characters anvil production"}),(0,l.jsxs)(a.Z,{direction:"row",alignItems:"baseline",gap:1,children:[(0,l.jsx)(c.Z,{variant:"h4",children:"Totals"}),(0,l.jsx)(c.Z,{variant:"caption",children:"per hour"})]}),(0,l.jsx)(a.Z,{direction:"row",gap:2,sx:{mt:2,mb:5},flexWrap:"wrap",children:Object.entries(t||{}).map((e,n)=>{let[t,i]=e;return(0,l.jsx)(d.Z,{children:(0,l.jsx)(j.Z,{title:(0,l.jsxs)(l.Fragment,{children:[(0,l.jsxs)(c.Z,{children:[(0,h.notateNumber)(24*i,"Big")," / day"]}),(0,l.jsx)(c.Z,{variant:"caption",children:"In case you're claiming before full"})]}),children:(0,l.jsx)(s.Z,{children:(0,l.jsxs)(a.Z,{alignItems:"center",gap:1,children:[(0,l.jsx)("img",{width:25,height:25,src:"".concat(h.prefix,"data/").concat(t,".png"),alt:""}),(0,l.jsx)(c.Z,{children:(0,h.notateNumber)(i,"Big")})]})})})},"total"+t+n)})}),(0,l.jsx)(a.Z,{gap:3,children:null==n?void 0:n.map((n,t)=>{var i,r,o,x,m,Z,w,b,y,_,T,N,I;let M=null==e?void 0:null===(r=e.characters)||void 0===r?void 0:null===(i=r[t])||void 0===i?void 0:i.classIndex,D=null==e?void 0:null===(x=e.characters)||void 0===x?void 0:null===(o=x[t])||void 0===o?void 0:o.name,k=null==e?void 0:null===(w=e.characters)||void 0===w?void 0:null===(Z=w[t].skillsInfo)||void 0===Z?void 0:null===(m=Z.smithing)||void 0===m?void 0:m.level,{stats:C,production:E}=(0,p.eW)(null==e?void 0:null===(b=e.characters)||void 0===b?void 0:b[t],null==e?void 0:e.characters,null==e?void 0:e.account),{availablePoints:O,pointsFromCoins:P,pointsFromMats:A}=C||{},F=null==e?void 0:null===(_=e.characters)||void 0===_?void 0:null===(y=_[t])||void 0===y?void 0:y.afkTime,U=null==e?void 0:null===(I=e.characters)||void 0===I?void 0:null===(N=I[t])||void 0===N?void 0:null===(T=N.equippedBubbles)||void 0===T?void 0:T.find(e=>{let{bubbleName:n}=e;return"HAMMER_HAMMER"===n}),B=null==E?void 0:E.filter(e=>{let{hammers:n}=e;return n>0}),S=null==B?void 0:B.reduce((e,n)=>{let{hammers:t}=n;return e+t},0),H=S>=(U?3:2)?B:(0,h.fillArrayToLength)(S,B);return(0,l.jsx)(d.Z,{sx:{width:{xs:"100%",lg:700}},children:(0,l.jsx)(s.Z,{children:(0,l.jsxs)(a.Z,{sx:{flexDirection:{xs:"column",md:"row"}},alignItems:"center",gap:2,children:[(0,l.jsxs)(a.Z,{sx:{width:175,textAlign:"center",flexDirection:{xs:"column",md:"row"}},alignItems:"center",gap:2,children:[(0,l.jsx)(a.Z,{alignItems:"center",justifyContent:"center",children:(0,l.jsx)("img",{className:"class-icon",src:"".concat(h.prefix,"data/ClassIcons").concat(M,".png"),alt:""})}),(0,l.jsxs)(a.Z,{children:[(0,l.jsx)(c.Z,{className:"character-name",children:D}),(0,l.jsxs)(c.Z,{variant:"caption",children:["Smithing lv. ",k]}),(0,l.jsxs)(c.Z,{variant:"caption",color:0===O?"":O>0?"error.light":"secondary",children:["Points ",P+A-O+k," / ",P+A+k]})]})]}),(0,l.jsx)(a.Z,{sx:{justifyContent:{xs:"center",md:"flex-start"}},direction:"row",alignItems:"center",flexWrap:"wrap",gap:3,children:null==H?void 0:H.map((n,t)=>{let{rawName:i,hammers:r,currentAmount:o,currentProgress:x,requiredAmount:m,currentXP:Z}=n,w=(new Date().getTime()-F)/1e3,b=Math.min(Math.round(o+(x+w*(null==C?void 0:C.anvilSpeed)/3600)/m*(null!=r?r:0)),null==C?void 0:C.anvilCapacity),y=Math.round(b/(null==C?void 0:C.anvilCapacity)*100),_=(0,p.MH)({...n,stats:C,afkTime:F}),T=(0,p.MH)({...n,stats:C,afkTime:F,currentAmount:0,currentProgress:0});return(0,l.jsx)(d.Z,{elevation:5,sx:{boxShadow:r>0?"inherit":"0px 0px 5px #ff0707"},children:(0,l.jsx)(j.Z,{title:(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(c.Z,{children:"Max from zero"}),(0,l.jsx)(v.Z,{date:new Date().getTime()+1e3*T,staticTime:!0,type:"countdown",placeholder:(0,l.jsx)(c.Z,{color:"error.light",children:"Full"}),lastUpdated:null==e?void 0:e.lastUpdated})]}),children:(0,l.jsx)(s.Z,{children:r>0?(0,l.jsxs)(a.Z,{justifyContent:"flex-start",children:[(0,l.jsx)(u.Z,{anchorOrigin:{vertical:"top",horizontal:"left"},color:"secondary",variant:"standard",badgeContent:r>1?r:0,children:(0,l.jsx)(f,{src:"".concat(h.prefix,"data/").concat(i,".png"),alt:""})}),(0,l.jsx)(v.Z,{date:new Date().getTime()+1e3*_,staticTime:!0,type:"countdown",placeholder:(0,l.jsx)(c.Z,{color:"error.light",children:"Full"}),lastUpdated:null==e?void 0:e.lastUpdated}),(0,l.jsxs)(c.Z,{children:["Exp: ",(0,h.notateNumber)(Z,"Big")]}),(0,l.jsx)(g.Z,{percent:y,label:!1})]}):(0,l.jsx)(a.Z,{sx:{width:90,height:65},alignItems:"center",justifyContent:"center",children:(0,l.jsx)(c.Z,{variant:"caption",children:"EMPTY"})})})})},"".concat(i,"-").concat(t))})})]})})},"printer-row-".concat(t))})})]})}}},function(e){e.O(0,[4016,9774,2888,179],function(){return e(e.s=75079)}),_N_E=e.O()}]);