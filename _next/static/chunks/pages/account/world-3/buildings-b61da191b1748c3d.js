(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3446],{60552:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/world-3/buildings",function(){return n(7258)}])},57005:function(e,t,n){"use strict";var l=n(85893),i=n(67294),r=n(71924),o=n(33913),a=n(30925),c=n(15861);let d=(0,i.forwardRef)((e,t)=>{let{date:n,startDate:d,lastUpdated:s,stopAtZero:u,type:m,pause:x,staticTime:v,placeholder:h,loop:p,variant:j="inherit",...f}=e,[g,Z]=(0,i.useState)();(0,i.useEffect)(()=>{if(n){if(v){if(!isFinite(n))return;return Z({...(0,a.getDuration)(new Date().getTime(),n)})}let e=new Date,t=e.getTime()-(null!=s?s:0),l=(0,o.Z)(n);Z({...(0,a.getDuration)(null==e?void 0:e.getTime(),n+t*("countdown"===m?-1:1)),overtime:"countdown"===m&&l})}},[n,s]);let tickUp=()=>{let{days:e,hours:t,minutes:n,seconds:l}=g;60===(l+=1)&&(l=0,60===(n+=1)&&(n=0,24===(t+=1)&&(e+=1))),Z({...g,days:e,hours:t,minutes:n,seconds:l})},tickDown=()=>{let{days:e,hours:t,minutes:n,seconds:l}=g;if(0===e&&0===t&&0===n&&0===l){if(u)return;if(p)return Z({...(0,a.getDuration)(new Date().getTime(),d)})}-1==(l-=1)&&(l=59,-1==(n-=1)&&(n=59,-1==(t-=1)&&(t=0,e-=1))),Z({...g,days:e,hours:t,minutes:n,seconds:l})};(0,r.Z)(()=>{if(!g)return null;"countdown"!==m||(null==g?void 0:g.overtime)?tickUp():tickDown()},x||v?null:1e3);let wrapNumber=e=>{let t=String(e);return(null==t?void 0:t.length)===1?"0".concat(e):e};return g?((null==g?void 0:g.overtime)||x)&&h?(0,l.jsx)(c.Z,{...f,ref:t,children:h}):(0,l.jsxs)(c.Z,{...f,ref:t,variant:j,sx:{color:"".concat((null==g?void 0:g.overtime)&&!p?"#f91d1d":"")},component:"span",children:[(null==g?void 0:g.days)?wrapNumber(null==g?void 0:g.days)+"d:":"",wrapNumber(null==g?void 0:g.hours)+"h:",wrapNumber(null==g?void 0:g.minutes)+"m",(null==g?void 0:g.days)?"":":",(null==g?void 0:g.days)?"":wrapNumber(null==g?void 0:g.seconds)+"s"]}):null});t.Z=d},64885:function(e,t,n){"use strict";n.d(t,{Gr:function(){return MissingData},M5:function(){return p},Wd:function(){return PlayersList},Ye:function(){return CardTitleAndValue},iy:function(){return CardAndBorder},j8:function(){return j},tq:function(){return Breakdown},u3:function(){return TalentTooltip},uQ:function(){return TitleAndValue},wD:function(){return CenteredStack}});var l=n(82729),i=n(85893),r=n(67294),o=n(30925),a=n(51233),c=n(15861),d=n(49425),s=n(66242),u=n(44267),m=n(67720),x=n(61599),v=n(2511),h=n(54685);function _templateObject(){let e=(0,l._)(["\n  & .MuiBadge-badge {\n    background-color: #d5d5dc;\n    color: rgba(0, 0, 0, 0.87);\n  }\n"]);return _templateObject=function(){return e},e}function _templateObject1(){let e=(0,l._)(["\n  height: 20px;\n  object-fit: contain;\n"]);return _templateObject1=function(){return e},e}function _templateObject2(){let e=(0,l._)(["\n  width: 56px;\n  height: 72px;\n  object-fit: contain;\n  opacity: ",";\n"]);return _templateObject2=function(){return e},e}function _templateObject3(){let e=(0,l._)(["\n  position: absolute;\n  left: 50%;\n  top: -3px;\n  pointer-events: none;\n  transform: translateX(-50%);\n"]);return _templateObject3=function(){return e},e}let p=(0,r.forwardRef)((e,t)=>{let{stat:n,icon:l,img:r,title:d="",...s}=e;return(0,i.jsx)(v.Z,{title:d,children:(0,i.jsxs)(a.Z,{alignItems:"center",...s,ref:t,style:{position:"relative",width:"fit-content"},children:[(0,i.jsx)("img",{...r,src:"".concat(o.prefix,"data/").concat(l,".png"),alt:""}),(0,i.jsx)(c.Z,{variant:"body1",component:"span",children:n})]})})});p.displayName="IconWithText";let TitleAndValue=e=>{let{title:t,value:n,boldTitle:l,titleStyle:r={},valueStyle:o={}}=e;return(0,i.jsxs)(a.Z,{direction:"row",flexWrap:"wrap",alignItems:"center",children:[t?(0,i.jsxs)(c.Z,{sx:r,fontWeight:l?"bold":500,component:"span",children:[t,":\xa0"]}):null,(0,i.jsx)(c.Z,{fontSize:15,component:"span",sx:o,children:n})]})},j=(0,x.Z)(d.Z)(_templateObject()),CardAndBorder=e=>{let{cardName:t,stars:n,cardIndex:l,name:r,variant:a,rawName:c,amount:d,nextLevelReq:s}=e,u="cardSet"===a?"".concat(o.prefix,"data/").concat(c,".png"):"".concat(o.prefix,"data/2Cards").concat(l,".png");return(0,i.jsxs)(i.Fragment,{children:[n>0?(0,i.jsx)(Z,{src:"".concat(o.prefix,"data/CardEquipBorder").concat(n,".png"),alt:""}):null,(0,i.jsx)(v.Z,{title:(0,i.jsx)(CardTooltip,{...e,cardName:"cardSet"===a?r:t,nextLevelReq:s,amount:d}),children:(0,i.jsx)(g,{isCardSet:"cardSet"===a,amount:d,src:u,alt:""})})]})},CardTooltip=e=>{let{displayName:t,effect:n,bonus:l,stars:r,showInfo:d,nextLevelReq:s,amount:u}=e,m=l;return d&&(m=(0,h.BZ)({bonus:l,stars:r})),(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(c.Z,{fontWeight:"bold",variant:"h6",children:(0,o.cleanUnderscore)(t)}),(0,i.jsx)(c.Z,{children:(0,o.cleanUnderscore)(n.replace("{",m))}),d?(0,i.jsx)(a.Z,{mt:1,direction:"row",gap:1,flexWrap:"wrap",children:[1,2,3,4,5,6].map((e,n)=>(0,i.jsxs)(a.Z,{alignItems:"center",justifyContent:"space-between",children:[0===n?(0,i.jsx)(c.Z,{children:"Base"}):(0,i.jsx)(f,{src:"".concat(o.prefix,"etc/Star").concat(n,".png"),alt:""}),(0,i.jsx)(c.Z,{children:l*(n+1)})]},"".concat(t,"-").concat(n)))}):null,u>=s?(0,i.jsxs)(a.Z,{children:["You've collected ",(0,o.numberWithCommas)(u)," cards"]}):s>0?(0,i.jsxs)(a.Z,{children:["Progress: ",(0,o.numberWithCommas)(u)," / ",(0,o.numberWithCommas)(s)]}):null]})},f=x.Z.img(_templateObject1()),g=x.Z.img(_templateObject2(),e=>{let{amount:t,isCardSet:n}=e;return t||n?1:.5}),Z=x.Z.img(_templateObject3()),TalentTooltip=e=>{let{level:t,funcX:n,x1:l,x2:r,funcY:d,y1:s,y2:u,description:m,name:x,talentId:v}=e,h=t>0?(0,o.growth)(n,t,l,r):0,p=t>0?(0,o.growth)(d,t,s,u):0;return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(a.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,i.jsx)("img",{src:"".concat(o.prefix,"data/UISkillIcon").concat(v,".png"),alt:""}),(0,i.jsx)(c.Z,{fontWeight:"bold",variant:"h6",children:(0,o.cleanUnderscore)(x)})]}),(0,i.jsx)(c.Z,{children:(0,o.cleanUnderscore)(m).replace("{",h).replace("}",p)})]})},PlayersList=e=>{let{players:t,characters:n}=e;return(0,i.jsx)(a.Z,{gap:1,direction:"row",children:t.map(e=>{var t,l;let{index:r}=e;return(0,i.jsx)(v.Z,{title:null==n?void 0:null===(t=n[r])||void 0===t?void 0:t.name,children:(0,i.jsx)("img",{style:{width:24,height:24},src:"".concat(o.prefix,"data/ClassIcons").concat(null==n?void 0:null===(l=n[r])||void 0===l?void 0:l.classIndex,".png"),alt:""})},name+"-head-"+r)})})},MissingData=e=>{let{name:t}=e;return(0,i.jsxs)(c.Z,{variant:"h3",children:["Your account is missing data for ",t]})},CardTitleAndValue=e=>{let{variant:t,raised:n,cardSx:l,imgStyle:r,title:d,value:m,children:x,icon:h,tooltipTitle:p,stackProps:j}=e;return(0,i.jsx)(v.Z,{title:p||"",children:(0,i.jsx)(s.Z,{variant:t,raised:n,sx:{my:{xs:0,md:3},width:"fit-content",...l},children:(0,i.jsx)(u.Z,{children:(0,i.jsxs)(a.Z,{sx:{display:j?"flex":"block",...j||{}},children:[(0,i.jsx)(c.Z,{sx:{fontSize:14},color:"text.secondary",gutterBottom:!0,children:d}),m?h?(0,i.jsxs)(a.Z,{direction:"row",gap:2,alignItems:"center",children:[(0,i.jsx)("img",{style:{objectFit:"contain",...r},src:"".concat(o.prefix).concat(h),alt:""}),(0,i.jsx)(c.Z,{children:m})]}):(0,i.jsx)(c.Z,{children:m}):x]})})})})},Breakdown=e=>{let{breakdown:t,titleStyle:n={},notation:l="Big"}=e;return(0,i.jsx)(i.Fragment,{children:null==t?void 0:t.map((e,t)=>{let{name:r,value:a,title:d}=e;return d?(0,i.jsx)(c.Z,{sx:{fontWeight:500},children:d},"".concat(r,"-").concat(t)):r?(0,i.jsx)(TitleAndValue,{titleStyle:{width:120,...n},title:r,value:isNaN(a)?a:(0,o.notateNumber)(a,l)},"".concat(r,"-").concat(t)):(0,i.jsx)(m.Z,{sx:{my:1,bgcolor:"black"}},"".concat(r,"-").concat(t))})})},CenteredStack=e=>{let{direction:t="row",children:n}=e;return(0,i.jsx)(a.Z,{gap:1,direction:t,alignItems:"center",children:n})}},7258:function(e,t,n){"use strict";n.r(t);var l=n(82729),i=n(85893),r=n(67294),o=n(21480),a=n(15861),c=n(51233),d=n(33454),s=n(96420),u=n(66242),m=n(44267),x=n(67720),v=n(30925),h=n(61599),p=n(47212),j=n(2962),f=n(57005),g=n(95331),Z=n(2511),b=n(87357),w=n(64885),_=n(74721);function _templateObject(){let e=(0,l._)(["\n  width: 50px;\n  height: 50px;\n  object-fit: contain;\n"]);return _templateObject=function(){return e},e}function _templateObject1(){let e=(0,l._)(["\n  width: 35px;\n  height: 35px;\n  object-fit: contain;\n"]);return _templateObject1=function(){return e},e}let C=h.Z.img(_templateObject()),T=h.Z.img(_templateObject1()),CardTitleAndValue=e=>{let{cardSx:t,title:n,value:l,children:r,breakdown:o}=e;return(0,i.jsx)(u.Z,{sx:{my:{xs:0,md:3},width:"fit-content",...t},children:(0,i.jsxs)(m.Z,{children:[(0,i.jsx)(a.Z,{sx:{fontSize:14},color:"text.secondary",gutterBottom:!0,children:n}),(0,i.jsxs)(c.Z,{direction:"row",gap:2,children:[l?(0,i.jsx)(a.Z,{children:l}):r,o?(0,i.jsx)(Z.Z,{title:(0,i.jsx)(c.Z,{children:null==o?void 0:o.map((e,t)=>{let{name:n,value:l}=e;return(0,i.jsx)(w.uQ,{title:n,value:isNaN(l)?l:"".concat((0,v.notateNumber)(l,"MultiplierInfo").replace(".00",""),"x")},"".concat(n,"-").concat(t))})}),children:(0,i.jsx)(_.Z,{})}):null]})]})})};t.default=()=>{var e,t;let{state:n}=(0,r.useContext)(o.I),[l,h]=(0,r.useState)("order"),_=null==n?void 0:null===(t=n.account)||void 0===t?void 0:null===(e=t.construction)||void 0===e?void 0:e.totalBuildRate,y=(0,g._m)(null==n?void 0:n.account,"Nitrogen_-_Construction_Trimmer"),N=(0,r.useMemo)(()=>{var e,t,l;return null==n?void 0:null===(l=n.account)||void 0===l?void 0:null===(t=l.towers)||void 0===t?void 0:null===(e=t.data)||void 0===e?void 0:e.find(e=>5===e.index)},[n]),getMaterialCosts=(e,t,n,l,i)=>e.map(e=>{let{rawName:r,name:o,amount:a}=e,c=Math.min(.1,.1*Math.floor((i.level+999)/1e3)),d=Math.max(0,i.level-1),s=Math.max(.2,1-(c+d*i.costInc[0]/100));return r.includes("Refinery")?{rawName:r,name:o,amount:Math.floor(s*a*(t+1))}:{rawName:r,name:o,amount:Math.floor(s*a*Math.pow(l+.03-(l+.03-1.05)*t/(n/2+t),t))}}),B=(0,r.useMemo)(()=>{var e,t,l;return null==n?void 0:null===(l=n.account)||void 0===l?void 0:null===(t=l.towers)||void 0===t?void 0:null===(e=t.data)||void 0===e?void 0:e.map(e=>{var t,l,i,r,o,a,c,d,s,u,m,x,v;let{progress:h,level:j,maxLevel:f,bonusInc:g,itemReq:Z,slot:b}=e,w=getMaterialCosts(Z,j,f,g,N),C=(0,p.ZX)(null==n?void 0:null===(t=n.account)||void 0===t?void 0:t.towers,j,g,null==e?void 0:e.index),T=null==n?void 0:null===(r=n.account)||void 0===r?void 0:null===(i=r.atoms)||void 0===i?void 0:null===(l=i.atoms)||void 0===l?void 0:l.find(e=>{let{name:t}=e;return"Carbon_-_Wizard_Maximizer"===t}),B=(0,p.Bt)(null==n?void 0:null===(a=n.account)||void 0===a?void 0:null===(o=a.towers)||void 0===o?void 0:o.totalLevels,f,null==T?void 0:T.level);f+=B;let M=(null==n?void 0:null===(s=n.account)||void 0===s?void 0:null===(d=s.lab.jewels)||void 0===d?void 0:null===(c=d.slice(3,7))||void 0===c?void 0:c.every(e=>{let{active:t}=e;return t}))?1:0,S=(null==n?void 0:null===(x=n.account)||void 0===x?void 0:null===(m=x.lab.jewels)||void 0===m?void 0:null===(u=m[3])||void 0===u?void 0:u.active)?1+M:0,O=S+(y?1:0),I=-1!==b&&b<O;if(I){let e=(new Date().getTime()-(null!==(v=null==n?void 0:n.lastUpdated)&&void 0!==v?v:0))/1e3;h+=(3+y/100)*(e/3600)*_}let k=(3+y/100)*_,W=(C-h)/k*36e5,D=(C-h)/_*36e5;return{...e,maxLevel:f,isMaxed:j===f,isSlotTrimmed:I,timeLeft:D,progress:h,buildCost:C,items:w,trimmedSlotSpeed:k,trimmedTimeLeft:W}})},[null==n?void 0:n.account]),M=(0,r.useMemo)(()=>{if("order"===l)return B;if("time"===l){let e=JSON.parse(JSON.stringify(B));return null==e?void 0:e.sort((e,t)=>{let n=(null==e?void 0:e.isSlotTrimmed)?null==e?void 0:e.trimmedTimeLeft:null==e?void 0:e.timeLeft,l=(null==t?void 0:t.isSlotTrimmed)?null==t?void 0:t.trimmedTimeLeft:null==t?void 0:t.timeLeft;return(null==e?void 0:e.isMaxed)?1:(null==t?void 0:t.isMaxed)?-1:n-l})}if("requirement"===l){let e=JSON.parse(JSON.stringify(B));return null==e?void 0:e.sort((e,t)=>{if(null==e?void 0:e.isMaxed)return 1;if(null==t?void 0:t.isMaxed)return -1;let n=(null==e?void 0:e.buildCost)-(null==t?void 0:t.buildCost);if(0!==n)return n;{let n=(null==e?void 0:e.buildCost)-(null==e?void 0:e.progress),l=(null==t?void 0:t.buildCost)-(null==t?void 0:t.progress);return n-l}})}},[l,n]),getBorderColor=e=>{let{isSlotTrimmed:t,inProgress:n}=e;return t?"warning.light":n?"success.light":""};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(j.PB,{title:"Buildings | Idleon Toolbox",description:"Keep track of your towers levels, bonuses and required materials for upgrades"}),(0,i.jsx)(a.Z,{variant:"h2",mb:3,children:"Buildings"}),(0,i.jsxs)(c.Z,{direction:"row",alignItems:"center",gap:3,flexWrap:"wrap",mb:2,children:[(0,i.jsxs)(b.Z,{children:[(0,i.jsx)(a.Z,{children:"Sort by"}),(0,i.jsxs)(d.Z,{value:l,sx:{mb:2},exclusive:!0,onChange:(e,t)=>(null==t?void 0:t.length)>0&&h(t),children:[(0,i.jsx)(s.Z,{value:"order",children:"Order"}),(0,i.jsx)(s.Z,{value:"time",children:"Time left"}),(0,i.jsx)(s.Z,{value:"requirement",children:"Build cost"})]})]}),(0,i.jsx)(CardTitleAndValue,{title:"Build Speed",value:(0,v.notateNumber)(_,"Big")}),(0,i.jsx)(CardTitleAndValue,{title:"Trimmed Build Speed",value:(0,v.notateNumber)((3+y/100)*_,"Big"),breakdown:[{name:"Base (jewel)",value:3},{name:"Atom",value:y/100}]})]}),(0,i.jsx)(c.Z,{direction:"row",flexWrap:"wrap",gap:3,children:null==M?void 0:M.map((e,t)=>{let{name:l,progress:r,level:o,maxLevel:d,inProgress:s,isSlotTrimmed:h,isMaxed:p,items:j,buildCost:g,timeLeft:b,trimmedTimeLeft:_}=e;return(0,i.jsx)(u.Z,{sx:{border:s||h?"1px solid":"",borderColor:getBorderColor(e),width:{xs:"100%",md:450},height:{md:165}},children:(0,i.jsx)(m.Z,{children:(0,i.jsxs)(c.Z,{direction:"row",justifyContent:"space-around",flexWrap:"wrap",children:[(0,i.jsxs)(c.Z,{alignItems:"center",sx:{textAlign:"center"},children:[(0,i.jsx)(a.Z,{children:(0,v.cleanUnderscore)(l)}),(0,i.jsx)(C,{src:"".concat(v.prefix,"data/ConTower").concat(null==e?void 0:e.index,".png"),alt:""}),(0,i.jsxs)(a.Z,{children:["Lv. ",o," / ",d]}),p?(0,i.jsx)(a.Z,{color:"success.light",children:"Maxed"}):(0,i.jsx)(Z.Z,{title:(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(a.Z,{children:["Progress: ",(0,v.numberWithCommas)(Math.floor(r))]}),(0,i.jsxs)(a.Z,{children:["Requirement: ",(0,v.numberWithCommas)(Math.floor(g))]})]}),children:(0,i.jsxs)(a.Z,{children:[(0,v.notateNumber)(r,"Big")," / ",(0,v.notateNumber)(g,"Big")]})})]}),p?null:(0,i.jsxs)(c.Z,{gap:2,divider:(0,i.jsx)(x.Z,{flexItem:!0}),children:[(0,i.jsxs)(c.Z,{children:[p?null:(0,i.jsx)(w.uQ,{title:"Non-trimmed",titleStyle:{color:!h&&"#81c784"},value:(0,i.jsx)(f.Z,{type:"countdown",staticTime:!0,placeholder:"Ready!",date:new Date().getTime()+b,lastUpdated:null==n?void 0:n.lastUpdated})}),p?null:(0,i.jsx)(w.uQ,{title:"Trimmed",titleStyle:{color:h&&"#81c784"},value:(0,i.jsx)(f.Z,{type:"countdown",placeholder:"Ready!",staticTime:!0,date:new Date().getTime()+_,lastUpdated:null==n?void 0:n.lastUpdated})})]}),p?null:(0,i.jsx)(c.Z,{direction:"row",gap:3,alignItems:"center",children:(0,i.jsx)(c.Z,{direction:"row",gap:1,children:null==j?void 0:j.map((e,t)=>{let{rawName:n,amount:r}=e;return(0,i.jsxs)(c.Z,{alignItems:"center",children:[(0,i.jsx)(T,{src:"".concat(v.prefix,"data/").concat(n,".png"),alt:""}),(0,i.jsx)(a.Z,{children:(0,v.notateNumber)(r,"Big")})]},"".concat(l,"-").concat(n,"-").concat(t))})})})]})]})})},"".concat(l,"-").concat(t))})})]})}}},function(e){e.O(0,[5125,9774,2888,179],function(){return e(e.s=60552)}),_N_E=e.O()}]);