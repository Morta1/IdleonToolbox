!function(){try{var t="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},e=(new t.Error).stack;e&&(t._sentryDebugIds=t._sentryDebugIds||{},t._sentryDebugIds[e]="479ae540-b76b-4528-b113-968935c4cadc",t._sentryDebugIdIdentifier="sentry-dbid-479ae540-b76b-4528-b113-968935c4cadc")}catch(t){}}(),(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7764],{49425:function(t,e,n){"use strict";n.d(e,{Z:function(){return b}});var r=n(63366),a=n(87462),i=n(67294),o=n(86010),l=n(2097),s=n(94780);function useBadge(t){let{badgeContent:e,invisible:n=!1,max:r=99,showZero:a=!1}=t,i=(0,l.Z)({badgeContent:e,max:r}),o=n;!1!==n||0!==e||a||(o=!0);let{badgeContent:s,max:c=r}=o?i:t,d=s&&Number(s)>c?`${c}+`:s;return{badgeContent:s,invisible:o,max:c,displayValue:d}}var c=n(90631),d=n(90948),u=n(71657),g=n(98216),p=n(1588),m=n(34867);function getBadgeUtilityClass(t){return(0,m.Z)("MuiBadge",t)}let h=(0,p.Z)("MuiBadge",["root","badge","dot","standard","anchorOriginTopRight","anchorOriginBottomRight","anchorOriginTopLeft","anchorOriginBottomLeft","invisible","colorError","colorInfo","colorPrimary","colorSecondary","colorSuccess","colorWarning","overlapRectangular","overlapCircular","anchorOriginTopLeftCircular","anchorOriginTopLeftRectangular","anchorOriginTopRightCircular","anchorOriginTopRightRectangular","anchorOriginBottomLeftCircular","anchorOriginBottomLeftRectangular","anchorOriginBottomRightCircular","anchorOriginBottomRightRectangular"]);var f=n(85893);let x=["anchorOrigin","className","classes","component","components","componentsProps","children","overlap","color","invisible","max","badgeContent","slots","slotProps","showZero","variant"],useUtilityClasses=t=>{let{color:e,anchorOrigin:n,invisible:r,overlap:a,variant:i,classes:o={}}=t,l={root:["root"],badge:["badge",i,r&&"invisible",`anchorOrigin${(0,g.Z)(n.vertical)}${(0,g.Z)(n.horizontal)}`,`anchorOrigin${(0,g.Z)(n.vertical)}${(0,g.Z)(n.horizontal)}${(0,g.Z)(a)}`,`overlap${(0,g.Z)(a)}`,"default"!==e&&`color${(0,g.Z)(e)}`]};return(0,s.Z)(l,getBadgeUtilityClass,o)},y=(0,d.ZP)("span",{name:"MuiBadge",slot:"Root",overridesResolver:(t,e)=>e.root})({position:"relative",display:"inline-flex",verticalAlign:"middle",flexShrink:0}),v=(0,d.ZP)("span",{name:"MuiBadge",slot:"Badge",overridesResolver:(t,e)=>{let{ownerState:n}=t;return[e.badge,e[n.variant],e[`anchorOrigin${(0,g.Z)(n.anchorOrigin.vertical)}${(0,g.Z)(n.anchorOrigin.horizontal)}${(0,g.Z)(n.overlap)}`],"default"!==n.color&&e[`color${(0,g.Z)(n.color)}`],n.invisible&&e.invisible]}})(({theme:t,ownerState:e})=>(0,a.Z)({display:"flex",flexDirection:"row",flexWrap:"wrap",justifyContent:"center",alignContent:"center",alignItems:"center",position:"absolute",boxSizing:"border-box",fontFamily:t.typography.fontFamily,fontWeight:t.typography.fontWeightMedium,fontSize:t.typography.pxToRem(12),minWidth:20,lineHeight:1,padding:"0 6px",height:20,borderRadius:10,zIndex:1,transition:t.transitions.create("transform",{easing:t.transitions.easing.easeInOut,duration:t.transitions.duration.enteringScreen})},"default"!==e.color&&{backgroundColor:(t.vars||t).palette[e.color].main,color:(t.vars||t).palette[e.color].contrastText},"dot"===e.variant&&{borderRadius:4,height:8,minWidth:8,padding:0},"top"===e.anchorOrigin.vertical&&"right"===e.anchorOrigin.horizontal&&"rectangular"===e.overlap&&{top:0,right:0,transform:"scale(1) translate(50%, -50%)",transformOrigin:"100% 0%",[`&.${h.invisible}`]:{transform:"scale(0) translate(50%, -50%)"}},"bottom"===e.anchorOrigin.vertical&&"right"===e.anchorOrigin.horizontal&&"rectangular"===e.overlap&&{bottom:0,right:0,transform:"scale(1) translate(50%, 50%)",transformOrigin:"100% 100%",[`&.${h.invisible}`]:{transform:"scale(0) translate(50%, 50%)"}},"top"===e.anchorOrigin.vertical&&"left"===e.anchorOrigin.horizontal&&"rectangular"===e.overlap&&{top:0,left:0,transform:"scale(1) translate(-50%, -50%)",transformOrigin:"0% 0%",[`&.${h.invisible}`]:{transform:"scale(0) translate(-50%, -50%)"}},"bottom"===e.anchorOrigin.vertical&&"left"===e.anchorOrigin.horizontal&&"rectangular"===e.overlap&&{bottom:0,left:0,transform:"scale(1) translate(-50%, 50%)",transformOrigin:"0% 100%",[`&.${h.invisible}`]:{transform:"scale(0) translate(-50%, 50%)"}},"top"===e.anchorOrigin.vertical&&"right"===e.anchorOrigin.horizontal&&"circular"===e.overlap&&{top:"14%",right:"14%",transform:"scale(1) translate(50%, -50%)",transformOrigin:"100% 0%",[`&.${h.invisible}`]:{transform:"scale(0) translate(50%, -50%)"}},"bottom"===e.anchorOrigin.vertical&&"right"===e.anchorOrigin.horizontal&&"circular"===e.overlap&&{bottom:"14%",right:"14%",transform:"scale(1) translate(50%, 50%)",transformOrigin:"100% 100%",[`&.${h.invisible}`]:{transform:"scale(0) translate(50%, 50%)"}},"top"===e.anchorOrigin.vertical&&"left"===e.anchorOrigin.horizontal&&"circular"===e.overlap&&{top:"14%",left:"14%",transform:"scale(1) translate(-50%, -50%)",transformOrigin:"0% 0%",[`&.${h.invisible}`]:{transform:"scale(0) translate(-50%, -50%)"}},"bottom"===e.anchorOrigin.vertical&&"left"===e.anchorOrigin.horizontal&&"circular"===e.overlap&&{bottom:"14%",left:"14%",transform:"scale(1) translate(-50%, 50%)",transformOrigin:"0% 100%",[`&.${h.invisible}`]:{transform:"scale(0) translate(-50%, 50%)"}},e.invisible&&{transition:t.transitions.create("transform",{easing:t.transitions.easing.easeInOut,duration:t.transitions.duration.leavingScreen})})),j=i.forwardRef(function(t,e){var n,i,s,d,g,p;let m=(0,u.Z)({props:t,name:"MuiBadge"}),{anchorOrigin:h={vertical:"top",horizontal:"right"},className:j,component:b,components:Z={},componentsProps:O={},children:C,overlap:w="rectangular",color:T="default",invisible:_=!1,max:B=99,badgeContent:S,slots:I,slotProps:R,showZero:k=!1,variant:N="standard"}=m,$=(0,r.Z)(m,x),{badgeContent:W,invisible:z,max:V,displayValue:P}=useBadge({max:B,invisible:_,badgeContent:S,showZero:k}),M=(0,l.Z)({anchorOrigin:h,color:T,overlap:w,variant:N,badgeContent:S}),F=z||null==W&&"dot"!==N,{color:A=T,overlap:E=w,anchorOrigin:U=h,variant:L=N}=F?M:m,D="dot"!==L?P:void 0,q=(0,a.Z)({},m,{badgeContent:W,invisible:F,max:V,displayValue:D,showZero:k,anchorOrigin:U,color:A,overlap:E,variant:L}),Y=useUtilityClasses(q),X=null!=(n=null!=(i=null==I?void 0:I.root)?i:Z.Root)?n:y,G=null!=(s=null!=(d=null==I?void 0:I.badge)?d:Z.Badge)?s:v,H=null!=(g=null==R?void 0:R.root)?g:O.root,Q=null!=(p=null==R?void 0:R.badge)?p:O.badge,J=(0,c.Z)({elementType:X,externalSlotProps:H,externalForwardedProps:$,additionalProps:{ref:e,as:b},ownerState:q,className:(0,o.Z)(null==H?void 0:H.className,Y.root,j)}),K=(0,c.Z)({elementType:G,externalSlotProps:Q,ownerState:q,className:(0,o.Z)(Y.badge,null==Q?void 0:Q.className)});return(0,f.jsxs)(X,(0,a.Z)({},J,{children:[C,(0,f.jsx)(G,(0,a.Z)({},K,{children:D}))]}))});var b=j},2097:function(t,e,n){"use strict";var r=n(67294);e.Z=t=>{let e=r.useRef({});return r.useEffect(()=>{e.current=t}),e.current}},46579:function(t,e,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/world-2/vials",function(){return n(43247)}])},27496:function(t,e,n){"use strict";n.d(e,{Gr:function(){return MissingData},M5:function(){return f},Wd:function(){return PlayersList},Ye:function(){return CardTitleAndValue},iy:function(){return CardAndBorder},j8:function(){return x},tq:function(){return Breakdown},u3:function(){return TalentTooltip},uQ:function(){return TitleAndValue},wD:function(){return CenteredStack}});var r=n(82729),a=n(85893),i=n(67294),o=n(65298),l=n(51233),s=n(23972),c=n(49425),d=n(66242),u=n(44267),g=n(67720),p=n(61599),m=n(74612),h=n(9751);function _templateObject(){let t=(0,r._)(["\n  & .MuiBadge-badge {\n    background-color: #d5d5dc;\n    color: rgba(0, 0, 0, 0.87);\n  }\n"]);return _templateObject=function(){return t},t}function _templateObject1(){let t=(0,r._)(["\n  height: 20px;\n  object-fit: contain;\n"]);return _templateObject1=function(){return t},t}function _templateObject2(){let t=(0,r._)(["\n  width: 56px;\n  height: 72px;\n  object-fit: contain;\n  opacity: ",";\n"]);return _templateObject2=function(){return t},t}function _templateObject3(){let t=(0,r._)(["\n  position: absolute;\n  left: 50%;\n  top: -3px;\n  pointer-events: none;\n  transform: translateX(-50%);\n"]);return _templateObject3=function(){return t},t}let f=(0,i.forwardRef)((t,e)=>{let{stat:n,icon:r,img:i,title:c="",...d}=t;return(0,a.jsx)(m.Z,{title:c,children:(0,a.jsxs)(l.Z,{alignItems:"center",...d,ref:e,style:{position:"relative",width:"fit-content"},children:[(0,a.jsx)("img",{...i,src:"".concat(o.prefix,"data/").concat(r,".png"),alt:""}),(0,a.jsx)(s.Z,{variant:"body1",component:"span",children:n})]})})});f.displayName="IconWithText";let TitleAndValue=t=>{let{title:e,value:n,boldTitle:r,titleStyle:i={},valueStyle:o={}}=t;return(0,a.jsxs)(l.Z,{direction:"row",flexWrap:"wrap",alignItems:"center","data-sentry-element":"Stack","data-sentry-component":"TitleAndValue","data-sentry-source-file":"styles.jsx",children:[e?(0,a.jsxs)(s.Z,{sx:i,fontWeight:r?"bold":500,component:"span",children:[e,":\xa0"]}):null,(0,a.jsx)(s.Z,{fontSize:15,component:"span",sx:o,"data-sentry-element":"Typography","data-sentry-source-file":"styles.jsx",children:n})]})},x=(0,p.Z)(c.Z)(_templateObject()),CardAndBorder=t=>{let{cardName:e,stars:n,cardIndex:r,name:i,variant:l,rawName:s,amount:c,nextLevelReq:d}=t,u="cardSet"===l?"".concat(o.prefix,"data/").concat(s,".png"):"".concat(o.prefix,"data/2Cards").concat(r,".png");return(0,a.jsxs)(a.Fragment,{children:[n>0?(0,a.jsx)(j,{src:"".concat(o.prefix,"data/CardEquipBorder").concat(n,".png"),alt:""}):null,(0,a.jsx)(m.Z,{title:(0,a.jsx)(CardTooltip,{...t,cardName:"cardSet"===l?i:e,nextLevelReq:d,amount:c}),"data-sentry-element":"Tooltip","data-sentry-source-file":"styles.jsx",children:(0,a.jsx)(v,{isCardSet:"cardSet"===l,amount:c,src:u,alt:"","data-sentry-element":"CardIcon","data-sentry-source-file":"styles.jsx"})})]})},CardTooltip=t=>{let{displayName:e,effect:n,bonus:r,stars:i,showInfo:c,nextLevelReq:d,amount:u}=t,g=r;return c&&(g=(0,h.BZ)({bonus:r,stars:i})),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(s.Z,{fontWeight:"bold",variant:"h6","data-sentry-element":"Typography","data-sentry-source-file":"styles.jsx",children:(0,o.cleanUnderscore)(e)}),(0,a.jsx)(s.Z,{"data-sentry-element":"Typography","data-sentry-source-file":"styles.jsx",children:(0,o.cleanUnderscore)(n.replace("{",g))}),c?(0,a.jsx)(l.Z,{mt:1,direction:"row",gap:1,flexWrap:"wrap",children:[1,2,3,4,5,6].map((t,n)=>(0,a.jsxs)(l.Z,{alignItems:"center",justifyContent:"space-between",children:[0===n?(0,a.jsx)(s.Z,{children:"Base"}):(0,a.jsx)(y,{src:"".concat(o.prefix,"etc/Star").concat(n,".png"),alt:""}),(0,a.jsx)(s.Z,{children:r*(n+1)})]},"".concat(e,"-").concat(n)))}):null,u>=d?(0,a.jsxs)(l.Z,{children:["You've collected ",(0,o.numberWithCommas)(u)," cards"]}):d>0?(0,a.jsxs)(l.Z,{children:["Progress: ",(0,o.numberWithCommas)(u)," / ",(0,o.numberWithCommas)(d)]}):null]})},y=p.Z.img(_templateObject1()),v=p.Z.img(_templateObject2(),t=>{let{amount:e,isCardSet:n}=t;return e||n?1:.5}),j=p.Z.img(_templateObject3()),TalentTooltip=t=>{let{level:e,funcX:n,x1:r,x2:i,funcY:c,y1:d,y2:u,description:g,name:p,talentId:m}=t,h=e>0?(0,o.growth)(n,e,r,i):0,f=e>0?(0,o.growth)(c,e,d,u):0;return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)(l.Z,{direction:"row",alignItems:"center",gap:1,"data-sentry-element":"Stack","data-sentry-source-file":"styles.jsx",children:[(0,a.jsx)("img",{src:"".concat(o.prefix,"data/UISkillIcon").concat(m,".png"),alt:""}),(0,a.jsx)(s.Z,{fontWeight:"bold",variant:"h6","data-sentry-element":"Typography","data-sentry-source-file":"styles.jsx",children:(0,o.cleanUnderscore)(p)})]}),(0,a.jsx)(s.Z,{"data-sentry-element":"Typography","data-sentry-source-file":"styles.jsx",children:(0,o.cleanUnderscore)(g).replace("{",h).replace("}",f)})]})},PlayersList=t=>{let{players:e,characters:n}=t;return(0,a.jsx)(l.Z,{gap:1,direction:"row","data-sentry-element":"Stack","data-sentry-component":"PlayersList","data-sentry-source-file":"styles.jsx",children:e.map(t=>{var e,r;let{index:i}=t;return(0,a.jsx)(m.Z,{title:null==n?void 0:null===(e=n[i])||void 0===e?void 0:e.name,children:(0,a.jsx)("img",{style:{width:24,height:24},src:"".concat(o.prefix,"data/ClassIcons").concat(null==n?void 0:null===(r=n[i])||void 0===r?void 0:r.classIndex,".png"),alt:""})},name+"-head-"+i)})})},MissingData=t=>{let{name:e}=t;return(0,a.jsxs)(s.Z,{variant:"h3","data-sentry-element":"Typography","data-sentry-component":"MissingData","data-sentry-source-file":"styles.jsx",children:["Your account is missing data for ",e]})},CardTitleAndValue=t=>{let{variant:e,raised:n,cardSx:r,imgOnly:i,imgStyle:c,title:g,value:p,children:h,icon:f,tooltipTitle:x,stackProps:y,contentPadding:v}=t;return(0,a.jsx)(m.Z,{title:x||"","data-sentry-element":"Tooltip","data-sentry-component":"CardTitleAndValue","data-sentry-source-file":"styles.jsx",children:(0,a.jsx)(d.Z,{variant:e,raised:n,sx:{my:{xs:0,md:3},width:"fit-content",...r},"data-sentry-element":"Card","data-sentry-source-file":"styles.jsx",children:(0,a.jsx)(u.Z,{sx:{"&:last-child":v?{p:v}:{}},"data-sentry-element":"CardContent","data-sentry-source-file":"styles.jsx",children:(0,a.jsxs)(l.Z,{sx:{display:y?"flex":"block",...y||{}},"data-sentry-element":"Stack","data-sentry-source-file":"styles.jsx",children:[g?(0,a.jsx)(s.Z,{sx:{fontSize:14},color:"text.secondary",gutterBottom:!0,component:"span",children:g}):null,p||i?f?(0,a.jsxs)(l.Z,{direction:"row",gap:2,alignItems:"center",children:[(0,a.jsx)("img",{style:{objectFit:"contain",...c},src:"".concat(o.prefix).concat(f),alt:""}),p?(0,a.jsx)(s.Z,{children:p}):null]}):(0,a.jsx)(s.Z,{children:p}):h]})})})})},Breakdown=t=>{let{breakdown:e,titleStyle:n={},notation:r="Big"}=t;return(0,a.jsx)(a.Fragment,{children:null==e?void 0:e.map((t,e)=>{let{name:i,value:l,title:c}=t;return c?(0,a.jsx)(s.Z,{sx:{fontWeight:500},children:c},"".concat(i,"-").concat(e)):i?(0,a.jsx)(TitleAndValue,{titleStyle:{width:120,...n},title:i,value:isNaN(l)?l:(0,o.notateNumber)(l,r)},"".concat(i,"-").concat(e)):(0,a.jsx)(g.Z,{sx:{my:1,bgcolor:"black"}},"".concat(i,"-").concat(e))})})},CenteredStack=t=>{let{direction:e="row",children:n}=t;return(0,a.jsx)(l.Z,{gap:1,direction:e,alignItems:"center","data-sentry-element":"Stack","data-sentry-component":"CenteredStack","data-sentry-source-file":"styles.jsx",children:n})}},43247:function(t,e,n){"use strict";n.r(e);var r=n(82729),a=n(85893),i=n(67294),o=n(58437),l=n(51233),s=n(87357),c=n(23972),d=n(65298),u=n(61599),g=n(74612),p=n(86255),m=n(2962),h=n(27496),f=n(59404);function _templateObject(){let t=(0,r._)(["\n  width: ",";\n  height: ",";\n  position: ",";\n  bottom: 35px;\n  left: 20px;\n"]);return _templateObject=function(){return t},t}let VialTooltip=t=>{let{name:e,itemReq:n,func:r,x1:i,x2:o,level:s,desc:u,multiplier:g=1}=t,m=(0,d.growth)(r,s,i,o)*g;return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(c.Z,{variant:"h5","data-sentry-element":"Typography","data-sentry-source-file":"vials.jsx",children:(0,d.pascalCase)((0,d.cleanUnderscore)(e))}),(0,a.jsx)(c.Z,{sx:{color:s>0&&g>1?"multi":""},variant:"body1","data-sentry-element":"Typography","data-sentry-source-file":"vials.jsx",children:(0,d.cleanUnderscore)(u.replace(/{|\$/g,(0,d.notateNumber)(m,"MultiplierInfo")))}),(0,a.jsx)(l.Z,{direction:"row","data-sentry-element":"Stack","data-sentry-source-file":"vials.jsx",children:null==n?void 0:n.map((t,e)=>{let{name:n,rawName:r}=t;return n&&"Blank"!==n&&"ERROR"!==n?(0,a.jsxs)(l.Z,{alignItems:"center",justifyContent:"center",children:[(0,a.jsx)(x,{tooltip:!0,src:"".concat(d.prefix,"data/").concat(r,".png"),alt:""}),(0,a.jsx)("span",{children:(null==n?void 0:n.includes("Liquid"))?3*s:(0,d.notateNumber)(p.ln[parseFloat(s)],"Big")})]},n+""+e):null})})]})},x=u.Z.img(_templateObject(),t=>{let{tooltip:e}=t;return e?"45px":"56px"},t=>{let{tooltip:e}=t;return e?"45px":"56px"},t=>{let{tooltip:e}=t;return e?"inherit":"absolute"});e.default=()=>{var t,e,n;let{state:r}=(0,i.useContext)(o.I);return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(m.PB,{title:"Vials | Idleon Toolbox",description:"Vials progressions and upgrade requirements","data-sentry-element":"NextSeo","data-sentry-source-file":"vials.jsx"}),(0,a.jsx)(h.Ye,{title:"Vial mastery bonus",value:"".concat(((()=>{var t,e,n,a;if((0,f.RB)(null==r?void 0:null===(t=r.account)||void 0===t?void 0:t.rift,"Vial_Mastery")){let t=null==r?void 0:null===(a=r.account)||void 0===a?void 0:null===(n=a.alchemy)||void 0===n?void 0:null===(e=n.vials)||void 0===e?void 0:e.filter(t=>{let{level:e}=t;return e>=13}),i=1+2*(null==t?void 0:t.length)/100;return isNaN(i)?0:i}})()||1).toFixed(3),"x"),"data-sentry-element":"CardTitleAndValue","data-sentry-source-file":"vials.jsx"}),(0,a.jsx)(l.Z,{direction:"row",flexWrap:"wrap","data-sentry-element":"Stack","data-sentry-source-file":"vials.jsx",children:null==r?void 0:null===(n=r.account)||void 0===n?void 0:null===(e=n.alchemy)||void 0===e?void 0:null===(t=e.vials)||void 0===t?void 0:t.map((t,e)=>{let{name:n,level:r,mainItem:i}=t;return(0,a.jsx)(g.Z,{title:(0,a.jsx)(VialTooltip,{...t}),children:(0,a.jsxs)(s.Z,{position:"relative",children:[(0,a.jsx)(x,{src:"".concat(d.prefix,"data/").concat(i,".png"),alt:""}),(0,a.jsx)("img",{onError:t=>{t.target.src="".concat(d.prefix,"data/aVials12.png"),t.target.style="opacity: 0;"},src:"".concat(d.prefix,"data/aVials").concat(0===r?"1":r,".png"),style:{opacity:0===r?.5:1},alt:"vial image missing"},"".concat(n).concat(e))]})},"".concat(n).concat(e))})})]})}}},function(t){t.O(0,[9774,2888,179],function(){return t(t.s=46579)}),_N_E=t.O()}]);