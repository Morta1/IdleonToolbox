(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3050],{68167:function(e,n,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/tools/active-drop-calculator",function(){return t(45941)}])},88946:function(e,n,t){"use strict";var r=t(85893),l=t(51233),a=t(23972),i=t(67720),o=t(30925),s=t(64885),c=t(2511);let ExtraData=e=>{let{name:n,perHour:t,perDay:s,perGoal:c}=e;return(0,r.jsxs)(l.Z,{children:[(0,r.jsx)(a.Z,{variant:"body1",children:(0,o.cleanUnderscore)(n)}),(0,r.jsx)(i.Z,{sx:{my:1}}),t?(0,r.jsxs)(a.Z,{variant:"body2",children:[(0,o.numberWithCommas)(t.toFixed(2))," / hr"]}):null,s?(0,r.jsxs)(a.Z,{variant:"body2",children:[(0,o.numberWithCommas)(s.toFixed(2))," / day"]}):null,c?(0,r.jsxs)(a.Z,{variant:"body2",children:[c>0?"".concat(c.toFixed(2)," hours to goal"):"Goal reached"," "]}):null]})};n.Z=e=>{let{inventory:n,inventoryLength:t,inventorySlots:i,amountKey:d="amount"}=e;return(0,r.jsxs)(l.Z,{sx:{width:250},children:[i?(0,r.jsx)(s.uQ,{title:"Capacity",value:"".concat(t||(null==n?void 0:n.length)||0,"/").concat(i)}):null,(0,r.jsx)(l.Z,{sx:{mt:1},direction:"row",flexWrap:"wrap",children:null==n?void 0:n.map((e,n)=>(0,r.jsx)(c.Z,{title:(0,r.jsx)(ExtraData,{...e}),children:(0,r.jsxs)(l.Z,{alignItems:"center",sx:{border:"1px solid rgb(255 255 255 / 12%)",width:"25%",p:1},children:[(0,r.jsx)("img",{width:32,height:32,src:"".concat(o.prefix,"data/").concat(null==e?void 0:e.rawName,".png"),alt:""}),(0,r.jsx)(a.Z,{children:(0,o.notateNumber)(null==e?void 0:e[d])})]})},(null==e?void 0:e.rawName)+""+n))})]})}},64885:function(e,n,t){"use strict";t.d(n,{Gr:function(){return MissingData},M5:function(){return v},Wd:function(){return PlayersList},Ye:function(){return CardTitleAndValue},iy:function(){return CardAndBorder},j8:function(){return j},tq:function(){return Breakdown},u3:function(){return TalentTooltip},uQ:function(){return TitleAndValue},wD:function(){return CenteredStack}});var r=t(82729),l=t(85893),a=t(67294),i=t(30925),o=t(51233),s=t(23972),c=t(19529),d=t(66242),u=t(44267),x=t(67720),m=t(61599),h=t(2511),p=t(54685);function _templateObject(){let e=(0,r._)(["\n  & .MuiBadge-badge {\n    background-color: #d5d5dc;\n    color: rgba(0, 0, 0, 0.87);\n  }\n"]);return _templateObject=function(){return e},e}function _templateObject1(){let e=(0,r._)(["\n  height: 20px;\n  object-fit: contain;\n"]);return _templateObject1=function(){return e},e}function _templateObject2(){let e=(0,r._)(["\n  width: 56px;\n  height: 72px;\n  object-fit: contain;\n  opacity: ",";\n"]);return _templateObject2=function(){return e},e}function _templateObject3(){let e=(0,r._)(["\n  position: absolute;\n  left: 50%;\n  top: -3px;\n  pointer-events: none;\n  transform: translateX(-50%);\n"]);return _templateObject3=function(){return e},e}let v=(0,a.forwardRef)((e,n)=>{let{stat:t,icon:r,img:a,title:c="",...d}=e;return(0,l.jsx)(h.Z,{title:c,children:(0,l.jsxs)(o.Z,{alignItems:"center",...d,ref:n,style:{position:"relative",width:"fit-content"},children:[(0,l.jsx)("img",{...a,src:"".concat(i.prefix,"data/").concat(r,".png"),alt:""}),(0,l.jsx)(s.Z,{variant:"body1",component:"span",children:t})]})})});v.displayName="IconWithText";let TitleAndValue=e=>{let{title:n,value:t,boldTitle:r,titleStyle:a={},valueStyle:i={}}=e;return(0,l.jsxs)(o.Z,{direction:"row",flexWrap:"wrap",alignItems:"center",children:[n?(0,l.jsxs)(s.Z,{sx:a,fontWeight:r?"bold":500,component:"span",children:[n,":\xa0"]}):null,(0,l.jsx)(s.Z,{fontSize:15,component:"span",sx:i,children:t})]})},j=(0,m.Z)(c.Z)(_templateObject()),CardAndBorder=e=>{let{cardName:n,stars:t,cardIndex:r,name:a,variant:o,rawName:s,amount:c,nextLevelReq:d}=e,u="cardSet"===o?"".concat(i.prefix,"data/").concat(s,".png"):"".concat(i.prefix,"data/2Cards").concat(r,".png");return(0,l.jsxs)(l.Fragment,{children:[t>0?(0,l.jsx)(f,{src:"".concat(i.prefix,"data/CardEquipBorder").concat(t,".png"),alt:""}):null,(0,l.jsx)(h.Z,{title:(0,l.jsx)(CardTooltip,{...e,cardName:"cardSet"===o?a:n,nextLevelReq:d,amount:c}),children:(0,l.jsx)(Z,{isCardSet:"cardSet"===o,amount:c,src:u,alt:""})})]})},CardTooltip=e=>{let{displayName:n,effect:t,bonus:r,stars:a,showInfo:c,nextLevelReq:d,amount:u}=e,x=r;return c&&(x=(0,p.BZ)({bonus:r,stars:a})),(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(s.Z,{fontWeight:"bold",variant:"h6",children:(0,i.cleanUnderscore)(n)}),(0,l.jsx)(s.Z,{children:(0,i.cleanUnderscore)(t.replace("{",x))}),c?(0,l.jsx)(o.Z,{mt:1,direction:"row",gap:1,flexWrap:"wrap",children:[1,2,3,4,5,6].map((e,t)=>(0,l.jsxs)(o.Z,{alignItems:"center",justifyContent:"space-between",children:[0===t?(0,l.jsx)(s.Z,{children:"Base"}):(0,l.jsx)(g,{src:"".concat(i.prefix,"etc/Star").concat(t,".png"),alt:""}),(0,l.jsx)(s.Z,{children:r*(t+1)})]},"".concat(n,"-").concat(t)))}):null,u>=d?(0,l.jsxs)(o.Z,{children:["You've collected ",(0,i.numberWithCommas)(u)," cards"]}):d>0?(0,l.jsxs)(o.Z,{children:["Progress: ",(0,i.numberWithCommas)(u)," / ",(0,i.numberWithCommas)(d)]}):null]})},g=m.Z.img(_templateObject1()),Z=m.Z.img(_templateObject2(),e=>{let{amount:n,isCardSet:t}=e;return n||t?1:.5}),f=m.Z.img(_templateObject3()),TalentTooltip=e=>{let{level:n,funcX:t,x1:r,x2:a,funcY:c,y1:d,y2:u,description:x,name:m,talentId:h}=e,p=n>0?(0,i.growth)(t,n,r,a):0,v=n>0?(0,i.growth)(c,n,d,u):0;return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsxs)(o.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,l.jsx)("img",{src:"".concat(i.prefix,"data/UISkillIcon").concat(h,".png"),alt:""}),(0,l.jsx)(s.Z,{fontWeight:"bold",variant:"h6",children:(0,i.cleanUnderscore)(m)})]}),(0,l.jsx)(s.Z,{children:(0,i.cleanUnderscore)(x).replace("{",p).replace("}",v)})]})},PlayersList=e=>{let{players:n,characters:t}=e;return(0,l.jsx)(o.Z,{gap:1,direction:"row",children:n.map(e=>{var n,r;let{index:a}=e;return(0,l.jsx)(h.Z,{title:null==t?void 0:null===(n=t[a])||void 0===n?void 0:n.name,children:(0,l.jsx)("img",{style:{width:24,height:24},src:"".concat(i.prefix,"data/ClassIcons").concat(null==t?void 0:null===(r=t[a])||void 0===r?void 0:r.classIndex,".png"),alt:""})},name+"-head-"+a)})})},MissingData=e=>{let{name:n}=e;return(0,l.jsxs)(s.Z,{variant:"h3",children:["Your account is missing data for ",n]})},CardTitleAndValue=e=>{let{variant:n,raised:t,cardSx:r,imgOnly:a,imgStyle:c,title:x,value:m,children:p,icon:v,tooltipTitle:j,stackProps:g,contentPadding:Z}=e;return(0,l.jsx)(h.Z,{title:j||"",children:(0,l.jsx)(d.Z,{variant:n,raised:t,sx:{my:{xs:0,md:3},mb:{xs:2},width:"fit-content",...r},children:(0,l.jsx)(u.Z,{sx:{"&:last-child":Z?{p:Z}:{}},children:(0,l.jsxs)(o.Z,{sx:{display:g?"flex":"block",...g||{}},children:[x?(0,l.jsx)(s.Z,{sx:{fontSize:14},color:"text.secondary",gutterBottom:!0,component:"span",children:x}):null,m||a?v?(0,l.jsxs)(o.Z,{direction:"row",gap:2,alignItems:"center",children:[(0,l.jsx)("img",{style:{objectFit:"contain",...c},src:"".concat(i.prefix).concat(v),alt:""}),m?(0,l.jsx)(s.Z,{component:"div",children:m}):null]}):(0,l.jsx)(s.Z,{component:"div",children:m}):p]})})})})},Breakdown=e=>{let{breakdown:n,titleStyle:t={},notation:r="Big"}=e;return(0,l.jsx)(l.Fragment,{children:null==n?void 0:n.map((e,n)=>{let{name:a,value:o,title:c}=e;return c?(0,l.jsx)(s.Z,{sx:{fontWeight:500},children:c},"".concat(a,"-").concat(n)):a?(0,l.jsx)(TitleAndValue,{titleStyle:{width:120,...t},title:a,value:isNaN(o)?o:(0,i.notateNumber)(o,r)},"".concat(a,"-").concat(n)):(0,l.jsx)(x.Z,{sx:{my:1,bgcolor:"black"}},"".concat(a,"-").concat(n))})})},CenteredStack=e=>{let{direction:n="row",children:t}=e;return(0,l.jsx)(o.Z,{gap:1,direction:n,alignItems:"center",children:t})}},45941:function(e,n,t){"use strict";t.r(n);var r=t(85893),l=t(2962),a=t(67294),i=t(31002),o=t(51233),s=t(53213),c=t(95603),d=t(23972),u=t(67720),x=t(50135),m=t(30925),h=t(18972),p=t(21480),v=t(88946),j=t(51846),g=t(76947),Z=t(2511),f=t(69417),y=t(40929),b=t(7336);let consolidateItems=e=>{let n=new Map;return Array.isArray(e)?(e.forEach(e=>{let t=e.displayName;if(n.has(t)){let r=n.get(t);r.amount+=e.amount}else n.set(t,{...e})}),Array.from(n.values())):null};function compareInventories(e,n,t,r){if(!Array.isArray(e)||!Array.isArray(n))return[];let l=consolidateItems(e),a=consolidateItems(n),i=new Map(l.map(e=>[e.displayName,e])),o=new Map(a.map(e=>[e.displayName,e])),s=[];return new Set([...i.keys(),...o.keys()]).forEach(e=>{let n=i.get(e)||{displayName:e,amount:0},l=o.get(e)||{displayName:e,amount:0},a=l.amount-n.amount;if(0!==a){let e=a/((Date.now()-t)/1e3/60)*60;s.push({...n,snapshotInventoryItem:n.amount?n:null,currentInventoryItem:l.amount?l:null,snapshotInventoryAmount:n.amount,currentInventoryAmount:l.amount,difference:a,perHour:e,perDay:24*e,perGoal:(Number(r.replace(/,/g,""))-a)/e,status:a>0?"increased":"decreased"})}}),s}n.default=()=>{var e,n,t,w,I,C,_,N,T,k,S;let{state:W}=(0,a.useContext)(p.I),A=(0,i.Z)(e=>e.breakpoints.down("lg"),{noSsr:!0}),[O,B]=(0,b.I)({key:"activeDropGoal",defaultValue:""}),[D,E]=(0,b.I)({key:"activeDropPlayer",defaultValue:null}),[F,M]=(0,a.useState)("0");(0,a.useEffect)(()=>{D&&M((null==D?void 0:D.playerId)+"")},[D]);let P=compareInventories(null==D?void 0:D.inventory,null==W?void 0:null===(n=W.characters)||void 0===n?void 0:null===(e=n[F])||void 0===e?void 0:e.inventory,null==D?void 0:D.snapshotTime,O);return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(l.PB,{title:"Active Drop Calculator | Idleon Toolbox",description:"Calculate how much items you get when playing actively"}),(0,r.jsxs)(o.Z,{direction:"row",alignItems:"center",gap:1,flexWrap:"wrap",children:[(0,r.jsx)(s.Z,{size:"small",sx:{width:230,paddingRight:2,["& .".concat(c.Z.select)]:{display:"flex",alignItems:"center"}},value:F,onChange:e=>M(e.target.value),children:null==W?void 0:null===(t=W.characters)||void 0===t?void 0:t.map((e,n)=>(0,r.jsx)(h.Z,{value:null==e?void 0:e.playerId,selected:F===(null==e?void 0:e.playerId),children:(0,r.jsxs)(o.Z,{direction:"row",alignItems:"center",gap:2,children:[(0,r.jsx)("img",{src:"".concat(m.prefix,"data/ClassIcons").concat(null==e?void 0:e.classIndex,".png"),alt:"",width:32,height:32}),(0,r.jsx)(d.Z,{children:null==e?void 0:e.name})]})},(null==e?void 0:e.name)+n))}),(0,r.jsx)(u.Z,{orientation:"vertical",flexItem:!0,sx:{ml:2,display:{xs:"none",sm:"block"}}}),(0,r.jsx)(x.Z,{value:O,onChange:e=>{let n=e.target.value.replace(/,/g,"");isNaN(n)||""===n?B(""):B((0,m.numberWithCommas)(Number(n)))},label:"Goal",size:"small"}),(0,r.jsx)(u.Z,{orientation:"vertical",flexItem:!0,sx:{ml:2,display:{xs:"none",sm:"block"}}}),(0,r.jsxs)(o.Z,{gap:.5,sx:{ml:2},children:[(0,r.jsxs)(o.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,r.jsx)(f.Z,{sx:{width:"fit-content"},variant:"contained",size:"small",onClick:()=>{var e;E({...null==W?void 0:null===(e=W.characters)||void 0===e?void 0:e[F],snapshotTime:new Date().getTime()})},startIcon:(0,r.jsx)(j.Z,{}),children:"Save snapshot"}),(0,r.jsx)(Z.Z,{title:"You can only take a snapshot of one character at a time.",children:(0,r.jsx)(g.Z,{})})]}),(null==D?void 0:D.snapshotTime)?(0,r.jsxs)(d.Z,{variant:"caption",children:[null==D?void 0:D.name," - ",(0,y.Z)(null==D?void 0:D.snapshotTime,"dd/MM/yyyy HH:mm:ss")]}):null]})]}),(0,r.jsx)(u.Z,{sx:{my:2}}),(0,r.jsxs)(o.Z,{direction:"row",alignItems:"center",gap:1,mb:2,children:[(0,r.jsx)(d.Z,{variant:"h6",children:"Total Items"}),(0,r.jsx)(Z.Z,{title:"This is a consolidated view of your items, where identical items have been combined and their total quantities summed.",children:(0,r.jsx)(g.Z,{})})]}),(0,r.jsxs)(o.Z,{direction:A?"column":"row",gap:1,flexWrap:"wrap",divider:A?null:(0,r.jsx)(u.Z,{flexItem:!0,orientation:"vertical",sx:{mx:2}}),children:[(0,r.jsxs)(o.Z,{children:[(0,r.jsx)(d.Z,{variant:"body1",sx:{fontWeight:"bold"},children:"Snapshot"}),(null==D?void 0:D.playerId)+""===F?(0,r.jsx)(v.Z,{inventory:consolidateItems(null==D?void 0:D.inventory),inventoryLength:null==D?void 0:null===(w=D.inventory)||void 0===w?void 0:w.length,inventorySlots:null==D?void 0:D.inventorySlots}):(0,r.jsx)(d.Z,{variant:"body1",children:"No snapshot available for this character"})]}),(0,r.jsxs)(o.Z,{children:[(0,r.jsx)(d.Z,{variant:"body1",sx:{fontWeight:"bold"},children:"Current"}),(0,r.jsx)(v.Z,{inventory:consolidateItems(null==W?void 0:null===(C=W.characters)||void 0===C?void 0:null===(I=C[F])||void 0===I?void 0:I.inventory),inventoryLength:null==W?void 0:null===(T=W.characters)||void 0===T?void 0:null===(N=T[F])||void 0===N?void 0:null===(_=N.inventory)||void 0===_?void 0:_.length,inventorySlots:null==W?void 0:null===(S=W.characters)||void 0===S?void 0:null===(k=S[F])||void 0===k?void 0:k.inventorySlots})]}),(null==D?void 0:D.playerId)+""===F?(0,r.jsxs)(o.Z,{children:[(0,r.jsxs)(o.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,r.jsx)(d.Z,{variant:"body1",sx:{fontWeight:"bold"},children:"Result"}),(0,r.jsx)(Z.Z,{title:"Hover over each item to see more stats",children:(0,r.jsx)(g.Z,{size:18})})]}),(0,r.jsx)(d.Z,{variant:"body1",children:"Cloudsave in-game to update the results"}),(0,r.jsx)(v.Z,{inventory:P,amountKey:"difference"})]}):null]})]})}}},function(e){e.O(0,[5021,9774,2888,179],function(){return e(e.s=68167)}),_N_E=e.O()}]);