(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4898],{65372:function(t,e,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/tools/card-search",function(){return n(43348)}])},64885:function(t,e,n){"use strict";n.d(e,{Gr:function(){return MissingData},M5:function(){return g},Wd:function(){return PlayersList},Ye:function(){return CardTitleAndValue},iy:function(){return CardAndBorder},j8:function(){return j},tq:function(){return Breakdown},u3:function(){return TalentTooltip},uQ:function(){return TitleAndValue},wD:function(){return CenteredStack}});var r=n(82729),a=n(85893),i=n(67294),s=n(30925),l=n(51233),o=n(15861),c=n(49425),d=n(66242),u=n(44267),p=n(67720),h=n(61599),x=n(2511),m=n(54685);function _templateObject(){let t=(0,r._)(["\n  & .MuiBadge-badge {\n    background-color: #d5d5dc;\n    color: rgba(0, 0, 0, 0.87);\n  }\n"]);return _templateObject=function(){return t},t}function _templateObject1(){let t=(0,r._)(["\n  height: 20px;\n  object-fit: contain;\n"]);return _templateObject1=function(){return t},t}function _templateObject2(){let t=(0,r._)(["\n  width: 56px;\n  height: 72px;\n  object-fit: contain;\n  opacity: ",";\n"]);return _templateObject2=function(){return t},t}function _templateObject3(){let t=(0,r._)(["\n  position: absolute;\n  left: 50%;\n  top: -3px;\n  pointer-events: none;\n  transform: translateX(-50%);\n"]);return _templateObject3=function(){return t},t}let g=(0,i.forwardRef)((t,e)=>{let{stat:n,icon:r,img:i,title:c="",...d}=t;return(0,a.jsx)(x.Z,{title:c,children:(0,a.jsxs)(l.Z,{alignItems:"center",...d,ref:e,style:{position:"relative",width:"fit-content"},children:[(0,a.jsx)("img",{...i,src:"".concat(s.prefix,"data/").concat(r,".png"),alt:""}),(0,a.jsx)(o.Z,{variant:"body1",component:"span",children:n})]})})});g.displayName="IconWithText";let TitleAndValue=t=>{let{title:e,value:n,boldTitle:r,titleStyle:i={},valueStyle:s={}}=t;return(0,a.jsxs)(l.Z,{direction:"row",flexWrap:"wrap",alignItems:"center",children:[e?(0,a.jsxs)(o.Z,{sx:i,fontWeight:r?"bold":500,component:"span",children:[e,":\xa0"]}):null,(0,a.jsx)(o.Z,{fontSize:15,component:"span",sx:s,children:n})]})},j=(0,h.Z)(c.Z)(_templateObject()),CardAndBorder=t=>{let{cardName:e,stars:n,cardIndex:r,name:i,variant:l,rawName:o,amount:c,nextLevelReq:d}=t,u="cardSet"===l?"".concat(s.prefix,"data/").concat(o,".png"):"".concat(s.prefix,"data/2Cards").concat(r,".png");return(0,a.jsxs)(a.Fragment,{children:[n>0?(0,a.jsx)(b,{src:"".concat(s.prefix,"data/CardEquipBorder").concat(n,".png"),alt:""}):null,(0,a.jsx)(x.Z,{title:(0,a.jsx)(CardTooltip,{...t,cardName:"cardSet"===l?i:e,nextLevelReq:d,amount:c}),children:(0,a.jsx)(v,{isCardSet:"cardSet"===l,amount:c,src:u,alt:""})})]})},CardTooltip=t=>{let{displayName:e,effect:n,bonus:r,stars:i,showInfo:c,nextLevelReq:d,amount:u}=t,p=r;return c&&(p=(0,m.BZ)({bonus:r,stars:i})),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(o.Z,{fontWeight:"bold",variant:"h6",children:(0,s.cleanUnderscore)(e)}),(0,a.jsx)(o.Z,{children:(0,s.cleanUnderscore)(n.replace("{",p))}),c?(0,a.jsx)(l.Z,{mt:1,direction:"row",gap:1,flexWrap:"wrap",children:[1,2,3,4,5,6].map((t,n)=>(0,a.jsxs)(l.Z,{alignItems:"center",justifyContent:"space-between",children:[0===n?(0,a.jsx)(o.Z,{children:"Base"}):(0,a.jsx)(f,{src:"".concat(s.prefix,"etc/Star").concat(n,".png"),alt:""}),(0,a.jsx)(o.Z,{children:r*(n+1)})]},"".concat(e,"-").concat(n)))}):null,u>=d?(0,a.jsxs)(l.Z,{children:["You've collected ",(0,s.numberWithCommas)(u)," cards"]}):d>0?(0,a.jsxs)(l.Z,{children:["Progress: ",(0,s.numberWithCommas)(u)," / ",(0,s.numberWithCommas)(d)]}):null]})},f=h.Z.img(_templateObject1()),v=h.Z.img(_templateObject2(),t=>{let{amount:e,isCardSet:n}=t;return e||n?1:.5}),b=h.Z.img(_templateObject3()),TalentTooltip=t=>{let{level:e,funcX:n,x1:r,x2:i,funcY:c,y1:d,y2:u,description:p,name:h,talentId:x}=t,m=e>0?(0,s.growth)(n,e,r,i):0,g=e>0?(0,s.growth)(c,e,d,u):0;return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)(l.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,a.jsx)("img",{src:"".concat(s.prefix,"data/UISkillIcon").concat(x,".png"),alt:""}),(0,a.jsx)(o.Z,{fontWeight:"bold",variant:"h6",children:(0,s.cleanUnderscore)(h)})]}),(0,a.jsx)(o.Z,{children:(0,s.cleanUnderscore)(p).replace("{",m).replace("}",g)})]})},PlayersList=t=>{let{players:e,characters:n}=t;return(0,a.jsx)(l.Z,{gap:1,direction:"row",children:e.map(t=>{var e,r;let{index:i}=t;return(0,a.jsx)(x.Z,{title:null==n?void 0:null===(e=n[i])||void 0===e?void 0:e.name,children:(0,a.jsx)("img",{style:{width:24,height:24},src:"".concat(s.prefix,"data/ClassIcons").concat(null==n?void 0:null===(r=n[i])||void 0===r?void 0:r.classIndex,".png"),alt:""})},name+"-head-"+i)})})},MissingData=t=>{let{name:e}=t;return(0,a.jsxs)(o.Z,{variant:"h3",children:["Your account is missing data for ",e]})},CardTitleAndValue=t=>{let{variant:e,raised:n,cardSx:r,imgStyle:i,title:c,value:p,children:h,icon:m,tooltipTitle:g,stackProps:j}=t;return(0,a.jsx)(x.Z,{title:g||"",children:(0,a.jsx)(d.Z,{variant:e,raised:n,sx:{my:{xs:0,md:3},width:"fit-content",...r},children:(0,a.jsx)(u.Z,{children:(0,a.jsxs)(l.Z,{sx:{display:j?"flex":"block",...j||{}},children:[(0,a.jsx)(o.Z,{sx:{fontSize:14},color:"text.secondary",gutterBottom:!0,children:c}),p?m?(0,a.jsxs)(l.Z,{direction:"row",gap:2,alignItems:"center",children:[(0,a.jsx)("img",{style:{objectFit:"contain",...i},src:"".concat(s.prefix).concat(m),alt:""}),(0,a.jsx)(o.Z,{children:p})]}):(0,a.jsx)(o.Z,{children:p}):h]})})})})},Breakdown=t=>{let{breakdown:e,titleStyle:n={},notation:r="Big"}=t;return(0,a.jsx)(a.Fragment,{children:null==e?void 0:e.map((t,e)=>{let{name:i,value:l,title:c}=t;return c?(0,a.jsx)(o.Z,{sx:{fontWeight:500},children:c},"".concat(i,"-").concat(e)):i?(0,a.jsx)(TitleAndValue,{titleStyle:{width:120,...n},title:i,value:isNaN(l)?l:(0,s.notateNumber)(l,r)},"".concat(i,"-").concat(e)):(0,a.jsx)(p.Z,{sx:{my:1,bgcolor:"black"}},"".concat(i,"-").concat(e))})})},CenteredStack=t=>{let{direction:e="row",children:n}=t;return(0,a.jsx)(l.Z,{gap:1,direction:e,alignItems:"center",children:n})}},43348:function(t,e,n){"use strict";n.r(e),n.d(e,{default:function(){return CardSearch}});var r=n(82729),a=n(85893),i=n(67294),s=n(98396),l=n(51233),o=n(87918),c=n(15861),d=n(87357),u=n(50135),p=n(87109),h=n(30925),x=n(70473),m=n(63343),g=n(61599),j=n(21480),f=n(64885),v=n(2962),b=n(13250),C=n(32805);function _templateObject(){let t=(0,r._)(["\n  && label.Mui-focused {\n    color: rgba(255, 255, 255, 0.7);\n  }\n\n  & .MuiInput-underline:after {\n    border-bottom-color: green;\n  }\n"]);return _templateObject=function(){return t},t}function _templateObject1(){let t=(0,r._)(["\n  cursor: pointer;\n"]);return _templateObject1=function(){return t},t}function _templateObject2(){let t=(0,r._)(["\n  color: white;\n\n  .chips {\n    margin: 20px 0;\n\n    .chip {\n      margin-right: 10px;\n      margin-top: 8px;\n    }\n  }\n\n  .cards {\n    min-height: 600px;\n\n    .category-wrapper {\n\n\n    }\n\n    .card-banner {\n      margin: 10px;\n      display: block;\n    }\n\n    .not-found {\n      margin: 20px;\n      font-size: 30px;\n    }\n\n    .image-wrapper {\n      display: inline-block;\n    }\n  }\n"]);return _templateObject2=function(){return t},t}let Z=["Card Sets","Blunder_Hills","Yum_Yum_Desert","Easy_Resources","Medium_Resources","Frostbite_Tundra","Hard_Resources","Hyperion_Nebula","Smolderin'_Plateau","Dungeons","Bosses","Events"],_={choppin:[x.stats.BaseWIS,x.stats.SkillAFKgainrate],catching:[x.stats.BaseAGI,x.stats.SkillAFKgainrate],mining:[x.stats.BaseSTR,x.stats.SkillAFKgainrate,x.stats.BaseHP,x.stats.BoostFoodEffect],fishing:[x.stats.BaseSTR,x.stats.SkillAFKgainrate,x.stats.BaseHP,x.stats.BoostFoodEffect],trapping:[x.stats.BaseAGI,x.stats.SkillAFKgainrate,x.stats.ShinyCritterChance],damage:[x.stats.WeaponPower,x.stats.CriticalChance],"drop rate":[x.stats.BaseLUK],"card drop":[x.stats.BaseLUK,x.stats.TotalDropRate],"monster exp":[x.stats.EXPfrommonsters],dungeon:[x.stats.BlockChance,x.stats.RNGitemrarity,x.stats["tostartwithRNGorb(Passive)"]],worship:[x.stats.StartingPtsinWorship,x.stats.ChargeRate,x.stats.MaxCharge,x.stats.SkillEXP],money:[x.stats.FightingAFKgainrate,x.stats.TotalDropRate]};function CardSearch(){var t;let{state:e}=(0,i.useContext)(j.I),[n,r]=(0,i.useState)(""),u=(0,s.Z)("(min-width: 1600px)",{noSsr:!0}),p=(0,s.Z)("(min-width: 850px)",{noSsr:!0}),mapCards=(t,n)=>{var r;let a=Object.values(n).reduce((t,e,n)=>({...t,[null==e?void 0:e.name]:{...e,totalStars:0,realIndex:n}}),{}),i=null===(r=Object.entries(t))||void 0===r?void 0:r.reduce((t,n)=>{var r,i;let[,s]=n,{category:l,displayName:o}=s,{stars:c,amount:d}=(null==e?void 0:null===(i=e.account)||void 0===i?void 0:null===(r=i.cards)||void 0===r?void 0:r[o])||{};return a[l].totalStars+=0===c&&d>0?1:c>0?c+1:0,{...t,[l]:[...(null==t?void 0:t[l])||[],s]}},{});return{...i,"Card Sets":Object.values(a)}},g=(0,i.useMemo)(()=>mapCards(x.cards,x.cardSets),[e.account]),[k,O]=(0,i.useState)(g);return(0,i.useEffect)(()=>{let t=Object.keys(g).reduce((t,e)=>{let r=g[e],a=r.filter(t=>{var e,r;let{effect:a}=t,i=a.replace(/[+%{]+_/,"").replace(/_/g," "),s=null==i?void 0:null===(e=i.toLowerCase())||void 0===e?void 0:e.includes(n.toLowerCase()),l=null===(r=_[n.toLowerCase()])||void 0===r?void 0:r.includes((0,h.cleanUnderscore)(i));return s||l});return{...t,[e]:a}},{});O(t)},[n]),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(v.PB,{title:"Card Search | Idleon Toolbox",description:"Card search and filter by various tags e.g. Choppin, Catching, Worship, Attack etc"}),(0,a.jsxs)(l.Z,{direction:"row",gap:2,justifyContent:"space-between",children:[(0,a.jsx)(l.Z,{sx:{maxWidth:p||u?C.s:"100%"},children:(0,a.jsxs)(y,{children:[(0,a.jsx)(S,{InputProps:{endAdornment:(0,a.jsx)(w,{onClick:()=>r(""),position:"end",children:(0,a.jsx)(m.Z,{})})},label:"Enter Card stat..",type:"text",value:n,onChange:t=>{let{target:e}=t;return r(null==e?void 0:e.value)}}),(0,a.jsx)(l.Z,{direction:"row",my:2,gap:1,flexWrap:"wrap",children:["Show All","Afk","Choppin","Mining","Fishing","Catching","Trapping","Cooking","Worship","Lab","Crystal Mob","Accuracy","Money","Card Drop","Drop Rate","Monster Exp","Skill Exp","Defence","Damage","Dungeon","STR","AGI","WIS","LUK"].map((t,e)=>(0,a.jsx)(o.Z,{sx:{borderRadius:"8px",height:24,minWidth:60,maxWidth:150,border:"1px solid gray"},size:"small",variant:"outlined",label:t,onClick:()=>{r("Show All"===t?"":t)}},t+""+e))}),(0,a.jsx)("div",{className:"cards",children:(null===(t=Object.keys(k))||void 0===t?void 0:t.length)>0?Z.map((t,n)=>{let r=k[t];if(!r||(null==r?void 0:r.length)===0)return null;let s="Card Sets"===t;return(0,a.jsxs)(i.Fragment,{children:[s?(0,a.jsx)(c.Z,{my:1,variant:"h4",children:"Card Sets"}):(0,a.jsx)("img",{src:"".concat(h.prefix,"etc/").concat(t,"_Card_Header.png"),style:{margin:"15px 0 10px 0"},alt:""}),(0,a.jsx)(l.Z,{direction:"row",flexWrap:"wrap",gap:2,sx:{maxWidth:600},children:r.map((t,n)=>{var r,i,l,o,c;let{displayName:d,name:u,realIndex:p}=t,{stars:h,amount:x,nextLevelReq:m}=(null==e?void 0:null===(i=e.account)||void 0===i?void 0:null===(r=i.cards)||void 0===r?void 0:r[d])||{};return s&&(h=Math.floor((null==g?void 0:null===(l=g["Card Sets"][p])||void 0===l?void 0:l.totalStars)/Math.max(g[u].length,1))-1,x=null==g?void 0:null===(o=g["Card Sets"][p])||void 0===o?void 0:o.totalStars,m=Math.floor(g[u].length)*(Math.min(5,Math.floor((null==g?void 0:null===(c=g["Card Sets"][p])||void 0===c?void 0:c.totalStars)/Math.max(g[u].length,1)))+1)),(0,a.jsx)("div",{style:{position:"relative"},children:(0,a.jsx)(f.iy,{nextLevelReq:m,amount:x,variant:s?"cardSet":"",showInfo:!0,...t,stars:h})},d+""+n)})})]},t+""+n)}):(0,a.jsx)("div",{className:"not-found",children:"Please try another phrase"})})]})}),u||p?(0,a.jsxs)(d.Z,{sx:{backgroundColor:h.isProd?"":"#d73333",width:u?300:p?160:0,height:600},children:[u?(0,a.jsx)(b.a,{client:"ca-pub-1842647313167572",slot:"8677007036"}):null,p&&!u?(0,a.jsx)(b.a,{client:"ca-pub-1842647313167572",slot:"3679847131"}):null]}):null]})]})}let S=(0,g.Z)(u.Z)(_templateObject()),w=(0,g.Z)(p.Z)(_templateObject1()),y=g.Z.main(_templateObject2())}},function(t){t.O(0,[166,9774,2888,179],function(){return t(t.s=65372)}),_N_E=t.O()}]);