(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8591],{81458:function(r,e,t){"use strict";t.d(e,{Z:function(){return q}});var a=t(63366),n=t(87462),o=t(67294),i=t(86010),l=t(94780),s=t(70917),d=t(41796),u=t(98216),c=t(2734),f=t(90948),b=t(71657),h=t(1588),m=t(34867);function getLinearProgressUtilityClass(r){return(0,m.Z)("MuiLinearProgress",r)}(0,h.Z)("MuiLinearProgress",["root","colorPrimary","colorSecondary","determinate","indeterminate","buffer","query","dashed","dashedColorPrimary","dashedColorSecondary","bar","barColorPrimary","barColorSecondary","bar1Indeterminate","bar1Determinate","bar1Buffer","bar2Indeterminate","bar2Buffer"]);var v=t(85893);let g=["className","color","value","valueBuffer","variant"],_=r=>r,p,x,Z,y,C,w,j=(0,s.F4)(p||(p=_`
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
`)),k=(0,s.F4)(x||(x=_`
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
`)),useUtilityClasses=r=>{let{classes:e,variant:t,color:a}=r,n={root:["root",`color${(0,u.Z)(a)}`,t],dashed:["dashed",`dashedColor${(0,u.Z)(a)}`],bar1:["bar",`barColor${(0,u.Z)(a)}`,("indeterminate"===t||"query"===t)&&"bar1Indeterminate","determinate"===t&&"bar1Determinate","buffer"===t&&"bar1Buffer"],bar2:["bar","buffer"!==t&&`barColor${(0,u.Z)(a)}`,"buffer"===t&&`color${(0,u.Z)(a)}`,("indeterminate"===t||"query"===t)&&"bar2Indeterminate","buffer"===t&&"bar2Buffer"]};return(0,l.Z)(n,getLinearProgressUtilityClass,e)},getColorShade=(r,e)=>"inherit"===e?"currentColor":r.vars?r.vars.palette.LinearProgress[`${e}Bg`]:"light"===r.palette.mode?(0,d.$n)(r.palette[e].main,.62):(0,d._j)(r.palette[e].main,.5),$=(0,f.ZP)("span",{name:"MuiLinearProgress",slot:"Root",overridesResolver:(r,e)=>{let{ownerState:t}=r;return[e.root,e[`color${(0,u.Z)(t.color)}`],e[t.variant]]}})(({ownerState:r,theme:e})=>(0,n.Z)({position:"relative",overflow:"hidden",display:"block",height:4,zIndex:0,"@media print":{colorAdjust:"exact"},backgroundColor:getColorShade(e,r.color)},"inherit"===r.color&&"buffer"!==r.variant&&{backgroundColor:"none","&::before":{content:'""',position:"absolute",left:0,top:0,right:0,bottom:0,backgroundColor:"currentColor",opacity:.3}},"buffer"===r.variant&&{backgroundColor:"transparent"},"query"===r.variant&&{transform:"rotate(180deg)"})),B=(0,f.ZP)("span",{name:"MuiLinearProgress",slot:"Dashed",overridesResolver:(r,e)=>{let{ownerState:t}=r;return[e.dashed,e[`dashedColor${(0,u.Z)(t.color)}`]]}})(({ownerState:r,theme:e})=>{let t=getColorShade(e,r.color);return(0,n.Z)({position:"absolute",marginTop:0,height:"100%",width:"100%"},"inherit"===r.color&&{opacity:.3},{backgroundImage:`radial-gradient(${t} 0%, ${t} 16%, transparent 42%)`,backgroundSize:"10px 10px",backgroundPosition:"0 -23px"})},(0,s.iv)(y||(y=_`
    animation: ${0} 3s infinite linear;
  `),P)),N=(0,f.ZP)("span",{name:"MuiLinearProgress",slot:"Bar1",overridesResolver:(r,e)=>{let{ownerState:t}=r;return[e.bar,e[`barColor${(0,u.Z)(t.color)}`],("indeterminate"===t.variant||"query"===t.variant)&&e.bar1Indeterminate,"determinate"===t.variant&&e.bar1Determinate,"buffer"===t.variant&&e.bar1Buffer]}})(({ownerState:r,theme:e})=>(0,n.Z)({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left",backgroundColor:"inherit"===r.color?"currentColor":(e.vars||e).palette[r.color].main},"determinate"===r.variant&&{transition:"transform .4s linear"},"buffer"===r.variant&&{zIndex:1,transition:"transform .4s linear"}),({ownerState:r})=>("indeterminate"===r.variant||"query"===r.variant)&&(0,s.iv)(C||(C=_`
      width: auto;
      animation: ${0} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
    `),j)),I=(0,f.ZP)("span",{name:"MuiLinearProgress",slot:"Bar2",overridesResolver:(r,e)=>{let{ownerState:t}=r;return[e.bar,e[`barColor${(0,u.Z)(t.color)}`],("indeterminate"===t.variant||"query"===t.variant)&&e.bar2Indeterminate,"buffer"===t.variant&&e.bar2Buffer]}})(({ownerState:r,theme:e})=>(0,n.Z)({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left"},"buffer"!==r.variant&&{backgroundColor:"inherit"===r.color?"currentColor":(e.vars||e).palette[r.color].main},"inherit"===r.color&&{opacity:.3},"buffer"===r.variant&&{backgroundColor:getColorShade(e,r.color),transition:"transform .4s linear"}),({ownerState:r})=>("indeterminate"===r.variant||"query"===r.variant)&&(0,s.iv)(w||(w=_`
      width: auto;
      animation: ${0} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
    `),k)),S=o.forwardRef(function(r,e){let t=(0,b.Z)({props:r,name:"MuiLinearProgress"}),{className:o,color:l="primary",value:s,valueBuffer:d,variant:u="indeterminate"}=t,f=(0,a.Z)(t,g),h=(0,n.Z)({},t,{color:l,variant:u}),m=useUtilityClasses(h),p=(0,c.Z)(),x={},Z={bar1:{},bar2:{}};if(("determinate"===u||"buffer"===u)&&void 0!==s){x["aria-valuenow"]=Math.round(s),x["aria-valuemin"]=0,x["aria-valuemax"]=100;let r=s-100;"rtl"===p.direction&&(r=-r),Z.bar1.transform=`translateX(${r}%)`}if("buffer"===u&&void 0!==d){let r=(d||0)-100;"rtl"===p.direction&&(r=-r),Z.bar2.transform=`translateX(${r}%)`}return(0,v.jsxs)($,(0,n.Z)({className:(0,i.Z)(m.root,o),ownerState:h,role:"progressbar"},x,{ref:e},f,{children:["buffer"===u?(0,v.jsx)(B,{className:m.dashed,ownerState:h}):null,(0,v.jsx)(N,{className:m.bar1,ownerState:h,style:Z.bar1}),"determinate"===u?null:(0,v.jsx)(I,{className:m.bar2,ownerState:h,style:Z.bar2})]}))});var q=S},54213:function(r,e,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/task-board/tasks",function(){return t(62692)}])},89309:function(r,e,t){"use strict";var a=t(85893),n=t(87357),o=t(81458),i=t(23972);t(67294),e.Z=r=>{let{percent:e,bgColor:t,label:l=!0,sx:s,boxSx:d={},pre:u}=r;return(0,a.jsxs)(n.Z,{sx:{display:"flex",alignItems:"center",...d},children:[u,(0,a.jsx)(n.Z,{sx:{width:"100%",mr:l?1:0},children:(0,a.jsx)(o.Z,{sx:{width:"100%",height:10,borderRadius:5,"& .MuiLinearProgress-bar":{backgroundColor:t||""},...s},variant:"determinate",value:e>100?100:e})}),l?(0,a.jsx)(n.Z,{children:(0,a.jsx)(i.Z,{variant:"body2",color:"text.secondary",children:"".concat(Math.round(e),"%")})}):null]})}},30509:function(r,e,t){"use strict";var a=t(85893),n=t(67294),o=t(98396),i=t(11703),l=t(40044),s=t(30925),d=t(87357),u=t(11163);e.Z=r=>{let{tabs:e,icons:t,children:c,onTabChange:f,forceScroll:b,orientation:h="horizontal",iconsOnly:m,queryKey:v="t",clearOnChange:g=[]}=r,p=(0,o.Z)(r=>r.breakpoints.down("md"),{noSsr:!0}),x=(0,u.useRouter)(),Z=x.query[v],y=e.findIndex(r=>r===Z),C=y>=0?y:0;(0,n.useEffect)(()=>{Z||x.replace({pathname:x.pathname,query:{...x.query,[v]:e[C]}},void 0,{shallow:!0})},[Z,v,e,C,x]);let w=Array.isArray(c)?c:[c];return(0,a.jsxs)(d.Z,{sx:"vertical"===h?{flexGrow:1,display:"flex"}:{},children:[(0,a.jsx)(i.Z,{centered:!p||p&&e.length<4,scrollButtons:!0,allowScrollButtonsMobile:!0,sx:{marginBottom:3},variant:p&&e.length>=4||b?"scrollable":"standard",value:C,onChange:(r,t)=>{let a={...x.query,[v]:e[t]};g.forEach(r=>delete a[r]),x.push({pathname:x.pathname,query:a},void 0,{shallow:!0}),f&&f(t)},children:null==e?void 0:e.map((r,e)=>(0,a.jsx)(l.Z,{iconPosition:"start",icon:(null==t?void 0:t[e])?(0,a.jsx)("img",{src:"".concat(s.prefix).concat(null==t?void 0:t[e],".png")}):null,wrapped:!0,label:m?"":r,sx:{minWidth:62}},"".concat(r,"-").concat(e)))}),f?c:null==w?void 0:w.map((r,e)=>e===C?r:null)]})}},62692:function(r,e,t){"use strict";t.r(e);var a=t(85893),n=t(67294),o=t(21480),i=t(30509),l=t(2962),s=t(51233),d=t(66242),u=t(44267),c=t(23972),f=t(30925),b=t(89309);e.default=()=>{var r,e,t;let{state:h}=(0,n.useContext)(o.I),[m,v]=(0,n.useState)(0);return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(l.PB,{title:"Tasks | Idleon Toolbox",description:"Keep track of your tasks progression"}),(0,a.jsx)(i.Z,{tabs:f.worldsArray,onTabChange:r=>{v(r)},children:(0,a.jsx)(s.Z,{index:m,direction:"row",flexWrap:"wrap",gap:3,justifyContent:"center",children:null==h?void 0:null===(t=h.account)||void 0===t?void 0:null===(e=t.tasksDescriptions)||void 0===e?void 0:null===(r=e[m])||void 0===r?void 0:r.map((r,e)=>{var t,n,o,i;let l,{stat:h,level:v,name:g,description:p,filler1:x,filler2:Z,breakpoints:y,meritReward:C}=r;if(e>=9)return null;let w=null!==(t=8===e?null==y?void 0:y[0]:null==y?void 0:y[v])&&void 0!==t?t:0;l=v===(null==y?void 0:y.length)&&8!==e?null===(o=Z.split("|").slice(-1))||void 0===o?void 0:null===(n=o[0])||void 0===n?void 0:n.replace(/{/,(0,f.notateNumber)(h,"Big")):p.replace(/{/g,(0,f.notateNumber)(8===e?null==y?void 0:y[0]:null==y?void 0:y[v],"Big")).replace(/}/g,null===(i=x.split("|"))||void 0===i?void 0:i[v]);let j=h/w*100;return(0,a.jsx)(d.Z,{sx:{width:400},children:(0,a.jsxs)(u.Z,{sx:{border:v>=(null==y?void 0:y.length)?"1px solid":"",borderColor:v>=(null==y?void 0:y.length)?"success.light":"",height:"100%"},children:[(0,a.jsxs)(s.Z,{direction:"row",alignItems:"center",children:[(0,a.jsx)("img",{src:"".concat(f.prefix,"data/TaskRank").concat(v,".png"),alt:"task-rank-"+v}),(0,a.jsxs)(c.Z,{children:[(0,f.cleanUnderscore)(g)," (",v," / ",8===e?1:null==y?void 0:y.length,")"]})]}),(0,a.jsx)(c.Z,{sx:{mb:1},children:(0,f.cleanUnderscore)(l)}),(0,a.jsxs)(c.Z,{children:[(0,f.notateNumber)(h,"Big"),v<=y.length?" / ".concat((0,f.notateNumber)(w)):""]}),v<=(null==y?void 0:y.length)?(0,a.jsxs)(s.Z,{direction:"row",alignItems:"center",gap:1,children:[(0,a.jsx)("img",{src:"".concat(f.prefix,"etc/Merit_").concat(m,".png"),alt:"cost_merit-"+m}),(0,a.jsx)(c.Z,{children:8===e?0:C})]}):null,v<=(null==y?void 0:y.length)?(0,a.jsx)(b.Z,{percent:isNaN(j)||j===1/0?100:j}):null]})},"key"+e)})})})]})}}},function(r){r.O(0,[9774,2888,179],function(){return r(r.s=54213)}),_N_E=r.O()}]);