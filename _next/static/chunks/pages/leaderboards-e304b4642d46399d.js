(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[5983],{18131:function(e,n,a){(window.__NEXT_P=window.__NEXT_P||[]).push(["/leaderboards",function(){return a(15362)}])},30509:function(e,n,a){"use strict";var r=a(85893),l=a(67294),t=a(31002),i=a(29676),o=a(40044),d=a(30925),s=a(27709),c=a(11163);n.Z=e=>{var n;let{tabs:a,components:u,icons:h,children:x,onTabChange:g,forceScroll:p,orientation:v="horizontal",iconsOnly:m,queryKey:b="t",clearOnChange:j=[],disableQuery:f=!1}=e,C=(0,t.Z)(e=>e.breakpoints.down("md"),{noSsr:!0}),Z=(0,c.useRouter)(),[y,w]=(0,l.useState)(0),_=Z.query[b],M=a.findIndex(e=>e===_),k=f?y:M>=0?M:0;(0,l.useEffect)(()=>{f||_||Z.replace({pathname:Z.pathname,query:{...Z.query,[b]:a[k]}},void 0,{shallow:!0})},[_,b,a,k,Z,f]);let S=Array.isArray(x)?x:[x];return(0,r.jsxs)(s.Z,{sx:"vertical"===v?{flexGrow:1,display:"flex"}:{},children:[(0,r.jsx)(i.Z,{centered:!C||C&&a.length<4,scrollButtons:!0,allowScrollButtonsMobile:!0,sx:{marginBottom:3},variant:C&&a.length>=4||p?"scrollable":"standard",value:k,onChange:(e,n)=>{if(f)w(n);else{let e={...Z.query,[b]:a[n]};j.forEach(n=>delete e[n]),Z.push({pathname:Z.pathname,query:e},void 0,{shallow:!0})}g&&g(n)},children:null===(n=null!=u?u:a)||void 0===n?void 0:n.map((e,n)=>(0,r.jsx)(o.Z,{iconPosition:"start",icon:(null==h?void 0:h[n])?(0,r.jsx)("img",{src:"".concat(d.prefix).concat(null==h?void 0:h[n],".png")}):null,wrapped:!0,label:m?"":e,sx:{minWidth:62}},"".concat(null==e?void 0:e[n],"-").concat(n)))}),g?x:null==S?void 0:S.map((e,n)=>n===k?e:null)]})}},15362:function(e,n,a){"use strict";a.r(n),a.d(n,{default:function(){return leaderboards}});var r=a(85893),l=a(12957),t=a(66242),i=a(44267),o=a(23972),d=a(18979),s=a(69702),c=a(50135),u=a(51233),h=a(98456),x=a(30509),g=a(82729),p=a(67294),v=a(18843),m=a(97212),b=a(98619),j=a(23795),f=a(48885),C=a(59334),Z=a(67720),y=a(40360),w=a(30925),_=a(27709),M=a(61599);function _templateObject(){let e=(0,g._)(["\n  display: ",";\n  align-items: center;\n  justify-content: center;\n  background-color: ",";\n  border-radius: 50%;\n  width: 24px;\n  height: 24px;\n"]);return _templateObject=function(){return e},e}let specialNotation=(e,n)=>"bits"===e?(0,w.notateNumber)(n,"bits"):"dropRate"===e?(0,w.notateNumber)(n,"MultiplierInfo"):(0,w.notateNumber)(n),k=(0,M.Z)(_.Z,{shouldForwardProp:e=>"inline"!==e})(_templateObject(),e=>{let{inline:n}=e;return n?"inline-flex":"flex"},e=>{let{bgColor:n}=e;return n||"#ffffff21"});var Leaderboard=e=>{let{leaderboards:n,loggedMainChar:a,searchedChar:l}=e;return(0,r.jsx)(y.Z,{sx:{width:"100%",margin:"0 auto",justifyContent:"center"},container:!0,rowSpacing:3,columnSpacing:{xs:1,xl:2},children:Object.entries(n||{}).map((e,n)=>{var t;let[i,d]=e,s={},c=d.map((e,n)=>{let r=e.mainChar,t=r===a,i=r===l;return(t||i)&&n>=10&&(s[r]=n+1),{...e,...t&&{loggedMainChar:!0},...i&&{searchedChar:!0},index:n+1}}),u=null===(t=Object.entries(s))||void 0===t?void 0:t.map(e=>{let[n,r]=e,l=null==d?void 0:d.find(e=>(null==e?void 0:e.mainChar)===n),t=l.mainChar===a?"loggedMainChar":"searchedChar";return{...l,[t]:!0,index:r}},[]),h=null==c?void 0:c.slice(0,10).concat(u),x=(null==d?void 0:d.length)===0;return(0,r.jsxs)(_.Z,{sx:{display:"grid","--auto-grid-min-size":"18rem",gridTemplateColumns:"repeat(auto-fill, minmax(var(--auto-grid-min-size), 1fr))",alignSelf:"flex-start",gap:"1rem"},children:[(0,r.jsx)(o.Z,{textAlign:"center",variant:"h5",mt:{xs:3,lg:0},mb:{xs:3,lg:1},children:i.camelToTitleCase()}),x?(0,r.jsx)(o.Z,{textAlign:"center",mt:5,variant:"h6",children:"Nothing here yet"}):(0,r.jsx)(r.Fragment,{children:(0,r.jsx)(v.Z,{dense:!0,disablePadding:!0,children:h.map((e,n)=>{let a=(null==e?void 0:e[i])||0,l=0===n?"data/Trophie.png":1===n?"data/G2icon40.png":2===n?"data/G2icon39.png":"";return(0,r.jsxs)(p.Fragment,{children:[(0,r.jsx)(m.ZP,{disablePadding:!0,sx:{borderRadius:0===n?"8px 8px 0 0":n===h.length-1?"0 0 8px 8px":"","&:hover":{borderRadius:0===n?"8px 8px 0 0":n===h.length-1?"0 0 8px 8px":""},mb:(null==e?void 0:e.loggedMainChar)||(null==e?void 0:e.searchedChar)?.8:0,backgroundColor:(null==e?void 0:e.loggedMainChar)||(null==e?void 0:e.searchedChar)?"#12141c":"#1e262e",outline:(null==e?void 0:e.loggedMainChar)||(null==e?void 0:e.searchedChar)?"2px solid":"none",outlineColor:(null==e?void 0:e.loggedMainChar)?"#007E85":(null==e?void 0:e.searchedChar)?"#cd861b":""},secondaryAction:(0,r.jsx)(o.Z,{sx:{pr:2},variant:"body2",children:specialNotation(i,a)}),children:(0,r.jsxs)(b.Z,{component:j.Z,target:"_blank",href:"https://idleontoolbox.com?profile=".concat(null==e?void 0:e.mainChar),disableGutters:!0,sx:{pl:2,py:.5,borderRadius:"inherit"},children:[(0,r.jsx)(f.Z,{children:l?(0,r.jsx)("img",{width:24,height:24,style:{objectFit:"contain"},src:"".concat(w.prefix).concat(l),alt:""}):(0,r.jsx)(k,{inline:!0,children:(0,r.jsx)(o.Z,{variant:"body2",children:(null==e?void 0:e.index)?null==e?void 0:e.index:n+4})})}),(0,r.jsx)(C.Z,{primary:null==e?void 0:e.mainChar,slotProps:{primary:{variant:"body1"}}})]})}),n<h.length-1?(0,r.jsx)(Z.Z,{component:"li"}):null]},"".concat(i,"-").concat(n))})})})]},"".concat(i,"-").concat(n))})})},S=a(21480),L=a(2962),O=a(94967);let E=(0,l.D)({trim:!0,limit:50}),N=["general","tasks","skills","character","misc"];var leaderboards=()=>{var e,n,a;let{state:l}=(0,p.useContext)(S.I),g=null==l?void 0:null===(n=l.characters)||void 0===n?void 0:null===(e=n[0])||void 0===e?void 0:e.name,[v,m]=(0,p.useState)(null),[b,j]=p.useState(""),[f,C]=(0,p.useState)(""),[Z,y]=(0,p.useState)("general");return(0,p.useEffect)(()=>{let getLeaderboards=async()=>{try{let e=await (0,O.$E)(Z);m(e),j("")}catch(e){j("Error has occurred while getting leaderboards")}};getLeaderboards()},[Z]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(L.PB,{title:"Leaderboards | Idleon Toolbox",description:"Leaderboards for Legends Of Idleon MMO"}),(0,r.jsx)(t.Z,{variant:"outlined",sx:{width:"180px",margin:"16px auto",borderColor:"success.light"},children:(0,r.jsxs)(i.Z,{sx:{"&:last-child":{p:1}},children:[(0,r.jsx)(o.Z,{textAlign:"center",sx:{fontSize:14},children:" Uploaded accounts:"}),(0,r.jsx)(o.Z,{textAlign:"center",variant:"body2",component:"div",children:(null==v?void 0:v.totalUsers)?null==v?void 0:v.totalUsers:(0,r.jsx)(d.Z,{sx:{width:100,margin:"0 auto"},variant:"text"})})]})}),(0,r.jsx)(_.Z,{sx:{width:"fit-content",margin:"16px auto",border:"none"},children:(0,r.jsx)(s.Z,{loading:!(null==v?void 0:v.totalUsers),options:(null===(a=Object.values((null==v?void 0:v[Z])||{}))||void 0===a?void 0:a[0])||[],getOptionLabel:e=>e.mainChar,id:"user-search",filterOptions:E,sx:{width:230},value:f||null,onChange:(e,n)=>C(n),renderInput:e=>(0,r.jsx)(c.Z,{...e,label:"Search by character name",variant:"standard"})})}),(0,r.jsxs)(x.Z,{tabs:["General","Tasks","Skills","Character","Misc"],onTabChange:e=>{y(null==N?void 0:N[e]),m(null),j("")},children:[(0,r.jsx)(Leaderboard,{leaderboards:null==v?void 0:v.general,loggedMainChar:g,searchedChar:null==f?void 0:f.mainChar}),(0,r.jsx)(Leaderboard,{leaderboards:null==v?void 0:v.tasks,loggedMainChar:g,searchedChar:null==f?void 0:f.mainChar}),(0,r.jsx)(Leaderboard,{leaderboards:null==v?void 0:v.skills,loggedMainChar:g,searchedChar:null==f?void 0:f.mainChar}),(0,r.jsx)(Leaderboard,{leaderboards:null==v?void 0:v.character,loggedMainChar:g,searchedChar:null==f?void 0:f.mainChar}),(0,r.jsx)(Leaderboard,{leaderboards:null==v?void 0:v.misc,loggedMainChar:g,searchedChar:null==f?void 0:f.mainChar})]}),v||b?b?(0,r.jsx)(o.Z,{color:"error.light",textAlign:"center",variant:"h6",children:b}):null:(0,r.jsx)(u.Z,{alignItems:"center",justifyContent:"center",mt:3,children:(0,r.jsx)(h.Z,{})})]})}}},function(e){e.O(0,[9702,5935,9774,2888,179],function(){return e(e.s=18131)}),_N_E=e.O()}]);