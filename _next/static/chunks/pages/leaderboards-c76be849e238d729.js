(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[5983],{52965:function(e,n,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/leaderboards",function(){return r(68472)}])},68575:function(e,n,r){"use strict";var t=r(85893),l=r(67294),a=r(98396),i=r(11703),o=r(40044);n.Z=e=>{let{tabs:n,children:r,onTabChange:d}=e,[c,s]=(0,l.useState)(0),h=(0,a.Z)(e=>e.breakpoints.down("md"),{noSsr:!0}),u=Array.isArray(r)?r:[r];return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(i.Z,{centered:!h||h&&n.length<4,scrollButtons:!0,allowScrollButtonsMobile:!0,sx:{marginBottom:3},variant:h&&n.length>4?"scrollable":"standard",value:c,onChange:(e,n)=>{s(n),d&&d(n)},children:null==n?void 0:n.map((e,n)=>(0,t.jsx)(o.Z,{label:e},"".concat(e,"-").concat(n)))}),d?r:null==u?void 0:u.map((e,n)=>n===c?e:null)]})}},68472:function(e,n,r){"use strict";r.r(n),r.d(n,{default:function(){return leaderboards}});var t=r(85893),l=r(21785),a=r(15861),i=r(66242),o=r(44267),d=r(417),c=r(50135),s=r(51233),h=r(98456),u=r(68575),x=r(82729),g=r(67294),v=r(78462),p=r(97212),m=r(59334),j=r(23795),b=r(90629),f=r(81426),C=r(30925),Z=r(87357),_=r(61599);function _templateObject(){let e=(0,x._)(["\n  display: ",";\n  align-items: center;\n  justify-content: center;\n  background-color: ",";\n  border-radius: 50%;\n  width: 32px;\n  height: 32px;\n"]);return _templateObject=function(){return e},e}function _templateObject1(){let e=(0,x._)(["\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex-direction: column;\n  border-radius: 12px;\n  box-shadow: none;\n  height: ","px;\n  order: ",";\n"]);return _templateObject1=function(){return e},e}function _templateObject2(){let e=(0,x._)(["\n  display: flex;\n  padding: 8px;\n  margin: auto auto 0 auto;\n  justify-content: center;\n  border-radius: 12px 12px 0 0;\n  box-shadow: none;\n  width: 100%;\n  background-color: ",";\n  outline: ",";\n  outline-color: ","\n"]);return _templateObject2=function(){return e},e}let w="#007E85",y="#cd861b",M="#12141c",TopThree=e=>{let{sectionName:n,topThree:r}=e;return(0,t.jsx)(f.Z,{container:!0,spacing:4,children:r.map((e,l)=>(0,t.jsx)(f.Z,{xs:(null==r?void 0:r.length)===1?12:4,order:0===l?2:1===l?1:3,alignSelf:"flex-end",children:(0,t.jsxs)(S,{height:0===l?125:1===l?115:105,children:[(0,t.jsxs)(s.Z,{sx:{height:"100%"},gap:1,alignItems:"center",justifyContent:"center",direction:"row",children:[(0,t.jsx)(a.Z,{children:l+1}),(0,t.jsx)(Z.Z,{sx:{display:"flex",alignItems:"center",justifyContent:"center"},children:(0,t.jsx)("img",{width:2===l?20:24,height:2===l?20:24,style:{objectFit:"contain"},src:"".concat(C.prefix).concat(0===l?"data/Trophie.png":1===l?"data/G2icon40.png":"data/G2icon39.png"),alt:""})})]}),(0,t.jsx)(k,{loggedMainChar:null==e?void 0:e.loggedMainChar,searchedChar:null==e?void 0:e.searchedChar,children:(0,t.jsxs)(s.Z,{justifyContent:"center",children:[(0,t.jsx)(a.Z,{textAlign:"center",sx:{mt:"auto"},children:(0,t.jsx)(j.Z,{color:"inherit",underline:"hover",target:"_blank",href:"https://idleontoolbox.com?profile=".concat(null==e?void 0:e.mainChar),children:null==e?void 0:e.mainChar})}),(0,t.jsx)(a.Z,{textAlign:"center",children:(0,C.notateNumber)(null==e?void 0:e[n])})]})})]})},"top-three-".concat(n,"-").concat(null==e?void 0:e.mainChar)))})},O=(0,_.Z)(Z.Z,{shouldForwardProp:e=>"inline"!==e})(_templateObject(),e=>{let{inline:n}=e;return n?"inline-flex":"flex"},e=>{let{bgColor:n}=e;return n||"#ffffff21"}),S=(0,_.Z)(b.Z,{shouldForwardProp:e=>"bgColor"!==e&&"order"!==e&&"inline"!==e})(_templateObject1(),e=>{let{height:n}=e;return n},e=>{let{order:n}=e;return n}),k=(0,_.Z)(b.Z,{shouldForwardProp:e=>"searchedChar"!==e&&"loggedMainChar"!==e})(_templateObject2(),e=>{let{outline:n}=e;return n?M:"#161826"},e=>{let{loggedMainChar:n,searchedChar:r}=e;return n||r?"3px solid":"none"},e=>{let{loggedMainChar:n,searchedChar:r}=e;return n?w:r?y:""});var Leaderboard=e=>{let{leaderboards:n,loggedMainChar:r,searchedChar:l}=e;return(0,t.jsx)(f.Z,{sx:{width:"100%",margin:"0 auto"},justifySelf:"center",container:!0,rowSpacing:3,columnSpacing:{lg:4,xl:12},children:Object.entries(n||{}).map((e,n)=>{var i;let[o,d]=e,c={},s=d.map((e,n)=>{let t=e.mainChar,a=t===r,i=t===l;return(a||i)&&n>=10&&(c[t]=n+1),{...e,...a&&{loggedMainChar:!0},...i&&{searchedChar:!0},index:n+1}}),h=null===(i=Object.entries(c))||void 0===i?void 0:i.map(e=>{let[n,t]=e,l=null==d?void 0:d.find(e=>(null==e?void 0:e.mainChar)===n),a=l.mainChar===r?"loggedMainChar":"searchedChar";return{...l,[a]:!0,index:t}},[]),u=null==s?void 0:s.toSpliced(3),x=null==s?void 0:s.slice(3,10).concat(h),g=(null==d?void 0:d.length)===0;return(0,t.jsxs)(f.Z,{xs:12,lg:6,xl:4,children:[(0,t.jsx)(a.Z,{textAlign:"center",variant:"h4",mt:{xs:3,lg:0},mb:{xs:3,lg:1},children:o.camelToTitleCase()}),g?(0,t.jsx)(t.Fragment,{children:(0,t.jsx)(a.Z,{textAlign:"center",mt:5,variant:"h6",children:"Nothing here yet"})}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(TopThree,{sectionName:o,topThree:u}),(0,t.jsx)(v.Z,{children:x.map((e,n)=>(0,t.jsx)(p.ZP,{sx:{mb:(null==e?void 0:e.loggedMainChar)||(null==e?void 0:e.searchedChar)?.8:0,backgroundColor:(null==e?void 0:e.loggedMainChar)||(null==e?void 0:e.searchedChar)?M:"#1a1d2a",outline:(null==e?void 0:e.loggedMainChar)||(null==e?void 0:e.searchedChar)?"2px solid":"none",outlineColor:(null==e?void 0:e.loggedMainChar)?w:(null==e?void 0:e.searchedChar)?y:""},secondaryAction:(0,t.jsx)(a.Z,{children:(0,C.notateNumber)(null==e?void 0:e[o])}),children:(0,t.jsxs)(m.Z,{children:[(0,t.jsx)(O,{inline:!0,sx:{mr:2},children:(null==e?void 0:e.index)?null==e?void 0:e.index:n+4})," ",(0,t.jsx)(j.Z,{color:"inherit",underline:"hover",target:"_blank",href:"https://idleontoolbox.com?profile=".concat(null==e?void 0:e.mainChar),children:null==e?void 0:e.mainChar})]})},"".concat(o,"-").concat(n)))})]})]},"".concat(o,"-").concat(n))})})},T=r(23513),A=r(2962),L=r(94967);let N=(0,l.D)({trim:!0,limit:50});var leaderboards=()=>{var e,n,r,l,x,v,p,m,j;let{state:b}=(0,g.useContext)(T.I),f=null==b?void 0:null===(n=b.characters)||void 0===n?void 0:null===(e=n[0])||void 0===e?void 0:e.name,[C,_]=g.useState(),[w,y]=g.useState(""),[M,O]=g.useState("");return(0,g.useEffect)(()=>{let getLeaderboards=async()=>{try{let e=await (0,L.RD)();_(e),y("")}catch(e){y("Error has occurred while getting leaderboards")}};getLeaderboards()},[]),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(A.PB,{title:"Leaderboards | Idleon Toolbox",description:"Leaderboards for Idleon MMO"}),(0,t.jsx)(a.Z,{textAlign:"center",variant:"h2",children:"Leaderboards"}),(0,t.jsx)(a.Z,{mb:3,textAlign:"center",sx:{fontSize:14},component:"div",variant:"caption",children:"* To participate in the leaderboards, please upload your profile with leaderboard consent."}),(null==C?void 0:null===(l=C.general)||void 0===l?void 0:null===(r=l.totalMoney)||void 0===r?void 0:r.length)?(0,t.jsx)(i.Z,{variant:"outlined",sx:{width:"fit-content",margin:"16px auto",borderColor:"success.light"},children:(0,t.jsx)(o.Z,{sx:{"&:last-child":{p:1}},children:(0,t.jsxs)(a.Z,{textAlign:"center",sx:{fontSize:14},component:"div",variant:"caption",children:["Uploaded accounts: ",null==C?void 0:null===(v=C.general)||void 0===v?void 0:null===(x=v.totalMoney)||void 0===x?void 0:x.length]})})}):null,(null==C?void 0:null===(m=C.general)||void 0===m?void 0:null===(p=m.totalMoney)||void 0===p?void 0:p.length)?(0,t.jsx)(Z.Z,{sx:{width:"fit-content",margin:"16px auto",border:"none"},children:(0,t.jsx)(d.Z,{options:null==C?void 0:null===(j=C.general)||void 0===j?void 0:j.totalMoney,getOptionLabel:e=>e.mainChar,id:"user-search",filterOptions:N,sx:{width:230},value:M||null,onChange:(e,n)=>O(n),renderInput:e=>(0,t.jsx)(c.Z,{...e,label:"Search by character name",variant:"standard"})})}):null,C?w?(0,t.jsx)(a.Z,{color:"error.light",textAlign:"center",variant:"h6",children:w}):(0,t.jsxs)(u.Z,{tabs:["General","Tasks","Skills"],children:[(0,t.jsx)(Leaderboard,{leaderboards:null==C?void 0:C.general,loggedMainChar:f,searchedChar:null==M?void 0:M.mainChar}),(0,t.jsx)(Leaderboard,{leaderboards:null==C?void 0:C.tasks,loggedMainChar:f,searchedChar:null==M?void 0:M.mainChar}),(0,t.jsx)(Leaderboard,{leaderboards:null==C?void 0:C.skills,loggedMainChar:f,searchedChar:null==M?void 0:M.mainChar})]}):(0,t.jsx)(s.Z,{alignItems:"center",justifyContent:"center",mt:3,children:(0,t.jsx)(h.Z,{})})]})}}},function(e){e.O(0,[417,9068,9774,2888,179],function(){return e(e.s=52965)}),_N_E=e.O()}]);