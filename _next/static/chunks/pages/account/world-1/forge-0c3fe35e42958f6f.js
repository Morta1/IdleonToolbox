(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9378],{66242:function(t,n,e){"use strict";e.d(n,{Z:function(){return j}});var r=e(87462),o=e(63366),a=e(67294),i=e(86010),c=e(94780),l=e(90948),s=e(71657),d=e(90629),u=e(1588),x=e(34867);function p(t){return(0,x.Z)("MuiCard",t)}(0,u.Z)("MuiCard",["root"]);var v=e(85893);let h=["className","raised"],f=t=>{let{classes:n}=t;return(0,c.Z)({root:["root"]},p,n)},Z=(0,l.ZP)(d.Z,{name:"MuiCard",slot:"Root",overridesResolver:(t,n)=>n.root})(()=>({overflow:"hidden"})),m=a.forwardRef(function(t,n){let e=(0,s.Z)({props:t,name:"MuiCard"}),{className:a,raised:c=!1}=e,l=(0,o.Z)(e,h),d=(0,r.Z)({},e,{raised:c}),u=f(d);return(0,v.jsx)(Z,(0,r.Z)({className:(0,i.Z)(u.root,a),elevation:c?8:void 0,ref:n,ownerState:d},l))});var j=m},44267:function(t,n,e){"use strict";e.d(n,{Z:function(){return m}});var r=e(87462),o=e(63366),a=e(67294),i=e(86010),c=e(94780),l=e(90948),s=e(71657),d=e(1588),u=e(34867);function x(t){return(0,u.Z)("MuiCardContent",t)}(0,d.Z)("MuiCardContent",["root"]);var p=e(85893);let v=["className","component"],h=t=>{let{classes:n}=t;return(0,c.Z)({root:["root"]},x,n)},f=(0,l.ZP)("div",{name:"MuiCardContent",slot:"Root",overridesResolver:(t,n)=>n.root})(()=>({padding:16,"&:last-child":{paddingBottom:24}})),Z=a.forwardRef(function(t,n){let e=(0,s.Z)({props:t,name:"MuiCardContent"}),{className:a,component:c="div"}=e,l=(0,o.Z)(e,v),d=(0,r.Z)({},e,{component:c}),u=h(d);return(0,p.jsx)(f,(0,r.Z)({as:c,className:(0,i.Z)(u.root,a),ownerState:d,ref:n},l))});var m=Z},76585:function(t,n,e){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/world-1/forge",function(){return e(93415)}])},10372:function(t,n,e){"use strict";var r=e(82729),o=e(85893),a=e(39574),i=e(61599),c=e(15861),l=e(51233);function s(){let t=(0,r._)(["\n  width: 23px;\n  height: 27px;\n  object-fit: contain;\n"]);return s=function(){return t},t}let d=i.Z.img(s());n.Z=t=>{let{centered:n=!0,style:e={},money:r,title:i="Total Money",maxCoins:s=5}=t;return(0,o.jsxs)("div",{style:e,children:[i?(0,o.jsx)(c.Z,{style:{textAlign:"center"},children:i}):null,(0,o.jsx)(l.Z,{flexWrap:"wrap",justifyContent:n?"center":"flex-start",direction:"row",gap:2.3,children:null==r?void 0:r.map((t,n)=>{let[e,r]=t;return n<s&&Number(r)>0?(0,o.jsxs)(l.Z,{justifyContent:"center",alignItems:"center",children:[(0,o.jsx)(d,{src:"".concat(a.prefix,"data/Coins").concat(e,".png"),alt:""}),(0,o.jsx)(c.Z,{variant:"body1",component:"span",className:"coin-value",children:Number(r)})]},r+""+e):null})})]})}},93415:function(t,n,e){"use strict";e.r(n);var r=e(85893),o=e(41422),a=e(67294),i=e(98396),c=e(15861),l=e(11703),s=e(40044),d=e(86886),u=e(66242),x=e(44267),p=e(51233),v=e(39574),h=e(10372),f=e(2962);let Z={width:72,alignItems:"center"},m=t=>{let{style:n={},name:e,value:o}=t;return(0,r.jsxs)("div",{style:n,children:[(0,r.jsx)(c.Z,{children:e}),(0,r.jsx)(c.Z,{component:"div",children:o})]})};n.default=()=>{var t,n,e,j,w,g;let{state:C}=(0,a.useContext)(o.I),[y,b]=(0,a.useState)(0),M=(0,i.Z)(t=>t.breakpoints.down("md"),{noSsr:!0}),_=(t,n)=>n?t<5?Math.round(50*Math.pow(2.5,Math.pow(t,.51))):Math.round(400*Math.pow(n,t-5)):Math.round(200*Math.pow(5.4,Math.pow(t,.83))),N=(t,n,e,r)=>{let o=0;for(let a=r?1:t;a<n;a++)o+=_(a,e);return null!=o?o:0};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(f.PB,{title:"Idleon Toolbox | Forge",description:"Keep track of your forge production"}),(0,r.jsx)(c.Z,{mt:2,mb:2,variant:"h2",children:"Forge"}),(0,r.jsx)(l.Z,{centered:!0,sx:{marginBottom:3},variant:M?"fullWidth":"standard",value:y,onChange:(t,n)=>{b(n)},children:["Slots","Upgrades"].map((t,n)=>(0,r.jsx)(s.Z,{label:t},"".concat(t,"-").concat(n)))}),0===y?(0,r.jsx)(d.ZP,{container:!0,gap:2,children:null==C?void 0:null===(t=C.account)||void 0===t?void 0:null===(n=t.forge)||void 0===n?void 0:null===(e=n.list)||void 0===e?void 0:e.map((t,n)=>{let{ore:e,barrel:o,bar:a,isBrimestone:i}=t,l=[e,o,a],s=l.every(t=>{let{rawName:n}=t;return"Blank"===n});return(0,r.jsx)(d.ZP,{item:!0,children:(0,r.jsx)(u.Z,{sx:{position:"relative",borderColor:i?"#9b689bbf":"none"},variant:"outlined",children:(0,r.jsx)(x.Z,{children:(0,r.jsx)(p.Z,{direction:"row",children:null==l?void 0:l.map((t,n)=>{let{rawName:e,quantity:o}=t;return(0,r.jsxs)(p.Z,{sx:Z,children:[(0,r.jsx)("img",{style:{width:M?36:"auto",opacity:s?0:1},src:"".concat(v.prefix,"data/").concat(s?"CopperBar":e,".png"),alt:""}),o>0?(0,r.jsx)(c.Z,{variant:"body1",component:"span",children:o}):(0,r.jsx)(c.Z,{variant:"body1",component:"span",children:"\xa0"})]},"".concat(e,"-").concat(n))})})})},"".concat(e,"-").concat(o,"-").concat(a,"-").concat(n))},"".concat(e,"-").concat(o,"-").concat(a,"-").concat(n))})}):null,1===y?(0,r.jsx)(p.Z,{gap:3,children:null==C?void 0:null===(j=C.account)||void 0===j?void 0:null===(w=j.forge)||void 0===w?void 0:null===(g=w.upgrades)||void 0===g?void 0:g.map((t,n)=>{let{level:e,maxLevel:o,description:a,costMulti:i}=t,l=_(e,i),s=N(e,o,i),d=N(e,o,i,!0);return(0,r.jsx)(u.Z,{sx:{width:"fit-content"},children:(0,r.jsx)(x.Z,{children:(0,r.jsxs)(p.Z,{direction:"row",gap:3,flexWrap:"wrap",children:[(0,r.jsx)(m,{name:"Lv.",value:"".concat(e," / ").concat(o)}),(0,r.jsx)(m,{style:{width:300},name:"Description",value:a}),(0,r.jsx)(m,{style:{width:120},name:"Cost",value:e<o?(0,r.jsx)(h.Z,{centered:!1,title:"",maxCoins:3,money:(0,v.getCoinsArray)(l)}):(0,r.jsx)(c.Z,{color:"success.light",children:"Maxed"})}),(0,r.jsx)(m,{style:{minWidth:120,alignItems:"flex-start"},name:e<o?"Cost to max":"Total cost",value:(0,r.jsx)(h.Z,{centered:!1,title:"",maxCoins:3,money:(0,v.getCoinsArray)(e<o?s:d)})})]})})},"".concat(e,"-").concat(n))})}):null]})}},82729:function(t,n,e){"use strict";function r(t,n){return n||(n=t.slice(0)),Object.freeze(Object.defineProperties(t,{raw:{value:Object.freeze(n)}}))}e.d(n,{_:function(){return r}})}},function(t){t.O(0,[6886,9774,2888,179],function(){return t(t.s=76585)}),_N_E=t.O()}]);