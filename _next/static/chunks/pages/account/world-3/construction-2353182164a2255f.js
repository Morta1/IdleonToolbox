(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9876],{87789:function(t,e,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/world-3/construction",function(){return n(3182)}])},68575:function(t,e,n){"use strict";var l=n(85893),o=n(67294),r=n(98396),i=n(11703),a=n(40044);e.Z=t=>{let{tabs:e,children:n,onTabChange:c}=t,[s,u]=(0,o.useState)(0),d=(0,r.Z)(t=>t.breakpoints.down("md"),{noSsr:!0}),x=Array.isArray(n)?n:[n];return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(i.Z,{centered:!d||d&&e.length<4,scrollButtons:!0,allowScrollButtonsMobile:!0,sx:{marginBottom:3},variant:d&&e.length>4?"scrollable":"standard",value:s,onChange:(t,e)=>{u(e),c&&c(e)},children:null==e?void 0:e.map((t,e)=>(0,l.jsx)(a.Z,{label:t},"".concat(t,"-").concat(e)))}),c?n:null==x?void 0:x.map((t,e)=>e===s?t:null)]})}},86736:function(t,e,n){"use strict";n.d(e,{Gr:function(){return MissingData},M5:function(){return v},Wd:function(){return PlayersList},Ye:function(){return CardTitleAndValue},iy:function(){return CardAndBorder},j8:function(){return m},u3:function(){return TalentTooltip},uQ:function(){return TitleAndValue},wD:function(){return CenteredStack}});var l=n(82729),o=n(85893),r=n(67294),i=n(30925),a=n(51233),c=n(15861),s=n(49425),u=n(66242),d=n(44267),x=n(61599),p=n(5072),h=n(54685);function _templateObject(){let t=(0,l._)(["\n  & .MuiBadge-badge {\n    background-color: #d5d5dc;\n    color: rgba(0, 0, 0, 0.87);\n  }\n"]);return _templateObject=function(){return t},t}function _templateObject1(){let t=(0,l._)(["\n  height: 20px;\n  object-fit: contain;\n"]);return _templateObject1=function(){return t},t}function _templateObject2(){let t=(0,l._)(["\n  width: 56px;\n  height: 72px;\n  object-fit: contain;\n  opacity: ",";\n"]);return _templateObject2=function(){return t},t}function _templateObject3(){let t=(0,l._)(["\n  position: absolute;\n  left: 50%;\n  top: -3px;\n  pointer-events: none;\n  transform: translateX(-50%);\n"]);return _templateObject3=function(){return t},t}let v=(0,r.forwardRef)((t,e)=>{let{stat:n,icon:l}=t,{img:r,...s}=t;return(0,o.jsxs)(a.Z,{alignItems:"center",...s,ref:e,style:{position:"relative",width:"fit-content"},children:[(0,o.jsx)("img",{...r,src:"".concat(i.prefix,"data/").concat(l,".png"),alt:""}),(0,o.jsx)(c.Z,{variant:"body1",component:"span",children:n})]})});v.displayName="IconWithText";let TitleAndValue=t=>{let{title:e,value:n,boldTitle:l,titleStyle:r={},valueStyle:i={}}=t;return(0,o.jsxs)(a.Z,{direction:"row",flexWrap:"wrap",alignItems:"center",children:[e?(0,o.jsxs)(c.Z,{style:r,fontWeight:l?"bold":500,component:"span",children:[e,":\xa0"]}):null,(0,o.jsx)(c.Z,{fontSize:15,component:"span",sx:i,children:n})]})},m=(0,x.Z)(s.Z)(_templateObject()),CardAndBorder=t=>{let{cardName:e,stars:n,cardIndex:l,name:r,variant:a,rawName:c,amount:s,nextLevelReq:u}=t,d="cardSet"===a?"".concat(i.prefix,"data/").concat(c,".png"):"".concat(i.prefix,"data/2Cards").concat(l,".png");return(0,o.jsxs)(o.Fragment,{children:[n>0?(0,o.jsx)(b,{src:"".concat(i.prefix,"data/CardEquipBorder").concat(n,".png"),alt:""}):null,(0,o.jsx)(p.Z,{title:(0,o.jsx)(CardTooltip,{...t,cardName:"cardSet"===a?r:e,nextLevelReq:u,amount:s}),children:(0,o.jsx)(g,{isCardSet:"cardSet"===a,amount:s,src:d,alt:""})})]})},CardTooltip=t=>{let{displayName:e,effect:n,bonus:l,stars:r,showInfo:s,nextLevelReq:u,amount:d}=t,x=l;return s&&(x=(0,h.BZ)({bonus:l,stars:r})),(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(c.Z,{fontWeight:"bold",variant:"h6",children:(0,i.cleanUnderscore)(e)}),(0,o.jsx)(c.Z,{children:(0,i.cleanUnderscore)(n.replace("{",x))}),s?(0,o.jsx)(a.Z,{mt:1,direction:"row",gap:1,flexWrap:"wrap",children:[1,2,3,4,5,6].map((t,n)=>(0,o.jsxs)(a.Z,{alignItems:"center",justifyContent:"space-between",children:[0===n?(0,o.jsx)(c.Z,{children:"Base"}):(0,o.jsx)(j,{src:"".concat(i.prefix,"etc/Star").concat(n,".png"),alt:""}),(0,o.jsx)(c.Z,{children:l*(n+1)})]},"".concat(e,"-").concat(n)))}):null,d>=u?(0,o.jsxs)(a.Z,{children:["You've collected ",(0,i.numberWithCommas)(d)," cards"]}):u>0?(0,o.jsxs)(a.Z,{children:["Progress: ",(0,i.numberWithCommas)(d)," / ",(0,i.numberWithCommas)(u)]}):null]})},j=x.Z.img(_templateObject1()),g=x.Z.img(_templateObject2(),t=>{let{amount:e,isCardSet:n}=t;return e||n?1:.5}),b=x.Z.img(_templateObject3()),TalentTooltip=t=>{let{level:e,funcX:n,x1:l,x2:r,funcY:s,y1:u,y2:d,description:x,name:p,talentId:h}=t,v=e>0?(0,i.growth)(n,e,l,r):0,m=e>0?(0,i.growth)(s,e,u,d):0;return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)(a.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,o.jsx)("img",{src:"".concat(i.prefix,"data/UISkillIcon").concat(h,".png"),alt:""}),(0,o.jsx)(c.Z,{fontWeight:"bold",variant:"h6",children:(0,i.cleanUnderscore)(p)})]}),(0,o.jsx)(c.Z,{children:(0,i.cleanUnderscore)(x).replace("{",v).replace("}",m)})]})},PlayersList=t=>{let{players:e,characters:n}=t;return(0,o.jsx)(a.Z,{gap:1,direction:"row",children:e.map(t=>{var e;let{index:l}=t;return(0,o.jsx)(p.Z,{title:null==n?void 0:null===(e=n[l])||void 0===e?void 0:e.name,children:(0,o.jsx)("img",{src:"".concat(i.prefix,"data/headBIG.png"),alt:""})},name+"-head-"+l)})})},MissingData=t=>{let{name:e}=t;return(0,o.jsxs)(c.Z,{variant:"h3",children:["Your account is missing data for ",e]})},CardTitleAndValue=t=>{let{cardSx:e,title:n,value:l,children:r,icon:s}=t;return(0,o.jsx)(u.Z,{sx:{my:{xs:0,md:3},width:"fit-content",...e},children:(0,o.jsxs)(d.Z,{children:[(0,o.jsx)(c.Z,{sx:{fontSize:14},color:"text.secondary",gutterBottom:!0,children:n}),l?s?(0,o.jsxs)(a.Z,{direction:"row",gap:2,children:[(0,o.jsx)("img",{style:{objectFit:"contain"},src:"".concat(i.prefix).concat(s),alt:""}),(0,o.jsx)(c.Z,{children:l})]}):(0,o.jsx)(c.Z,{children:l}):r]})})},CenteredStack=t=>{let{direction:e="row",children:n}=t;return(0,o.jsx)(a.Z,{gap:1,direction:e,alignItems:"center",children:n})}},3182:function(t,e,n){"use strict";n.r(e),n.d(e,{default:function(){return world_3_construction}});var l=n(82729),o=n(85893),r=n(67294),i=n(41285),a=n(61599),c=n(23513),s=n(47212),u=n(51233),d=n(33454),x=n(96420),p=n(15861),h=n(50480),v=n(69368),m=n(61903),j=n(94054),g=n(153),b=n(5072),Z=n(23795),f=n(74721),w=n(83321),C=n(56868),y=n(86736),_=n(30925),S=n(24162),B=n(18972),I=n(87357);function _templateObject(){let t=(0,l._)(["\n  position: relative;\n  background-image: url(",');\n  background-repeat: no-repeat;\n  background-position: center;\n\n  width: 46px;\n  height: 46px;\n\n  &:before {\n    content: "";\n    display: block;\n    position: absolute;\n    z-index: -1;\n    ',"\n\n    width: 48px;\n    height: 47px;\n    top: 1px;\n    left: -1px;\n  }\n"]);return _templateObject=function(){return t},t}function _templateObject1(){let t=(0,l._)(["\n  width: 47px;\n  height: 47px;\n"]);return _templateObject1=function(){return t},t}function _templateObject2(){let t=(0,l._)(["\n  width: 47px;\n  height: 47px;\n"]);return _templateObject2=function(){return t},t}let O={fontSize:12,fontWeight:400,position:"absolute",top:0,left:0,backgroundColor:"black"},M={fontSize:12,fontWeight:400,position:"absolute",bottom:0,right:0,backgroundColor:"blue"},CogTooltip=t=>{var e;let{character:n,index:l,currentAmount:r,requiredAmount:i,cog:a}=t;return(0,o.jsxs)(o.Fragment,{children:[n?(0,o.jsx)(p.Z,{sx:{fontWeight:"bold"},children:n}):null,r<i?(0,o.jsxs)(p.Z,{children:[(0,_.kFormatter)(r,2)," / ",(0,_.kFormatter)(i,2)," (",(0,_.kFormatter)(r/i*100,2),"%)"]}):null,null===(e=Object.values(null==a?void 0:a.stats))||void 0===e?void 0:e.map((t,e)=>{let{name:n,value:l}=t;return n?(0,o.jsxs)("div",{children:[(0,_.notateNumber)(l,"Big"),(0,_.cleanUnderscore)(n)]},"".concat(n,"-").concat(e)):null}),"index: ",l]})},N=(0,a.Z)(u.Z)(_templateObject(),()=>"".concat(_.prefix,"data/CogSq0.png"),t=>{let{filled:e}=t;return 0===e||100===e?"":"background: linear-gradient(to top, #9de060 ".concat(e,"%, transparent 0%);")}),k=a.Z.img(_templateObject1()),P=a.Z.img(_templateObject2());var construction_ConstructionBoard=t=>{let{view:e,board:n,showTooltip:l,setOutsideHighlight:r,outsideHighlight:i}=t;return(0,o.jsx)(I.Z,{mt:3,sx:{display:"grid",gap:"8px",gridTemplateColumns:{xs:"repeat(8, minmax(45px, 1fr))",md:"repeat(12, minmax(45px, 1fr))"},gridTemplateRows:{xs:"repeat(8, minmax(45px, 1fr))",md:"repeat(8, minmax(45px, 1fr))"}},children:null==n?void 0:n.map((t,n)=>{var a,c,s;let{currentAmount:u,requiredAmount:d,flagPlaced:x,cog:h}=t,{a:v,e:m,b:j,d:g,c:Z,j:f,f:w}=null==h?void 0:h.stats,C=u/d*100;return(0,o.jsx)(I.Z,{sx:{outline:(null==h?void 0:h.originalIndex)===i?"1px solid red":"",opacity:r||(null==h?void 0:h.originalIndex)!==n?1:.5},onMouseEnter:()=>"function"==typeof r&&r(null==h?void 0:h.originalIndex),onMouseLeave:()=>"function"==typeof r&&r(null),children:(0,o.jsx)(b.Z,{title:l?(0,o.jsx)(CogTooltip,{...t,index:n,character:(null==h?void 0:null===(a=h.name)||void 0===a?void 0:a.includes("Player"))?null==h?void 0:null===(c=h.name)||void 0===c?void 0:c.split("Player_")[1]:""}):"",children:(0,o.jsxs)(N,{filled:C,rest:100-C,children:[x?(0,o.jsx)(k,{src:"".concat(_.prefix,"data/CogFLflag.png"),alt:""}):null,(null==h?void 0:h.name)&&!x?(0,o.jsx)(P,{src:"".concat(_.prefix,"data/").concat((null==h?void 0:null===(s=h.name)||void 0===s?void 0:s.includes("Player"))?"headBIG":null==h?void 0:h.name,".png"),alt:""}):null,_.isProd?null:(0,o.jsx)(p.Z,{sx:M,children:n}),"build"===e&&!x&&(null==v?void 0:v.value)?(0,o.jsx)(p.Z,{sx:O,children:(0,_.notateNumber)(null==v?void 0:v.value,"Big")||null}):null,"buildPercent"===e&&!x&&(null==m?void 0:m.value)?(0,o.jsx)(p.Z,{sx:O,children:(0,_.notateNumber)(null==m?void 0:m.value,"Big")||null}):null,"exp"!==e||x?null:(0,o.jsx)(p.Z,{sx:O,children:(null==j?void 0:j.value)&&(0,_.notateNumber)(null==j?void 0:j.value,"Big")||(null==g?void 0:g.value)&&(0,_.notateNumber)(null==g?void 0:g.value,"Big")||null}),"playerExp"!==e||x?null:(0,o.jsx)(p.Z,{sx:O,children:(null==w?void 0:w.value)&&(0,_.notateNumber)(null==w?void 0:w.value,"Big")||null}),"flaggy"===e&&!x&&(null==Z?void 0:Z.value)?(0,o.jsx)(p.Z,{sx:O,children:(0,_.notateNumber)(null==Z?void 0:Z.value,"Big")||null}):null,"classExp"===e&&!x&&(null==f?void 0:f.value)?(0,o.jsx)(p.Z,{sx:O,children:(0,_.notateNumber)(null==f?void 0:f.value,"Big")||null}):null]})})},n)})})},construction_ConstructionMain=()=>{var t,e,n,l,i,a,I,O,M,N,k,P,T;let{state:E}=(0,r.useContext)(c.I),[R,F]=(0,r.useState)("build"),[W,Y]=(0,r.useState)(!0),[z,A]=(0,r.useState)("totalBuildRate"),[H,D]=(0,r.useState)(2500),[U,X]=(0,r.useState)(null==E?void 0:null===(t=E.account)||void 0===t?void 0:t.construction),[V,L]=(0,r.useState)(null),[G,q]=(0,r.useState)(null),[J,K]=(0,r.useState)({list:[],current:0}),handleCopy=async t=>{try{await navigator.clipboard.writeText(t)}catch(t){console.error(t)}};return(0,r.useEffect)(()=>{"totalBuildRate"===z?F("build"):"totalPlayerExpRate"===z&&F("exp")},[z]),(0,o.jsx)(o.Fragment,{children:(0,o.jsxs)(u.Z,{alignItems:"center",children:[(0,o.jsxs)(d.Z,{value:R,exclusive:!0,onChange:(t,e)=>(null==e?void 0:e.length)?F(e):null,children:[(0,o.jsx)(x.Z,{value:"build",children:"Build"}),(0,o.jsx)(x.Z,{value:"buildPercent",children:"Build %"}),(0,o.jsx)(x.Z,{value:"exp",children:"Exp"}),(0,o.jsx)(x.Z,{value:"playerExp",children:"Player Exp boost"}),(0,o.jsx)(x.Z,{value:"flaggy",children:"Flaggy"}),(0,o.jsx)(x.Z,{value:"classExp",children:"Class Exp"})]}),(0,o.jsxs)(u.Z,{my:1,children:[(0,o.jsxs)(u.Z,{my:1,gap:1,direction:"row",alignItems:"center",justifyContent:"center",children:[(0,o.jsxs)(p.Z,{variant:"h6",textAlign:"center",children:["Cogstruction"," "]}),(0,o.jsx)(b.Z,{followCursor:!1,title:(0,o.jsxs)(o.Fragment,{children:["You can export your data and use it in"," ",(0,o.jsx)(Z.Z,{target:"_blank",underline:"always",color:"info.dark",href:"https://github.com/automorphis/Cogstruction",rel:"noreferrer",children:"Cogstruction"})]}),children:(0,o.jsx)(f.Z,{})})]}),(0,o.jsxs)(u.Z,{direction:"row",gap:2,children:[(0,o.jsx)(w.Z,{variant:"contained",color:"primary",sx:{textTransform:"unset"},onClick:()=>{var t,e,n;return handleCopy(null==E?void 0:null===(n=E.account)||void 0===n?void 0:null===(e=n.construction)||void 0===e?void 0:null===(t=e.cogstruction)||void 0===t?void 0:t.cogData)},startIcon:(0,o.jsx)(C.Z,{}),children:"Cogstruction Data"}),(0,o.jsx)(w.Z,{variant:"contained",color:"primary",sx:{textTransform:"unset"},onClick:()=>{var t,e,n;return handleCopy(null==E?void 0:null===(n=E.account)||void 0===n?void 0:null===(e=n.construction)||void 0===e?void 0:null===(t=e.cogstruction)||void 0===t?void 0:t.empties)},startIcon:(0,o.jsx)(C.Z,{}),children:"Cogstruction Empties"})]})]}),(0,o.jsxs)(u.Z,{direction:"row",my:2,gap:2,flexWrap:"wrap",children:[(0,o.jsx)(y.Ye,{title:"Total Build Rate",children:(0,o.jsxs)(u.Z,{alignItems:"center",gap:1,children:[(0,o.jsxs)(p.Z,{children:[(0,_.notateNumber)(null==E?void 0:null===(n=E.account)||void 0===n?void 0:null===(e=n.construction)||void 0===e?void 0:e.totalBuildRate),"/HR"]}),V?(0,o.jsx)(S.Z,{}):null,V?(0,o.jsxs)(p.Z,{sx:{color:"info.light"},children:[(0,_.notateNumber)(null==V?void 0:V.totalBuildRate),"/HR (",(0,_.notateNumber)((null==V?void 0:V.totalBuildRate)-(null==E?void 0:null===(i=E.account)||void 0===i?void 0:null===(l=i.construction)||void 0===l?void 0:l.totalBuildRate)),")"]}):null]})}),(0,o.jsx)(y.Ye,{title:"Total Player XP rate",children:(0,o.jsxs)(u.Z,{alignItems:"center",gap:1,children:[(0,o.jsxs)(p.Z,{children:[(0,_.notateNumber)(null==E?void 0:null===(I=E.account)||void 0===I?void 0:null===(a=I.construction)||void 0===a?void 0:a.totalPlayerExpRate),"/HR"]}),V?(0,o.jsx)(S.Z,{}):null,V?(0,o.jsxs)(p.Z,{sx:{color:"info.light"},children:[(0,_.notateNumber)(null==V?void 0:V.totalPlayerExpRate),"/HR (",(0,_.notateNumber)((null==V?void 0:V.totalPlayerExpRate)-(null==E?void 0:null===(M=E.account)||void 0===M?void 0:null===(O=M.construction)||void 0===O?void 0:O.totalPlayerExpRate)),")"]}):null]})}),(0,o.jsx)(y.Ye,{title:"Player XP Bonus",value:"".concat((0,_.notateNumber)(null==E?void 0:null===(k=E.account)||void 0===k?void 0:null===(N=k.construction)||void 0===N?void 0:N.totalExpRate),"%")}),(0,o.jsx)(y.Ye,{title:"Flaggy Rate",value:"".concat((0,_.notateNumber)(null==E?void 0:null===(T=E.account)||void 0===T?void 0:null===(P=T.construction)||void 0===P?void 0:P.totalFlaggyRate),"/HR")}),(0,o.jsx)(y.Ye,{title:"Hover",children:(0,o.jsx)(u.Z,{sx:{maxWidth:200},children:(0,o.jsx)(h.Z,{control:(0,o.jsx)(v.Z,{checked:W,onChange:()=>Y(!W)}),name:"showTooltip",label:"Show tooltip"})})}),(0,o.jsx)(y.Ye,{title:"Optimize",children:(0,o.jsxs)(u.Z,{gap:1,children:[(0,o.jsx)(m.Z,{onChange:t=>{let{target:e}=t;return D(e.value)},type:"number",inputProps:{min:0},variant:"standard",label:"Compute time (in ms)",value:H}),(0,o.jsx)(j.Z,{fullWidth:!0,size:"small",variant:"standard",children:(0,o.jsxs)(g.Z,{labelId:"demo-simple-select-label",id:"demo-simple-select",value:z,label:"Age",onChange:t=>A(t.target.value),children:[(0,o.jsx)(B.Z,{value:"totalBuildRate",children:"Build speed"}),(0,o.jsx)(B.Z,{value:"totalPlayerExpRate",children:"Player XP rate"})]})}),(0,o.jsx)(w.Z,{variant:"contained",onClick:()=>{var t,e,n;X(null==E?void 0:null===(t=E.account)||void 0===t?void 0:t.construction);let l=JSON.parse(JSON.stringify(null==E?void 0:null===(n=E.account)||void 0===n?void 0:null===(e=n.construction)||void 0===e?void 0:e.baseBoard)),o=(0,s.ai)(l,z,H,null==E?void 0:E.characters);K({list:null==o?void 0:o.moves,current:0}),L(o)},children:"Optimize"})]})})]}),(0,o.jsx)(construction_ConstructionBoard,{view:R,showTooltip:W,setOutsideHighlight:q,move:J.list[J.current],board:null==U?void 0:U.board}),V?(0,o.jsx)(p.Z,{sx:{mt:3},variant:"caption",children:"* Hovering over a cog in the upper board will reveal where the same cog is placed on the lower board."}):null,V?(0,o.jsx)(construction_ConstructionBoard,{view:R,outsideHighlight:G,showTooltip:W,board:null==V?void 0:V.board}):null]})})},T=n(68575),E=n(2962),R=n(40476),F=n(72890),W=n(36872),Y=n(10924);let Section=t=>{let{title:e,main:n,min:l,max:r}=t;return(0,o.jsx)(y.Ye,{title:e,children:(0,o.jsxs)(u.Z,{children:[n?(0,o.jsxs)(u.Z,{alignItems:"center",direction:"row",gap:1,children:[(0,o.jsx)(p.Z,{sx:{fontSize:14},color:"text.secondary",children:"main"}),(0,o.jsx)(p.Z,{children:(0,_.notateNumber)(n,"MultiplierInfo")})]}):null,(0,o.jsxs)(u.Z,{alignItems:"center",direction:"row",gap:1,children:[(0,o.jsx)(p.Z,{sx:{fontSize:14},color:"text.secondary",children:"min"}),(0,o.jsx)(p.Z,{children:(0,_.notateNumber)(l,"MultiplierInfo")})]}),(0,o.jsxs)(u.Z,{alignItems:"center",direction:"row",gap:1,children:[(0,o.jsx)(p.Z,{sx:{fontSize:14},color:"text.secondary",children:"max"}),(0,o.jsx)(p.Z,{children:(0,_.notateNumber)(r,"MultiplierInfo")})]})]})})};var construction_CogStatCalculator=()=>{var t,e,n,l;let{state:i}=(0,r.useContext)(c.I),[a,s]=(0,r.useState)(5),d=(0,r.useMemo)(()=>(0,Y.Nh)(null==i?void 0:i.characters,"Divine_Knight","construction"),[null==i?void 0:i.characters]),x=null==d?void 0:null===(e=d.skillsInfo)||void 0===e?void 0:null===(t=e.construction)||void 0===t?void 0:t.level,p=Math.pow(x/3+.7,1.3+.05*a)/4+Math.pow(3,a-2),v=.4*p,m=3*p;return(0,o.jsxs)(u.Z,{alignItems:"center",children:[(0,o.jsx)(y.Ye,{title:"Highest Cons level",value:(null==d?void 0:null===(l=d.skillsInfo)||void 0===l?void 0:null===(n=l.construction)||void 0===n?void 0:n.level)||0}),(0,o.jsxs)(j.Z,{children:[(0,o.jsx)(R.Z,{id:"demo-row-radio-buttons-group-label",children:"Cog type"}),(0,o.jsxs)(F.Z,{row:!0,"aria-labelledby":"demo-row-radio-buttons-group-label",name:"row-radio-buttons-group",value:a,onChange:t=>{s(t.target.value)},children:[(0,o.jsx)(h.Z,{value:2,control:(0,o.jsx)(W.Z,{}),label:"Nooby"}),(0,o.jsx)(h.Z,{value:3,control:(0,o.jsx)(W.Z,{}),label:"Decent"}),(0,o.jsx)(h.Z,{value:4,control:(0,o.jsx)(W.Z,{}),label:"Superb"}),(0,o.jsx)(h.Z,{value:5,control:(0,o.jsx)(W.Z,{}),label:"Ultimate"})]})]}),(0,o.jsxs)(u.Z,{direction:"row",gap:3,flexWrap:"wrap",children:[(0,o.jsx)(Section,{title:"Construction Value",main:p,min:v,max:m}),(0,o.jsx)(Section,{title:"Build rate",min:Math.floor(v),max:Math.floor(m)}),(0,o.jsx)(Section,{title:"Flag rate",min:Math.round(Math.pow(v,.8)),max:Math.round(Math.pow(m,.8))}),(0,o.jsx)(Section,{title:"Exp",min:Math.max(Math.floor(Math.pow(v,.4)+10*Math.log10(v)-5),2),max:Math.max(Math.floor(Math.pow(m,.4)+10*Math.log10(m)-5),2)})]})]})};function construction_templateObject(){let t=(0,l._)(["\n  transform: rotate(180deg);\n"]);return construction_templateObject=function(){return t},t}(0,a.Z)(i.Z)(construction_templateObject());var world_3_construction=()=>(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(E.PB,{title:"Idleon Toolbox | Construction",description:"Keep track of your construction board, cogs information and more"}),(0,o.jsx)(p.Z,{variant:"h2",textAlign:"center",mb:3,children:"Construction"}),(0,o.jsxs)(T.Z,{tabs:["Main","Cog stat calculator"],children:[(0,o.jsx)(construction_ConstructionMain,{}),(0,o.jsx)(construction_CogStatCalculator,{})]})]})}},function(t){t.O(0,[5127,9584,7975,7896,8054,9774,2888,179],function(){return t(t.s=87789)}),_N_E=t.O()}]);