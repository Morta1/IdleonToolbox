(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3446],{75558:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/world-3/buildings",function(){return n(92854)}])},9137:function(e,t,n){"use strict";var l=n(85893),i=n(67294),r=n(60970),o=n(33913),a=n(30925),d=n(15861);let c=(0,i.forwardRef)((e,t)=>{let{date:n,startDate:c,lastUpdated:s,stopAtZero:u,type:m,pause:x,staticTime:v,placeholder:p,loop:h,variant:j="inherit",...f}=e,[g,Z]=(0,i.useState)();(0,i.useEffect)(()=>{if(n){if(v){if(!isFinite(n))return;return Z({...(0,a.getDuration)(new Date().getTime(),n)})}let e=new Date,t=e.getTime()-(null!=s?s:0),l=(0,o.Z)(n);Z({...(0,a.getDuration)(null==e?void 0:e.getTime(),n+t*("countdown"===m?-1:1)),overtime:"countdown"===m&&l})}},[n,s]);let tickUp=()=>{let{days:e,hours:t,minutes:n,seconds:l}=g;60===(l+=1)&&(l=0,60===(n+=1)&&(n=0,24===(t+=1)&&(e+=1))),Z({...g,days:e,hours:t,minutes:n,seconds:l})},tickDown=()=>{let{days:e,hours:t,minutes:n,seconds:l}=g;if(0===e&&0===t&&0===n&&0===l){if(u)return;if(h)return Z({...(0,a.getDuration)(new Date().getTime(),c)})}-1==(l-=1)&&(l=59,-1==(n-=1)&&(n=59,-1==(t-=1)&&(t=0,e-=1))),Z({...g,days:e,hours:t,minutes:n,seconds:l})};(0,r.Z)(()=>{if(!g)return null;"countdown"!==m||(null==g?void 0:g.overtime)?tickUp():tickDown()},x||v?null:1e3);let wrapNumber=e=>{let t=String(e);return(null==t?void 0:t.length)===1?"0".concat(e):e};return g?((null==g?void 0:g.overtime)||x)&&p?(0,l.jsx)(d.Z,{...f,ref:t,children:p}):(0,l.jsxs)(d.Z,{...f,ref:t,variant:j,sx:{color:"".concat((null==g?void 0:g.overtime)&&!h?"#f91d1d":"")},component:"span",children:[(null==g?void 0:g.days)?wrapNumber(null==g?void 0:g.days)+"d:":"",wrapNumber(null==g?void 0:g.hours)+"h:",wrapNumber(null==g?void 0:g.minutes)+"m",(null==g?void 0:g.days)?"":":",(null==g?void 0:g.days)?"":wrapNumber(null==g?void 0:g.seconds)+"s"]}):null});t.Z=c},86736:function(e,t,n){"use strict";n.d(t,{Gr:function(){return MissingData},M5:function(){return p},Wd:function(){return PlayersList},Ye:function(){return CardTitleAndValue},iy:function(){return CardAndBorder},j8:function(){return h},u3:function(){return TalentTooltip},uQ:function(){return TitleAndValue},wD:function(){return CenteredStack}});var l=n(82729),i=n(85893),r=n(67294),o=n(30925),a=n(51233),d=n(15861),c=n(49425),s=n(66242),u=n(44267),m=n(61599),x=n(5072),v=n(54685);function _templateObject(){let e=(0,l._)(["\n  & .MuiBadge-badge {\n    background-color: #d5d5dc;\n    color: rgba(0, 0, 0, 0.87);\n  }\n"]);return _templateObject=function(){return e},e}function _templateObject1(){let e=(0,l._)(["\n  height: 20px;\n  object-fit: contain;\n"]);return _templateObject1=function(){return e},e}function _templateObject2(){let e=(0,l._)(["\n  width: 56px;\n  height: 72px;\n  object-fit: contain;\n  opacity: ",";\n"]);return _templateObject2=function(){return e},e}function _templateObject3(){let e=(0,l._)(["\n  position: absolute;\n  left: 50%;\n  top: -3px;\n  pointer-events: none;\n  transform: translateX(-50%);\n"]);return _templateObject3=function(){return e},e}let p=(0,r.forwardRef)((e,t)=>{let{stat:n,icon:l,img:r,title:c="",...s}=e;return(0,i.jsx)(x.Z,{title:c,children:(0,i.jsxs)(a.Z,{alignItems:"center",...s,ref:t,style:{position:"relative",width:"fit-content"},children:[(0,i.jsx)("img",{...r,src:"".concat(o.prefix,"data/").concat(l,".png"),alt:""}),(0,i.jsx)(d.Z,{variant:"body1",component:"span",children:n})]})})});p.displayName="IconWithText";let TitleAndValue=e=>{let{title:t,value:n,boldTitle:l,titleStyle:r={},valueStyle:o={}}=e;return(0,i.jsxs)(a.Z,{direction:"row",flexWrap:"wrap",alignItems:"center",children:[t?(0,i.jsxs)(d.Z,{style:r,fontWeight:l?"bold":500,component:"span",children:[t,":\xa0"]}):null,(0,i.jsx)(d.Z,{fontSize:15,component:"span",sx:o,children:n})]})},h=(0,m.Z)(c.Z)(_templateObject()),CardAndBorder=e=>{let{cardName:t,stars:n,cardIndex:l,name:r,variant:a,rawName:d,amount:c,nextLevelReq:s}=e,u="cardSet"===a?"".concat(o.prefix,"data/").concat(d,".png"):"".concat(o.prefix,"data/2Cards").concat(l,".png");return(0,i.jsxs)(i.Fragment,{children:[n>0?(0,i.jsx)(g,{src:"".concat(o.prefix,"data/CardEquipBorder").concat(n,".png"),alt:""}):null,(0,i.jsx)(x.Z,{title:(0,i.jsx)(CardTooltip,{...e,cardName:"cardSet"===a?r:t,nextLevelReq:s,amount:c}),children:(0,i.jsx)(f,{isCardSet:"cardSet"===a,amount:c,src:u,alt:""})})]})},CardTooltip=e=>{let{displayName:t,effect:n,bonus:l,stars:r,showInfo:c,nextLevelReq:s,amount:u}=e,m=l;return c&&(m=(0,v.BZ)({bonus:l,stars:r})),(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(d.Z,{fontWeight:"bold",variant:"h6",children:(0,o.cleanUnderscore)(t)}),(0,i.jsx)(d.Z,{children:(0,o.cleanUnderscore)(n.replace("{",m))}),c?(0,i.jsx)(a.Z,{mt:1,direction:"row",gap:1,flexWrap:"wrap",children:[1,2,3,4,5,6].map((e,n)=>(0,i.jsxs)(a.Z,{alignItems:"center",justifyContent:"space-between",children:[0===n?(0,i.jsx)(d.Z,{children:"Base"}):(0,i.jsx)(j,{src:"".concat(o.prefix,"etc/Star").concat(n,".png"),alt:""}),(0,i.jsx)(d.Z,{children:l*(n+1)})]},"".concat(t,"-").concat(n)))}):null,u>=s?(0,i.jsxs)(a.Z,{children:["You've collected ",(0,o.numberWithCommas)(u)," cards"]}):s>0?(0,i.jsxs)(a.Z,{children:["Progress: ",(0,o.numberWithCommas)(u)," / ",(0,o.numberWithCommas)(s)]}):null]})},j=m.Z.img(_templateObject1()),f=m.Z.img(_templateObject2(),e=>{let{amount:t,isCardSet:n}=e;return t||n?1:.5}),g=m.Z.img(_templateObject3()),TalentTooltip=e=>{let{level:t,funcX:n,x1:l,x2:r,funcY:c,y1:s,y2:u,description:m,name:x,talentId:v}=e,p=t>0?(0,o.growth)(n,t,l,r):0,h=t>0?(0,o.growth)(c,t,s,u):0;return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(a.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,i.jsx)("img",{src:"".concat(o.prefix,"data/UISkillIcon").concat(v,".png"),alt:""}),(0,i.jsx)(d.Z,{fontWeight:"bold",variant:"h6",children:(0,o.cleanUnderscore)(x)})]}),(0,i.jsx)(d.Z,{children:(0,o.cleanUnderscore)(m).replace("{",p).replace("}",h)})]})},PlayersList=e=>{let{players:t,characters:n}=e;return(0,i.jsx)(a.Z,{gap:1,direction:"row",children:t.map(e=>{var t,l;let{index:r}=e;return(0,i.jsx)(x.Z,{title:null==n?void 0:null===(t=n[r])||void 0===t?void 0:t.name,children:(0,i.jsx)("img",{style:{width:24,height:24},src:"".concat(o.prefix,"data/ClassIcons").concat(null==n?void 0:null===(l=n[r])||void 0===l?void 0:l.classIndex,".png"),alt:""})},name+"-head-"+r)})})},MissingData=e=>{let{name:t}=e;return(0,i.jsxs)(d.Z,{variant:"h3",children:["Your account is missing data for ",t]})},CardTitleAndValue=e=>{let{variant:t,raised:n,cardSx:l,imgStyle:r,title:c,value:m,children:x,icon:v}=e;return(0,i.jsx)(s.Z,{variant:t,raised:n,sx:{my:{xs:0,md:3},width:"fit-content",...l},children:(0,i.jsxs)(u.Z,{children:[(0,i.jsx)(d.Z,{sx:{fontSize:14},color:"text.secondary",gutterBottom:!0,children:c}),m?v?(0,i.jsxs)(a.Z,{direction:"row",gap:2,alignItems:"center",children:[(0,i.jsx)("img",{style:{objectFit:"contain",...r},src:"".concat(o.prefix).concat(v),alt:""}),(0,i.jsx)(d.Z,{children:m})]}):(0,i.jsx)(d.Z,{children:m}):x]})})},CenteredStack=e=>{let{direction:t="row",children:n}=e;return(0,i.jsx)(a.Z,{gap:1,direction:t,alignItems:"center",children:n})}},92854:function(e,t,n){"use strict";n.r(t);var l=n(82729),i=n(85893),r=n(67294),o=n(23513),a=n(15861),d=n(51233),c=n(33454),s=n(96420),u=n(66242),m=n(44267),x=n(67720),v=n(30925),p=n(61599),h=n(47212),j=n(2962),f=n(9137),g=n(95331),Z=n(5072),w=n(87357),b=n(86736),_=n(74721);function _templateObject(){let e=(0,l._)(["\n  width: 50px;\n  height: 50px;\n  object-fit: contain;\n"]);return _templateObject=function(){return e},e}function _templateObject1(){let e=(0,l._)(["\n  width: 35px;\n  height: 35px;\n  object-fit: contain;\n"]);return _templateObject1=function(){return e},e}let C=p.Z.img(_templateObject()),T=p.Z.img(_templateObject1()),CardTitleAndValue=e=>{let{cardSx:t,title:n,value:l,children:r,breakdown:o}=e;return(0,i.jsx)(u.Z,{sx:{my:{xs:0,md:3},width:"fit-content",...t},children:(0,i.jsxs)(m.Z,{children:[(0,i.jsx)(a.Z,{sx:{fontSize:14},color:"text.secondary",gutterBottom:!0,children:n}),(0,i.jsxs)(d.Z,{direction:"row",gap:2,children:[l?(0,i.jsx)(a.Z,{children:l}):r,o?(0,i.jsx)(Z.Z,{title:(0,i.jsx)(d.Z,{children:null==o?void 0:o.map((e,t)=>{let{name:n,value:l}=e;return(0,i.jsx)(b.uQ,{title:n,value:isNaN(l)?l:"".concat((0,v.notateNumber)(l,"MultiplierInfo").replace(".00",""),"x")},"".concat(n,"-").concat(t))})}),children:(0,i.jsx)(_.Z,{})}):null]})]})})};t.default=()=>{var e,t;let{state:n}=(0,r.useContext)(o.I),[l,p]=(0,r.useState)("order"),_=null==n?void 0:null===(t=n.account)||void 0===t?void 0:null===(e=t.construction)||void 0===e?void 0:e.totalBuildRate,y=(0,g._m)(null==n?void 0:n.account,"Nitrogen_-_Construction_Trimmer"),M=(0,r.useMemo)(()=>{var e,t,l;return null==n?void 0:null===(l=n.account)||void 0===l?void 0:null===(t=l.towers)||void 0===t?void 0:null===(e=t.data)||void 0===e?void 0:e.find(e=>5===e.index)},[n]),getMaterialCosts=(e,t,n,l,i)=>e.map(e=>{let{rawName:r,name:o,amount:a}=e,d=Math.min(.1,.1*Math.floor((i.level+999)/1e3)),c=Math.max(0,i.level-1),s=Math.max(.2,1-(d+c*i.costInc[0]/100));return r.includes("Refinery")?{rawName:r,name:o,amount:Math.floor(s*a*(t+1))}:{rawName:r,name:o,amount:Math.floor(s*a*Math.pow(l+.03-(l+.03-1.05)*t/(n/2+t),t))}}),N=(0,r.useMemo)(()=>{var e,t,l;return null==n?void 0:null===(l=n.account)||void 0===l?void 0:null===(t=l.towers)||void 0===t?void 0:null===(e=t.data)||void 0===e?void 0:e.map(e=>{var t,l,i,r,o,a,d,c,s,u,m,x,v;let{progress:p,level:j,maxLevel:f,bonusInc:g,itemReq:Z,slot:w}=e,b=getMaterialCosts(Z,j,f,g,M),C=(0,h.ZX)(null==n?void 0:null===(t=n.account)||void 0===t?void 0:t.towers,j,g,null==e?void 0:e.index),T=null==n?void 0:null===(r=n.account)||void 0===r?void 0:null===(i=r.atoms)||void 0===i?void 0:null===(l=i.atoms)||void 0===l?void 0:l.find(e=>{let{name:t}=e;return"Carbon_-_Wizard_Maximizer"===t}),N=(0,h.Bt)(null==n?void 0:null===(a=n.account)||void 0===a?void 0:null===(o=a.towers)||void 0===o?void 0:o.totalLevels,f,null==T?void 0:T.level);f+=N;let O=(null==n?void 0:null===(s=n.account)||void 0===s?void 0:null===(c=s.lab.jewels)||void 0===c?void 0:null===(d=c.slice(3,7))||void 0===d?void 0:d.every(e=>{let{active:t}=e;return t}))?1:0,S=(null==n?void 0:null===(x=n.account)||void 0===x?void 0:null===(m=x.lab.jewels)||void 0===m?void 0:null===(u=m[3])||void 0===u?void 0:u.active)?1+O:0,B=S+(y?1:0),I=-1!==w&&w<B;if(I){let e=(new Date().getTime()-(null!==(v=null==n?void 0:n.lastUpdated)&&void 0!==v?v:0))/1e3;p+=(3+y/100)*(e/3600)*_}let W=(3+y/100)*_,k=(C-p)/W*36e5,D=(C-p)/_*36e5;return{...e,maxLevel:f,isMaxed:j===f,isSlotTrimmed:I,timeLeft:D,progress:p,buildCost:C,items:b,trimmedSlotSpeed:W,trimmedTimeLeft:k}})},[null==n?void 0:n.account]),O=(0,r.useMemo)(()=>{if("order"===l)return N;if("time"===l){let e=JSON.parse(JSON.stringify(N));return null==e?void 0:e.sort((e,t)=>{let n=(null==e?void 0:e.isSlotTrimmed)?null==e?void 0:e.trimmedTimeLeft:null==e?void 0:e.timeLeft,l=(null==t?void 0:t.isSlotTrimmed)?null==t?void 0:t.trimmedTimeLeft:null==t?void 0:t.timeLeft;return(null==e?void 0:e.isMaxed)?1:(null==t?void 0:t.isMaxed)?-1:n-l})}if("requirement"===l){let e=JSON.parse(JSON.stringify(N));return null==e?void 0:e.sort((e,t)=>{if(null==e?void 0:e.isMaxed)return 1;if(null==t?void 0:t.isMaxed)return -1;let n=(null==e?void 0:e.buildCost)-(null==e?void 0:e.progress),l=(null==t?void 0:t.buildCost)-(null==t?void 0:t.progress);return n-l})}},[l]),getBorderColor=e=>{let{isSlotTrimmed:t,inProgress:n}=e;return t?"warning.light":n?"success.light":""};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(j.PB,{title:"Idleon Toolbox | Buildings",description:"Keep track of your towers levels, bonuses and required materials for upgrades"}),(0,i.jsx)(a.Z,{variant:"h2",mb:3,children:"Buildings"}),(0,i.jsxs)(d.Z,{direction:"row",alignItems:"center",gap:3,flexWrap:"wrap",mb:2,children:[(0,i.jsxs)(w.Z,{children:[(0,i.jsx)(a.Z,{children:"Sort by"}),(0,i.jsxs)(c.Z,{value:l,sx:{mb:2},exclusive:!0,onChange:(e,t)=>(null==t?void 0:t.length)>0&&p(t),children:[(0,i.jsx)(s.Z,{value:"order",children:"Order"}),(0,i.jsx)(s.Z,{value:"time",children:"Time left"}),(0,i.jsx)(s.Z,{value:"requirement",children:"Build cost"})]})]}),(0,i.jsx)(CardTitleAndValue,{title:"Build Speed",value:(0,v.notateNumber)(_,"Big")}),(0,i.jsx)(CardTitleAndValue,{title:"Trimmed Build Speed",value:(0,v.notateNumber)((3+y/100)*_,"Big"),breakdown:[{name:"Base (jewel)",value:3},{name:"Atom",value:y/100}]})]}),(0,i.jsx)(d.Z,{direction:"row",flexWrap:"wrap",gap:3,children:null==O?void 0:O.map((e,t)=>{let{name:l,progress:r,level:o,maxLevel:c,inProgress:s,isSlotTrimmed:p,isMaxed:h,items:j,buildCost:g,timeLeft:w,trimmedTimeLeft:_}=e;return(0,i.jsx)(u.Z,{sx:{border:s||p?"1px solid":"",borderColor:getBorderColor(e),width:{xs:"100%",md:450},height:{md:165}},children:(0,i.jsx)(m.Z,{children:(0,i.jsxs)(d.Z,{direction:"row",justifyContent:"space-around",flexWrap:"wrap",children:[(0,i.jsxs)(d.Z,{alignItems:"center",sx:{textAlign:"center"},children:[(0,i.jsx)(a.Z,{children:(0,v.cleanUnderscore)(l)}),(0,i.jsx)(C,{src:"".concat(v.prefix,"data/ConTower").concat(null==e?void 0:e.index,".png"),alt:""}),(0,i.jsxs)(a.Z,{children:["Lv. ",o," / ",c]}),h?(0,i.jsx)(a.Z,{color:"success.light",children:"Maxed"}):(0,i.jsx)(Z.Z,{title:(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(a.Z,{children:["Progress: ",(0,v.numberWithCommas)(Math.floor(r))]}),(0,i.jsxs)(a.Z,{children:["Requirement: ",(0,v.numberWithCommas)(Math.floor(g))]})]}),children:(0,i.jsxs)(a.Z,{children:[(0,v.notateNumber)(r,"Big")," / ",(0,v.notateNumber)(g,"Big")]})})]}),h?null:(0,i.jsxs)(d.Z,{gap:2,divider:(0,i.jsx)(x.Z,{flexItem:!0}),children:[(0,i.jsxs)(d.Z,{children:[h?null:(0,i.jsx)(b.uQ,{title:"Non-trimmed",titleStyle:{color:!p&&"#81c784"},value:(0,i.jsx)(f.Z,{type:"countdown",staticTime:!0,placeholder:"Ready!",date:new Date().getTime()+w,lastUpdated:null==n?void 0:n.lastUpdated})}),h?null:(0,i.jsx)(b.uQ,{title:"Trimmed",titleStyle:{color:p&&"#81c784"},value:(0,i.jsx)(f.Z,{type:"countdown",placeholder:"Ready!",staticTime:!0,date:new Date().getTime()+_,lastUpdated:null==n?void 0:n.lastUpdated})})]}),h?null:(0,i.jsx)(d.Z,{direction:"row",gap:3,alignItems:"center",children:(0,i.jsx)(d.Z,{direction:"row",gap:1,children:null==j?void 0:j.map((e,t)=>{let{rawName:n,amount:r}=e;return(0,i.jsxs)(d.Z,{alignItems:"center",children:[(0,i.jsx)(T,{src:"".concat(v.prefix,"data/").concat(n,".png"),alt:""}),(0,i.jsx)(a.Z,{children:(0,v.notateNumber)(r,"Big")})]},"".concat(l,"-").concat(n,"-").concat(t))})})})]})]})})},"".concat(l,"-").concat(t))})})]})}}},function(e){e.O(0,[5127,1195,7896,8054,9774,2888,179],function(){return e(e.s=75558)}),_N_E=e.O()}]);