(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8591],{81458:function(r,e,t){"use strict";t.d(e,{Z:function(){return M}});var a=t(63366),n=t(87462),o=t(67294),i=t(86010),l=t(94780),s=t(70917),d=t(41796),u=t(98216),c=t(2734),b=t(90948),f=t(71657),v=t(1588),m=t(34867);function getLinearProgressUtilityClass(r){return(0,m.Z)("MuiLinearProgress",r)}(0,v.Z)("MuiLinearProgress",["root","colorPrimary","colorSecondary","determinate","indeterminate","buffer","query","dashed","dashedColorPrimary","dashedColorSecondary","bar","barColorPrimary","barColorSecondary","bar1Indeterminate","bar1Determinate","bar1Buffer","bar2Indeterminate","bar2Buffer"]);var h=t(85893);let g=["className","color","value","valueBuffer","variant"],_=r=>r,p,x,Z,y,C,j,k=(0,s.F4)(p||(p=_`
  0% {
    left: -35%;
    right: 100%;
  }

  60% {
    left: 100%;
    right: -90%;
  }

  100% {
    left: 100%;
    right: -90%;
  }
`)),w=(0,s.F4)(x||(x=_`
  0% {
    left: -200%;
    right: 100%;
  }

  60% {
    left: 107%;
    right: -8%;
  }

  100% {
    left: 107%;
    right: -8%;
  }
`)),P=(0,s.F4)(Z||(Z=_`
  0% {
    opacity: 1;
    background-position: 0 -23px;
  }

  60% {
    opacity: 0;
    background-position: 0 -23px;
  }

  100% {
    opacity: 1;
    background-position: -200px -23px;
  }
`)),useUtilityClasses=r=>{let{classes:e,variant:t,color:a}=r,n={root:["root",`color${(0,u.Z)(a)}`,t],dashed:["dashed",`dashedColor${(0,u.Z)(a)}`],bar1:["bar",`barColor${(0,u.Z)(a)}`,("indeterminate"===t||"query"===t)&&"bar1Indeterminate","determinate"===t&&"bar1Determinate","buffer"===t&&"bar1Buffer"],bar2:["bar","buffer"!==t&&`barColor${(0,u.Z)(a)}`,"buffer"===t&&`color${(0,u.Z)(a)}`,("indeterminate"===t||"query"===t)&&"bar2Indeterminate","buffer"===t&&"bar2Buffer"]};return(0,l.Z)(n,getLinearProgressUtilityClass,e)},getColorShade=(r,e)=>"inherit"===e?"currentColor":r.vars?r.vars.palette.LinearProgress[`${e}Bg`]:"light"===r.palette.mode?(0,d.$n)(r.palette[e].main,.62):(0,d._j)(r.palette[e].main,.5),$=(0,b.ZP)("span",{name:"MuiLinearProgress",slot:"Root",overridesResolver:(r,e)=>{let{ownerState:t}=r;return[e.root,e[`color${(0,u.Z)(t.color)}`],e[t.variant]]}})(({ownerState:r,theme:e})=>(0,n.Z)({position:"relative",overflow:"hidden",display:"block",height:4,zIndex:0,"@media print":{colorAdjust:"exact"},backgroundColor:getColorShade(e,r.color)},"inherit"===r.color&&"buffer"!==r.variant&&{backgroundColor:"none","&::before":{content:'""',position:"absolute",left:0,top:0,right:0,bottom:0,backgroundColor:"currentColor",opacity:.3}},"buffer"===r.variant&&{backgroundColor:"transparent"},"query"===r.variant&&{transform:"rotate(180deg)"})),B=(0,b.ZP)("span",{name:"MuiLinearProgress",slot:"Dashed",overridesResolver:(r,e)=>{let{ownerState:t}=r;return[e.dashed,e[`dashedColor${(0,u.Z)(t.color)}`]]}})(({ownerState:r,theme:e})=>{let t=getColorShade(e,r.color);return(0,n.Z)({position:"absolute",marginTop:0,height:"100%",width:"100%"},"inherit"===r.color&&{opacity:.3},{backgroundImage:`radial-gradient(${t} 0%, ${t} 16%, transparent 42%)`,backgroundSize:"10px 10px",backgroundPosition:"0 -23px"})},(0,s.iv)(y||(y=_`
    animation: ${0} 3s infinite linear;
  `),P)),N=(0,b.ZP)("span",{name:"MuiLinearProgress",slot:"Bar1",overridesResolver:(r,e)=>{let{ownerState:t}=r;return[e.bar,e[`barColor${(0,u.Z)(t.color)}`],("indeterminate"===t.variant||"query"===t.variant)&&e.bar1Indeterminate,"determinate"===t.variant&&e.bar1Determinate,"buffer"===t.variant&&e.bar1Buffer]}})(({ownerState:r,theme:e})=>(0,n.Z)({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left",backgroundColor:"inherit"===r.color?"currentColor":(e.vars||e).palette[r.color].main},"determinate"===r.variant&&{transition:"transform .4s linear"},"buffer"===r.variant&&{zIndex:1,transition:"transform .4s linear"}),({ownerState:r})=>("indeterminate"===r.variant||"query"===r.variant)&&(0,s.iv)(C||(C=_`
      width: auto;
      animation: ${0} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
    `),k)),S=(0,b.ZP)("span",{name:"MuiLinearProgress",slot:"Bar2",overridesResolver:(r,e)=>{let{ownerState:t}=r;return[e.bar,e[`barColor${(0,u.Z)(t.color)}`],("indeterminate"===t.variant||"query"===t.variant)&&e.bar2Indeterminate,"buffer"===t.variant&&e.bar2Buffer]}})(({ownerState:r,theme:e})=>(0,n.Z)({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left"},"buffer"!==r.variant&&{backgroundColor:"inherit"===r.color?"currentColor":(e.vars||e).palette[r.color].main},"inherit"===r.color&&{opacity:.3},"buffer"===r.variant&&{backgroundColor:getColorShade(e,r.color),transition:"transform .4s linear"}),({ownerState:r})=>("indeterminate"===r.variant||"query"===r.variant)&&(0,s.iv)(j||(j=_`
      width: auto;
      animation: ${0} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
    `),w)),I=o.forwardRef(function(r,e){let t=(0,f.Z)({props:r,name:"MuiLinearProgress"}),{className:o,color:l="primary",value:s,valueBuffer:d,variant:u="indeterminate"}=t,b=(0,a.Z)(t,g),v=(0,n.Z)({},t,{color:l,variant:u}),m=useUtilityClasses(v),p=(0,c.Z)(),x={},Z={bar1:{},bar2:{}};if(("determinate"===u||"buffer"===u)&&void 0!==s){x["aria-valuenow"]=Math.round(s),x["aria-valuemin"]=0,x["aria-valuemax"]=100;let r=s-100;"rtl"===p.direction&&(r=-r),Z.bar1.transform=`translateX(${r}%)`}if("buffer"===u&&void 0!==d){let r=(d||0)-100;"rtl"===p.direction&&(r=-r),Z.bar2.transform=`translateX(${r}%)`}return(0,h.jsxs)($,(0,n.Z)({className:(0,i.Z)(m.root,o),ownerState:v,role:"progressbar"},x,{ref:e},b,{children:["buffer"===u?(0,h.jsx)(B,{className:m.dashed,ownerState:v}):null,(0,h.jsx)(N,{className:m.bar1,ownerState:v,style:Z.bar1}),"determinate"===u?null:(0,h.jsx)(S,{className:m.bar2,ownerState:v,style:Z.bar2})]}))});var M=I},54213:function(r,e,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/task-board/tasks",function(){return t(62692)}])},89309:function(r,e,t){"use strict";var a=t(85893),n=t(87357),o=t(81458),i=t(23972);t(67294),e.Z=r=>{let{percent:e,bgColor:t,label:l=!0,sx:s,boxSx:d={},pre:u}=r;return(0,a.jsxs)(n.Z,{sx:{display:"flex",alignItems:"center",...d},children:[u,(0,a.jsx)(n.Z,{sx:{width:"100%",mr:l?1:0},children:(0,a.jsx)(o.Z,{sx:{width:"100%",height:10,borderRadius:5,"& .MuiLinearProgress-bar":{backgroundColor:t||""},...s},variant:"determinate",value:e>100?100:e})}),l?(0,a.jsx)(n.Z,{children:(0,a.jsx)(i.Z,{variant:"body2",color:"text.secondary",children:"".concat(Math.round(e),"%")})}):null]})}},30509:function(r,e,t){"use strict";var a=t(85893),n=t(67294),o=t(98396),i=t(11703),l=t(40044),s=t(30925),d=t(87357);e.Z=r=>{let{tabs:e,icons:t,children:u,onTabChange:c,forceScroll:b,orientation:f="horizontal",iconsOnly:v}=r,[m,h]=(0,n.useState)(0),g=(0,o.Z)(r=>r.breakpoints.down("md"),{noSsr:!0}),p=Array.isArray(u)?u:[u];return(0,a.jsxs)(d.Z,{sx:"vertical"===f?{flexGrow:1,display:"flex"}:{},children:[(0,a.jsx)(i.Z,{centered:!g||g&&e.length<4,scrollButtons:!0,allowScrollButtonsMobile:!0,sx:{marginBottom:3},variant:g&&e.length>4||b?"scrollable":"standard",value:m,onChange:(r,e)=>{h(e),c&&c(e)},children:null==e?void 0:e.map((r,e)=>(0,a.jsx)(l.Z,{iconPosition:"start",icon:(null==t?void 0:t[e])?(0,a.jsx)("img",{src:"".concat(s.prefix).concat(null==t?void 0:t[e],".png")}):null,wrapped:!0,label:v?"":r,sx:{minWidth:62}},"".concat(r,"-").concat(e)))}),c?u:null==p?void 0:p.map((r,e)=>e===m?r:null)]})}},62692:function(r,e,t){"use strict";t.r(e);var a=t(85893),n=t(67294),o=t(21480),i=t(30509),l=t(2962),s=t(51233),d=t(66242),u=t(44267),c=t(23972),b=t(30925),f=t(89309);e.default=()=>{var r,e,t;let{state:v}=(0,n.useContext)(o.I),[m,h]=(0,n.useState)(0);return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(l.PB,{title:"Tasks | Idleon Toolbox",description:"Keep track of your tasks progression"}),(0,a.jsx)(i.Z,{tabs:b.worldsArray,onTabChange:r=>{h(r)},children:(0,a.jsx)(s.Z,{index:m,direction:"row",flexWrap:"wrap",gap:3,justifyContent:"center",children:null==v?void 0:null===(t=v.account)||void 0===t?void 0:null===(e=t.tasksDescriptions)||void 0===e?void 0:null===(r=e[m])||void 0===r?void 0:r.map((r,e)=>{var t,n,o,i;let l,{stat:v,level:h,name:g,description:p,filler1:x,filler2:Z,breakpoints:y,meritReward:C}=r;if(e>=9)return null;let j=null!==(t=8===e?null==y?void 0:y[0]:null==y?void 0:y[h])&&void 0!==t?t:0;l=h===(null==y?void 0:y.length)&&8!==e?null===(o=Z.split("|").slice(-1))||void 0===o?void 0:null===(n=o[0])||void 0===n?void 0:n.replace(/{/,(0,b.notateNumber)(v,"Big")):p.replace(/{/g,(0,b.notateNumber)(8===e?null==y?void 0:y[0]:null==y?void 0:y[h],"Big")).replace(/}/g,null===(i=x.split("|"))||void 0===i?void 0:i[h]);let k=v/j*100;return(0,a.jsx)(d.Z,{sx:{width:400},children:(0,a.jsxs)(u.Z,{sx:{border:h>=(null==y?void 0:y.length)?"1px solid":"",borderColor:h>=(null==y?void 0:y.length)?"success.light":"",height:"100%"},children:[(0,a.jsxs)(s.Z,{direction:"row",alignItems:"center",children:[(0,a.jsx)("img",{src:"".concat(b.prefix,"data/TaskRank").concat(h,".png"),alt:"task-rank-"+h}),(0,a.jsxs)(c.Z,{children:[(0,b.cleanUnderscore)(g)," (",h," / ",8===e?1:null==y?void 0:y.length,")"]})]}),(0,a.jsx)(c.Z,{sx:{mb:1},children:(0,b.cleanUnderscore)(l)}),(0,a.jsxs)(c.Z,{children:[(0,b.notateNumber)(v,"Big"),h<=y.length?" / ".concat((0,b.notateNumber)(j)):""]}),h<=(null==y?void 0:y.length)?(0,a.jsxs)(s.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,a.jsx)("img",{src:"".concat(b.prefix,"etc/Merit_").concat(m,".png"),alt:"cost_merit-"+m}),(0,a.jsx)(c.Z,{children:8===e?0:C})]}):null,h<=(null==y?void 0:y.length)?(0,a.jsx)(f.Z,{percent:isNaN(k)||k===1/0?100:k}):null]})},"key"+e)})})})]})}}},function(r){r.O(0,[9774,2888,179],function(){return r(r.s=54213)}),_N_E=r.O()}]);