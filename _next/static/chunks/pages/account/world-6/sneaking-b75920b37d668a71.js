(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[472],{49425:function(n,e,t){"use strict";t.d(e,{Z:function(){return b}});var r=t(63366),i=t(87462),a=t(67294),o=t(86010),l=t(2097),c=t(94780);function useBadge(n){let{badgeContent:e,invisible:t=!1,max:r=99,showZero:i=!1}=n,a=(0,l.Z)({badgeContent:e,max:r}),o=t;!1!==t||0!==e||i||(o=!0);let{badgeContent:c,max:s=r}=o?a:n,d=c&&Number(c)>s?`${s}+`:c;return{badgeContent:c,invisible:o,max:s,displayValue:d}}var s=t(90631),d=t(90948),u=t(71657),g=t(98216),p=t(1588),h=t(34867);function getBadgeUtilityClass(n){return(0,h.Z)("MuiBadge",n)}let m=(0,p.Z)("MuiBadge",["root","badge","dot","standard","anchorOriginTopRight","anchorOriginBottomRight","anchorOriginTopLeft","anchorOriginBottomLeft","invisible","colorError","colorInfo","colorPrimary","colorSecondary","colorSuccess","colorWarning","overlapRectangular","overlapCircular","anchorOriginTopLeftCircular","anchorOriginTopLeftRectangular","anchorOriginTopRightCircular","anchorOriginTopRightRectangular","anchorOriginBottomLeftCircular","anchorOriginBottomLeftRectangular","anchorOriginBottomRightCircular","anchorOriginBottomRightRectangular"]);var x=t(85893);let f=["anchorOrigin","className","classes","component","components","componentsProps","children","overlap","color","invisible","max","badgeContent","slots","slotProps","showZero","variant"],useUtilityClasses=n=>{let{color:e,anchorOrigin:t,invisible:r,overlap:i,variant:a,classes:o={}}=n,l={root:["root"],badge:["badge",a,r&&"invisible",`anchorOrigin${(0,g.Z)(t.vertical)}${(0,g.Z)(t.horizontal)}`,`anchorOrigin${(0,g.Z)(t.vertical)}${(0,g.Z)(t.horizontal)}${(0,g.Z)(i)}`,`overlap${(0,g.Z)(i)}`,"default"!==e&&`color${(0,g.Z)(e)}`]};return(0,c.Z)(l,getBadgeUtilityClass,o)},v=(0,d.ZP)("span",{name:"MuiBadge",slot:"Root",overridesResolver:(n,e)=>e.root})({position:"relative",display:"inline-flex",verticalAlign:"middle",flexShrink:0}),j=(0,d.ZP)("span",{name:"MuiBadge",slot:"Badge",overridesResolver:(n,e)=>{let{ownerState:t}=n;return[e.badge,e[t.variant],e[`anchorOrigin${(0,g.Z)(t.anchorOrigin.vertical)}${(0,g.Z)(t.anchorOrigin.horizontal)}${(0,g.Z)(t.overlap)}`],"default"!==t.color&&e[`color${(0,g.Z)(t.color)}`],t.invisible&&e.invisible]}})(({theme:n,ownerState:e})=>(0,i.Z)({display:"flex",flexDirection:"row",flexWrap:"wrap",justifyContent:"center",alignContent:"center",alignItems:"center",position:"absolute",boxSizing:"border-box",fontFamily:n.typography.fontFamily,fontWeight:n.typography.fontWeightMedium,fontSize:n.typography.pxToRem(12),minWidth:20,lineHeight:1,padding:"0 6px",height:20,borderRadius:10,zIndex:1,transition:n.transitions.create("transform",{easing:n.transitions.easing.easeInOut,duration:n.transitions.duration.enteringScreen})},"default"!==e.color&&{backgroundColor:(n.vars||n).palette[e.color].main,color:(n.vars||n).palette[e.color].contrastText},"dot"===e.variant&&{borderRadius:4,height:8,minWidth:8,padding:0},"top"===e.anchorOrigin.vertical&&"right"===e.anchorOrigin.horizontal&&"rectangular"===e.overlap&&{top:0,right:0,transform:"scale(1) translate(50%, -50%)",transformOrigin:"100% 0%",[`&.${m.invisible}`]:{transform:"scale(0) translate(50%, -50%)"}},"bottom"===e.anchorOrigin.vertical&&"right"===e.anchorOrigin.horizontal&&"rectangular"===e.overlap&&{bottom:0,right:0,transform:"scale(1) translate(50%, 50%)",transformOrigin:"100% 100%",[`&.${m.invisible}`]:{transform:"scale(0) translate(50%, 50%)"}},"top"===e.anchorOrigin.vertical&&"left"===e.anchorOrigin.horizontal&&"rectangular"===e.overlap&&{top:0,left:0,transform:"scale(1) translate(-50%, -50%)",transformOrigin:"0% 0%",[`&.${m.invisible}`]:{transform:"scale(0) translate(-50%, -50%)"}},"bottom"===e.anchorOrigin.vertical&&"left"===e.anchorOrigin.horizontal&&"rectangular"===e.overlap&&{bottom:0,left:0,transform:"scale(1) translate(-50%, 50%)",transformOrigin:"0% 100%",[`&.${m.invisible}`]:{transform:"scale(0) translate(-50%, 50%)"}},"top"===e.anchorOrigin.vertical&&"right"===e.anchorOrigin.horizontal&&"circular"===e.overlap&&{top:"14%",right:"14%",transform:"scale(1) translate(50%, -50%)",transformOrigin:"100% 0%",[`&.${m.invisible}`]:{transform:"scale(0) translate(50%, -50%)"}},"bottom"===e.anchorOrigin.vertical&&"right"===e.anchorOrigin.horizontal&&"circular"===e.overlap&&{bottom:"14%",right:"14%",transform:"scale(1) translate(50%, 50%)",transformOrigin:"100% 100%",[`&.${m.invisible}`]:{transform:"scale(0) translate(50%, 50%)"}},"top"===e.anchorOrigin.vertical&&"left"===e.anchorOrigin.horizontal&&"circular"===e.overlap&&{top:"14%",left:"14%",transform:"scale(1) translate(-50%, -50%)",transformOrigin:"0% 0%",[`&.${m.invisible}`]:{transform:"scale(0) translate(-50%, -50%)"}},"bottom"===e.anchorOrigin.vertical&&"left"===e.anchorOrigin.horizontal&&"circular"===e.overlap&&{bottom:"14%",left:"14%",transform:"scale(1) translate(-50%, 50%)",transformOrigin:"0% 100%",[`&.${m.invisible}`]:{transform:"scale(0) translate(-50%, 50%)"}},e.invisible&&{transition:n.transitions.create("transform",{easing:n.transitions.easing.easeInOut,duration:n.transitions.duration.leavingScreen})})),Z=a.forwardRef(function(n,e){var t,a,c,d,g,p;let h=(0,u.Z)({props:n,name:"MuiBadge"}),{anchorOrigin:m={vertical:"top",horizontal:"right"},className:Z,component:b,components:w={},componentsProps:O={},children:y,overlap:C="rectangular",color:I="default",invisible:_=!1,max:B=99,badgeContent:N,slots:k,slotProps:T,showZero:S=!1,variant:W="standard"}=h,U=(0,r.Z)(h,f),{badgeContent:R,invisible:z,max:$,displayValue:P}=useBadge({max:B,invisible:_,badgeContent:N,showZero:S}),E=(0,l.Z)({anchorOrigin:m,color:I,overlap:C,variant:W,badgeContent:N}),F=z||null==R&&"dot"!==W,{color:M=I,overlap:A=C,anchorOrigin:D=m,variant:L=W}=F?E:h,V="dot"!==L?P:void 0,J=(0,i.Z)({},h,{badgeContent:R,invisible:F,max:$,displayValue:V,showZero:S,anchorOrigin:D,color:M,overlap:A,variant:L}),Y=useUtilityClasses(J),X=null!=(t=null!=(a=null==k?void 0:k.root)?a:w.Root)?t:v,q=null!=(c=null!=(d=null==k?void 0:k.badge)?d:w.Badge)?c:j,G=null!=(g=null==T?void 0:T.root)?g:O.root,H=null!=(p=null==T?void 0:T.badge)?p:O.badge,K=(0,s.Z)({elementType:X,externalSlotProps:G,externalForwardedProps:U,additionalProps:{ref:e,as:b},ownerState:J,className:(0,o.Z)(null==G?void 0:G.className,Y.root,Z)}),Q=(0,s.Z)({elementType:q,externalSlotProps:H,ownerState:J,className:(0,o.Z)(Y.badge,null==H?void 0:H.className)});return(0,x.jsxs)(X,(0,i.Z)({},K,{children:[y,(0,x.jsx)(q,(0,i.Z)({},Q,{children:V}))]}))});var b=Z},2097:function(n,e,t){"use strict";var r=t(67294);e.Z=n=>{let e=r.useRef({});return r.useEffect(()=>{e.current=n}),e.current}},13829:function(n,e,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/world-6/sneaking",function(){return t(88993)}])},30509:function(n,e,t){"use strict";var r=t(85893),i=t(67294),a=t(98396),o=t(11703),l=t(40044);e.Z=n=>{let{tabs:e,children:t,onTabChange:c,forceScroll:s}=n,[d,u]=(0,i.useState)(0),g=(0,a.Z)(n=>n.breakpoints.down("md"),{noSsr:!0}),p=Array.isArray(t)?t:[t];return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(o.Z,{centered:!g||g&&e.length<4,scrollButtons:!0,allowScrollButtonsMobile:!0,sx:{marginBottom:3},variant:g&&e.length>4||s?"scrollable":"standard",value:d,onChange:(n,e)=>{u(e),c&&c(e)},children:null==e?void 0:e.map((n,e)=>(0,r.jsx)(l.Z,{wrapped:!0,label:n},"".concat(n,"-").concat(e)))}),c?t:null==p?void 0:p.map((n,e)=>e===d?n:null)]})}},64885:function(n,e,t){"use strict";t.d(e,{Gr:function(){return MissingData},M5:function(){return x},Wd:function(){return PlayersList},Ye:function(){return CardTitleAndValue},iy:function(){return CardAndBorder},j8:function(){return f},tq:function(){return Breakdown},u3:function(){return TalentTooltip},uQ:function(){return TitleAndValue},wD:function(){return CenteredStack}});var r=t(82729),i=t(85893),a=t(67294),o=t(30925),l=t(51233),c=t(15861),s=t(49425),d=t(66242),u=t(44267),g=t(67720),p=t(61599),h=t(2511),m=t(54685);function _templateObject(){let n=(0,r._)(["\n  & .MuiBadge-badge {\n    background-color: #d5d5dc;\n    color: rgba(0, 0, 0, 0.87);\n  }\n"]);return _templateObject=function(){return n},n}function _templateObject1(){let n=(0,r._)(["\n  height: 20px;\n  object-fit: contain;\n"]);return _templateObject1=function(){return n},n}function _templateObject2(){let n=(0,r._)(["\n  width: 56px;\n  height: 72px;\n  object-fit: contain;\n  opacity: ",";\n"]);return _templateObject2=function(){return n},n}function _templateObject3(){let n=(0,r._)(["\n  position: absolute;\n  left: 50%;\n  top: -3px;\n  pointer-events: none;\n  transform: translateX(-50%);\n"]);return _templateObject3=function(){return n},n}let x=(0,a.forwardRef)((n,e)=>{let{stat:t,icon:r,img:a,title:s="",...d}=n;return(0,i.jsx)(h.Z,{title:s,children:(0,i.jsxs)(l.Z,{alignItems:"center",...d,ref:e,style:{position:"relative",width:"fit-content"},children:[(0,i.jsx)("img",{...a,src:"".concat(o.prefix,"data/").concat(r,".png"),alt:""}),(0,i.jsx)(c.Z,{variant:"body1",component:"span",children:t})]})})});x.displayName="IconWithText";let TitleAndValue=n=>{let{title:e,value:t,boldTitle:r,titleStyle:a={},valueStyle:o={}}=n;return(0,i.jsxs)(l.Z,{direction:"row",flexWrap:"wrap",alignItems:"center",children:[e?(0,i.jsxs)(c.Z,{sx:a,fontWeight:r?"bold":500,component:"span",children:[e,":\xa0"]}):null,(0,i.jsx)(c.Z,{fontSize:15,component:"span",sx:o,children:t})]})},f=(0,p.Z)(s.Z)(_templateObject()),CardAndBorder=n=>{let{cardName:e,stars:t,cardIndex:r,name:a,variant:l,rawName:c,amount:s,nextLevelReq:d}=n,u="cardSet"===l?"".concat(o.prefix,"data/").concat(c,".png"):"".concat(o.prefix,"data/2Cards").concat(r,".png");return(0,i.jsxs)(i.Fragment,{children:[t>0?(0,i.jsx)(Z,{src:"".concat(o.prefix,"data/CardEquipBorder").concat(t,".png"),alt:""}):null,(0,i.jsx)(h.Z,{title:(0,i.jsx)(CardTooltip,{...n,cardName:"cardSet"===l?a:e,nextLevelReq:d,amount:s}),children:(0,i.jsx)(j,{isCardSet:"cardSet"===l,amount:s,src:u,alt:""})})]})},CardTooltip=n=>{let{displayName:e,effect:t,bonus:r,stars:a,showInfo:s,nextLevelReq:d,amount:u}=n,g=r;return s&&(g=(0,m.BZ)({bonus:r,stars:a})),(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(c.Z,{fontWeight:"bold",variant:"h6",children:(0,o.cleanUnderscore)(e)}),(0,i.jsx)(c.Z,{children:(0,o.cleanUnderscore)(t.replace("{",g))}),s?(0,i.jsx)(l.Z,{mt:1,direction:"row",gap:1,flexWrap:"wrap",children:[1,2,3,4,5,6].map((n,t)=>(0,i.jsxs)(l.Z,{alignItems:"center",justifyContent:"space-between",children:[0===t?(0,i.jsx)(c.Z,{children:"Base"}):(0,i.jsx)(v,{src:"".concat(o.prefix,"etc/Star").concat(t,".png"),alt:""}),(0,i.jsx)(c.Z,{children:r*(t+1)})]},"".concat(e,"-").concat(t)))}):null,u>=d?(0,i.jsxs)(l.Z,{children:["You've collected ",(0,o.numberWithCommas)(u)," cards"]}):d>0?(0,i.jsxs)(l.Z,{children:["Progress: ",(0,o.numberWithCommas)(u)," / ",(0,o.numberWithCommas)(d)]}):null]})},v=p.Z.img(_templateObject1()),j=p.Z.img(_templateObject2(),n=>{let{amount:e,isCardSet:t}=n;return e||t?1:.5}),Z=p.Z.img(_templateObject3()),TalentTooltip=n=>{let{level:e,funcX:t,x1:r,x2:a,funcY:s,y1:d,y2:u,description:g,name:p,talentId:h}=n,m=e>0?(0,o.growth)(t,e,r,a):0,x=e>0?(0,o.growth)(s,e,d,u):0;return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(l.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,i.jsx)("img",{src:"".concat(o.prefix,"data/UISkillIcon").concat(h,".png"),alt:""}),(0,i.jsx)(c.Z,{fontWeight:"bold",variant:"h6",children:(0,o.cleanUnderscore)(p)})]}),(0,i.jsx)(c.Z,{children:(0,o.cleanUnderscore)(g).replace("{",m).replace("}",x)})]})},PlayersList=n=>{let{players:e,characters:t}=n;return(0,i.jsx)(l.Z,{gap:1,direction:"row",children:e.map(n=>{var e,r;let{index:a}=n;return(0,i.jsx)(h.Z,{title:null==t?void 0:null===(e=t[a])||void 0===e?void 0:e.name,children:(0,i.jsx)("img",{style:{width:24,height:24},src:"".concat(o.prefix,"data/ClassIcons").concat(null==t?void 0:null===(r=t[a])||void 0===r?void 0:r.classIndex,".png"),alt:""})},name+"-head-"+a)})})},MissingData=n=>{let{name:e}=n;return(0,i.jsxs)(c.Z,{variant:"h3",children:["Your account is missing data for ",e]})},CardTitleAndValue=n=>{let{variant:e,raised:t,cardSx:r,imgStyle:a,title:s,value:g,children:p,icon:m,tooltipTitle:x,stackProps:f}=n;return(0,i.jsx)(h.Z,{title:x||"",children:(0,i.jsx)(d.Z,{variant:e,raised:t,sx:{my:{xs:0,md:3},width:"fit-content",...r},children:(0,i.jsx)(u.Z,{children:(0,i.jsxs)(l.Z,{sx:{display:f?"flex":"block",...f||{}},children:[(0,i.jsx)(c.Z,{sx:{fontSize:14},color:"text.secondary",gutterBottom:!0,children:s}),g?m?(0,i.jsxs)(l.Z,{direction:"row",gap:2,alignItems:"center",children:[(0,i.jsx)("img",{style:{objectFit:"contain",...a},src:"".concat(o.prefix).concat(m),alt:""}),(0,i.jsx)(c.Z,{children:g})]}):(0,i.jsx)(c.Z,{children:g}):p]})})})})},Breakdown=n=>{let{breakdown:e,titleStyle:t={},notation:r="Big"}=n;return(0,i.jsx)(i.Fragment,{children:null==e?void 0:e.map((n,e)=>{let{name:a,value:l,title:s}=n;return s?(0,i.jsx)(c.Z,{sx:{fontWeight:500},children:s},"".concat(a,"-").concat(e)):a?(0,i.jsx)(TitleAndValue,{titleStyle:{width:120,...t},title:a,value:isNaN(l)?l:(0,o.notateNumber)(l,r)},"".concat(a,"-").concat(e)):(0,i.jsx)(g.Z,{sx:{my:1,bgcolor:"black"}},"".concat(a,"-").concat(e))})})},CenteredStack=n=>{let{direction:e="row",children:t}=n;return(0,i.jsx)(l.Z,{gap:1,direction:e,alignItems:"center",children:t})}},88993:function(n,e,t){"use strict";t.r(e),t.d(e,{default:function(){return sneaking}});var r=t(85893),i=t(67294),a=t(21480),o=t(30509),l=t(51233),c=t(66242),s=t(44267),d=t(15861),u=t(30925),sneaking_JadeEmporium=n=>{let{upgrades:e}=n;return(0,r.jsx)(l.Z,{direction:"row",gap:2,flexWrap:"wrap",children:null==e?void 0:e.map((n,e)=>{let{name:t,description:i,unlocked:a,cost:o,x3:g}=n;return(0,r.jsx)(c.Z,{sx:{width:340,border:a?"1px solid":"",borderColor:a?"success.main":""},children:(0,r.jsxs)(s.Z,{children:[(0,r.jsxs)(l.Z,{direction:"row",gap:1,alignItems:"center",children:[(0,r.jsx)("img",{width:64,src:"".concat(u.prefix,"data/NjJupg").concat(g,".png"),alt:"jade_coin"}),(0,r.jsx)(d.Z,{variant:"subtitle1",children:(0,u.cleanUnderscore)(t)})]}),(0,r.jsx)(d.Z,{mt:1,variant:"body1",children:(0,u.cleanUnderscore)(i)}),(0,r.jsxs)(l.Z,{direction:"row",alignItems:"center",gap:1,mt:1,children:[(0,r.jsx)("img",{width:19,height:19,src:"".concat(u.prefix,"etc/jade_coin.png"),alt:"jade_coin"}),(0,u.notateNumber)(o,"Big")]})]})},t+e)})})},g=t(64885),sneaking_Charms=n=>{let{charms:e}=n;return(0,r.jsx)(l.Z,{direction:"row",flexWrap:"wrap",gap:2,children:e.map((n,e)=>{let{rawName:t,name:i,bonus:a,x3:o,unlocked:g,value:p}=n;return a=(a=a.replace(/}/,(0,u.notateNumber)(p,"MultiplierInfo"))).replace(/{/,p),(0,r.jsx)(c.Z,{sx:{width:250,border:g?"1px solid":"",borderColor:g?"success.main":""},children:(0,r.jsx)(s.Z,{children:(0,r.jsxs)(l.Z,{direction:"row",gap:1,children:[(0,r.jsx)("img",{style:{objectFit:"contain"},src:"".concat(u.prefix,"data/NjTrP").concat(e,".png"),alt:""}),(0,r.jsxs)(l.Z,{children:[(0,r.jsx)(d.Z,{children:(0,u.cleanUnderscore)(i)}),(0,r.jsx)(d.Z,{children:(0,u.cleanUnderscore)(a)})]})]})})},"charm-"+e)})})},p=t(67720),h=t(49425),m=t(2511),x=t(70473);let f=null===x.ninjaExtraInfo||void 0===x.ninjaExtraInfo?void 0:x.ninjaExtraInfo[3].split(" "),getActivityIcon=(n,e,t)=>n<0?"KO":0!==n?1===e&&t?"Breaching":0===e?"Untying":"Sneaking":"Tied",getDescription=n=>{let e,{description:t,value:r=0,type:i,subType:a}=n;return e=null==t?void 0:t.replace(/{/g,(0,u.notateNumber)(r,"Big")).replace(/}/g,(0,u.notateNumber)(1+r/100,"MultiplierInfo")),1===i&&(e=1===a?"Base damage: ".concat((0,u.notateNumber)(r)):"Base rate: ".concat((0,u.notateNumber)(r))),e};var sneaking_PlayersInventory=n=>{let{players:e,characters:t,account:i,dropList:a,inventory:o,doorsCurrentHp:g}=n;return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(l.Z,{direction:"row",flexWrap:"wrap",gap:2,sx:{maxWidth:1280},children:null==e?void 0:e.map((n,e)=>{var i,o,x,v,j,Z,b;let{equipment:w,floor:O,activityInfo:y}=n,C=(null==w?void 0:null===(i=w[1])||void 0===i?void 0:i.rawName)!=="Blank"&&(null==w?void 0:null===(o=w[1])||void 0===o?void 0:o.type),I=(null==f?void 0:f[O])-(null==g?void 0:g[O]),_=I>0,B=getActivityIcon(y,C,_);return(0,r.jsxs)(l.Z,{direction:"row",gap:1,flexWrap:"wrap",children:[(0,r.jsx)(c.Z,{sx:{display:"flex",alignItems:"center",width:200},children:(0,r.jsxs)(s.Z,{children:[(0,r.jsx)(d.Z,{children:null==t?void 0:null===(x=t[e])||void 0===x?void 0:x.name}),(0,r.jsxs)(l.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,r.jsxs)(l.Z,{direction:"row",gap:1,children:[(0,r.jsx)("img",{width:24,src:"".concat(u.prefix,"data/ClassIcons58.png"),alt:""}),(0,r.jsx)(d.Z,{children:null==t?void 0:null===(Z=t[e])||void 0===Z?void 0:null===(j=Z.skillsInfo)||void 0===j?void 0:null===(v=j.sneaking)||void 0===v?void 0:v.level})]}),(0,r.jsx)(p.Z,{flexItem:!0,orientation:"vertical"}),(0,r.jsxs)(l.Z,{children:[(0,r.jsxs)(l.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,r.jsx)(m.Z,{title:"",children:(0,r.jsx)("img",{style:{objectFit:"contain"},width:24,height:24,src:"".concat(u.prefix,"etc/").concat(B,"_Ninja.png"),alt:""})}),(0,r.jsxs)(d.Z,{variant:"caption",children:["Floor ",O+1]})]}),_?(0,r.jsxs)(l.Z,{direction:"row",alignItems:"center",children:[(0,r.jsx)("img",{width:24,src:"".concat(u.prefix,"data/NjD").concat(O,".png"),alt:""}),(0,r.jsxs)(d.Z,{sx:{flexBasis:"100%"},variant:"caption",children:[(0,u.notateNumber)(I,"Big")," / ",(0,u.notateNumber)(null==f?void 0:f[O],"Big")]})]}):null]})]}),(0,r.jsx)(l.Z,{mt:1,gap:1,direction:"row",children:null==a?void 0:null===(b=a[O-1])||void 0===b?void 0:b.map((n,e)=>{let{rawName:t,description:i,value:a,type:o,subType:l}=n;return 0!==o?(0,r.jsx)(m.Z,{title:(0,u.cleanUnderscore)(getDescription({description:i,value:a,type:o,subType:l})),children:(0,r.jsx)("img",{width:24,src:"".concat(u.prefix,"data/").concat(t,".png"),alt:""})},"droplist-".concat(t,"-").concat(e)):null})})]})}),null==w?void 0:w.map((n,e)=>{let{name:t,rawName:i,level:a,description:o,value:l,type:d,subType:g}=n;return o=getDescription({description:o,value:l,type:d,subType:g}),(0,r.jsx)(m.Z,{title:"0"===o?"":(0,u.cleanUnderscore)(o),children:(0,r.jsx)(c.Z,{sx:{display:"flex",alignItems:"center",justifyContent:"center",width:100},children:(0,r.jsx)(s.Z,{children:(0,r.jsx)(h.Z,{anchorOrigin:{vertical:"top",horizontal:"right"},badgeContent:null!=a?a:" ",color:"primary",children:(0,r.jsx)("img",{width:32,src:"".concat(u.prefix,"data/").concat(i,".png"),alt:""})},e+t)})})},e+t)})]},"player-"+e)})}),(0,r.jsx)("h4",{children:"Inventory"}),(0,r.jsx)(l.Z,{direction:"row",flexWrap:"wrap",gap:1,sx:{maxWidth:936},children:null==o?void 0:o.map((n,e)=>{let{rawName:t,level:i,description:a,value:o,type:l,subType:d}=n;return a=getDescription({description:a,value:o,type:l,subType:d}),(0,r.jsx)(m.Z,{title:"0"===a?"":(0,u.cleanUnderscore)(a),children:(0,r.jsx)(c.Z,{children:(0,r.jsx)(s.Z,{children:(0,r.jsx)(h.Z,{size:"small",anchorOrigin:{vertical:"top",horizontal:"right"},badgeContent:null!=i?i:" ",color:"primary",children:(0,r.jsx)("img",{width:32,src:"".concat(u.prefix,"data/").concat(t,".png"),alt:""})})})})},"inventory-"+t+e)})})]})},sneaking_Upgrades=n=>{let{upgrades:e}=n;return(0,r.jsx)(l.Z,{direction:"row",flexWrap:"wrap",gap:1,children:null==e?void 0:e.map((n,e)=>{let{rawName:t,level:i,name:a,description:o,modifier:g}=n,p=(null==o?void 0:o.includes("{"))?i*g:(0,u.notateNumber)(1+i*g/100,"MultiplierInfo");return"Name"!==a?(0,r.jsx)(c.Z,{sx:{width:220},children:(0,r.jsxs)(s.Z,{children:[(0,r.jsxs)(l.Z,{direction:"row",gap:1,children:[(0,r.jsx)("img",{width:32,src:"".concat(u.prefix,"data/NjUpgI").concat(e+1,".png"),alt:""}),(0,r.jsx)(d.Z,{children:(0,u.cleanUnderscore)(a)})]}),(0,r.jsx)(d.Z,{children:(0,u.cleanUnderscore)(o.replace(/}|{/g,p))})]})},"upgrade-"+e):null})})},v=t(2962),sneaking=()=>{var n;let{state:e}=(0,i.useContext)(a.I),{jadeEmporium:t,jadeCoins:c,players:s,inventory:d,dropList:p,pristineCharms:h,upgrades:m,doorsCurrentHp:x,gemStones:f}=(null==e?void 0:null===(n=e.account)||void 0===n?void 0:n.sneaking)||{};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(v.PB,{title:"Sneaking | Idleon Toolbox",description:"Keep track of your ninja and jade upgrades and much more bonuses"}),(0,r.jsxs)(l.Z,{direction:"row",alignItems:"center",gap:1,flexWrap:"wrap",children:[(0,r.jsx)(g.Ye,{title:"Jade coins",value:(0,u.notateNumber)(c),icon:"etc/jade_coin.png"}),null==f?void 0:f.map((n,e)=>{let{bonus:t,rawName:i}=n;return(0,r.jsx)(g.Ye,{title:"Gemstone ".concat(e+1),value:"".concat((0,u.notateNumber)(t),"%"),imgStyle:{width:19,height:19},icon:"data/".concat(i,".png")},"gemstone-"+e)})]}),(0,r.jsxs)(o.Z,{tabs:["Inventory","Jade Emporium","Upgrades","Charms"],children:[(0,r.jsx)(sneaking_PlayersInventory,{players:s,dropList:p,inventory:d,characters:null==e?void 0:e.characters,account:null==e?void 0:e.account,doorsCurrentHp:x}),(0,r.jsx)(sneaking_JadeEmporium,{upgrades:t}),(0,r.jsx)(sneaking_Upgrades,{upgrades:m}),(0,r.jsx)(sneaking_Charms,{charms:h})]})]})}}},function(n){n.O(0,[9774,2888,179],function(){return n(n.s=13829)}),_N_E=n.O()}]);