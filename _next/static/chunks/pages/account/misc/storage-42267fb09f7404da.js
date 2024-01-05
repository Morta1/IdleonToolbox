(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3889],{66242:function(e,t,r){"use strict";r.d(t,{Z:function(){return f}});var l=r(87462),n=r(63366),a=r(67294),o=r(86010),i=r(94780),s=r(90948),c=r(71657),d=r(90629),u=r(1588),m=r(34867);function getCardUtilityClass(e){return(0,m.Z)("MuiCard",e)}(0,u.Z)("MuiCard",["root"]);var p=r(85893);let Z=["className","raised"],useUtilityClasses=e=>{let{classes:t}=e;return(0,i.Z)({root:["root"]},getCardUtilityClass,t)},b=(0,s.ZP)(d.Z,{name:"MuiCard",slot:"Root",overridesResolver:(e,t)=>t.root})(()=>({overflow:"hidden"})),h=a.forwardRef(function(e,t){let r=(0,c.Z)({props:e,name:"MuiCard"}),{className:a,raised:i=!1}=r,s=(0,n.Z)(r,Z),d=(0,l.Z)({},r,{raised:i}),u=useUtilityClasses(d);return(0,p.jsx)(b,(0,l.Z)({className:(0,o.Z)(u.root,a),elevation:i?8:void 0,ref:t,ownerState:d},s))});var f=h},44267:function(e,t,r){"use strict";r.d(t,{Z:function(){return h}});var l=r(87462),n=r(63366),a=r(67294),o=r(86010),i=r(94780),s=r(90948),c=r(71657),d=r(1588),u=r(34867);function getCardContentUtilityClass(e){return(0,u.Z)("MuiCardContent",e)}(0,d.Z)("MuiCardContent",["root"]);var m=r(85893);let p=["className","component"],useUtilityClasses=e=>{let{classes:t}=e;return(0,i.Z)({root:["root"]},getCardContentUtilityClass,t)},Z=(0,s.ZP)("div",{name:"MuiCardContent",slot:"Root",overridesResolver:(e,t)=>t.root})(()=>({padding:16,"&:last-child":{paddingBottom:24}})),b=a.forwardRef(function(e,t){let r=(0,c.Z)({props:e,name:"MuiCardContent"}),{className:a,component:i="div"}=r,s=(0,n.Z)(r,p),d=(0,l.Z)({},r,{component:i}),u=useUtilityClasses(d);return(0,m.jsx)(Z,(0,l.Z)({as:i,className:(0,o.Z)(u.root,a),ownerState:d,ref:t},s))});var h=b},50480:function(e,t,r){"use strict";r.d(t,{Z:function(){return j}});var l=r(63366),n=r(87462),a=r(67294),o=r(86010),i=r(94780),s=r(74423),c=r(15861),d=r(98216),u=r(90948),m=r(71657),p=r(1588),Z=r(34867);function getFormControlLabelUtilityClasses(e){return(0,Z.Z)("MuiFormControlLabel",e)}let b=(0,p.Z)("MuiFormControlLabel",["root","labelPlacementStart","labelPlacementTop","labelPlacementBottom","disabled","label","error","required","asterisk"]);var h=r(15704),f=r(85893);let v=["checked","className","componentsProps","control","disabled","disableTypography","inputRef","label","labelPlacement","name","onChange","required","slotProps","value"],useUtilityClasses=e=>{let{classes:t,disabled:r,labelPlacement:l,error:n,required:a}=e,o={root:["root",r&&"disabled",`labelPlacement${(0,d.Z)(l)}`,n&&"error",a&&"required"],label:["label",r&&"disabled"],asterisk:["asterisk",n&&"error"]};return(0,i.Z)(o,getFormControlLabelUtilityClasses,t)},g=(0,u.ZP)("label",{name:"MuiFormControlLabel",slot:"Root",overridesResolver:(e,t)=>{let{ownerState:r}=e;return[{[`& .${b.label}`]:t.label},t.root,t[`labelPlacement${(0,d.Z)(r.labelPlacement)}`]]}})(({theme:e,ownerState:t})=>(0,n.Z)({display:"inline-flex",alignItems:"center",cursor:"pointer",verticalAlign:"middle",WebkitTapHighlightColor:"transparent",marginLeft:-11,marginRight:16,[`&.${b.disabled}`]:{cursor:"default"}},"start"===t.labelPlacement&&{flexDirection:"row-reverse",marginLeft:16,marginRight:-11},"top"===t.labelPlacement&&{flexDirection:"column-reverse",marginLeft:16},"bottom"===t.labelPlacement&&{flexDirection:"column",marginLeft:16},{[`& .${b.label}`]:{[`&.${b.disabled}`]:{color:(e.vars||e).palette.text.disabled}}})),C=(0,u.ZP)("span",{name:"MuiFormControlLabel",slot:"Asterisk",overridesResolver:(e,t)=>t.asterisk})(({theme:e})=>({[`&.${b.error}`]:{color:(e.vars||e).palette.error.main}})),x=a.forwardRef(function(e,t){var r,i;let d=(0,m.Z)({props:e,name:"MuiFormControlLabel"}),{className:u,componentsProps:p={},control:Z,disabled:b,disableTypography:x,label:j,labelPlacement:y="end",required:w,slotProps:P={}}=d,k=(0,l.Z)(d,v),_=(0,s.Z)(),N=null!=(r=null!=b?b:Z.props.disabled)?r:null==_?void 0:_.disabled,M=null!=w?w:Z.props.required,R={disabled:N,required:M};["checked","name","onChange","value","inputRef"].forEach(e=>{void 0===Z.props[e]&&void 0!==d[e]&&(R[e]=d[e])});let U=(0,h.Z)({props:d,muiFormControl:_,states:["error"]}),L=(0,n.Z)({},d,{disabled:N,labelPlacement:y,required:M,error:U.error}),S=useUtilityClasses(L),A=null!=(i=P.typography)?i:p.typography,E=j;return null==E||E.type===c.Z||x||(E=(0,f.jsx)(c.Z,(0,n.Z)({component:"span"},A,{className:(0,o.Z)(S.label,null==A?void 0:A.className),children:E}))),(0,f.jsxs)(g,(0,n.Z)({className:(0,o.Z)(S.root,u),ownerState:L,ref:t},k,{children:[a.cloneElement(Z,R),E,M&&(0,f.jsxs)(C,{ownerState:L,"aria-hidden":!0,className:S.asterisk,children:[" ","*"]})]}))});var j=x},88586:function(e,t,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/misc/storage",function(){return r(20850)}])},20850:function(e,t,r){"use strict";r.r(t);var l=r(82729),n=r(85893),a=r(23513),o=r(67294),i=r(66242),s=r(44267),c=r(51233),d=r(15861),u=r(50480),m=r(69368),p=r(30925),Z=r(61599),b=r(5072),h=r(2962),f=r(25675),v=r.n(f);function _templateObject(){let e=(0,l._)(["\n  height: 30px;\n  width: 30px;\n  object-fit: contain;\n"]);return _templateObject=function(){return e},e}Z.Z.img(_templateObject()),t.default=()=>{let{state:e}=(0,o.useContext)(a.I),[t,r]=(0,o.useState)(!1),[l,Z]=(0,o.useState)(),[f,g]=(0,o.useState)(!1),C=(0,o.useMemo)(()=>{var t;return[...null==e?void 0:null===(t=e.account)||void 0===t?void 0:t.storage].sort((e,t)=>(null==t?void 0:t.amount)-(null==e?void 0:e.amount))},[e]);(0,o.useEffect)(()=>{var r,l;if(f){let l=(0,p.groupByKey)(null==e?void 0:null===(r=e.account)||void 0===r?void 0:r.storage,e=>{let{Type:t}=e;return t});t?Z(Object.entries(l).reduce((e,t)=>{let[r,l]=t,n=[...l].sort((e,t)=>(null==t?void 0:t.amount)-(null==e?void 0:e.amount));return{...e,[r]:n}},{})):Z(l)}else Z(t?C:null==e?void 0:null===(l=e.account)||void 0===l?void 0:l.storage)},[e,f,t]);let renderItems=e=>e&&Array.isArray(e)?null==e?void 0:e.map((e,t)=>{let{name:r,rawName:l,amount:a}=e;return(0,n.jsx)(i.Z,{variant:"outlined",sx:{width:75},children:(0,n.jsx)(s.Z,{children:(0,n.jsxs)(c.Z,{alignItems:"center","data-index":t,children:[(0,n.jsx)(b.Z,{title:(0,p.cleanUnderscore)(r),children:(0,n.jsx)(v(),{loading:"lazy","data-index":t,width:30,height:30,style:{objectFit:"contain"},src:"".concat(p.prefix,"data/").concat(l,".png"),alt:l})}),(0,n.jsx)(b.Z,{title:(0,p.numberWithCommas)(a),children:(0,n.jsx)(d.Z,{color:a>=1e7?"success.light":"",children:(0,p.notateNumber)(a,"Big")})})]},"".concat(l,"-").concat(t))})},"".concat(r,"-").concat(t))}):null;return(0,n.jsxs)(c.Z,{children:[(0,n.jsx)(h.PB,{title:"Storage | Idleon Toolbox",description:"A list of your storage items"}),(0,n.jsx)(d.Z,{textAlign:"center",mt:2,mb:2,variant:"h2",children:"Storage"}),(0,n.jsxs)(c.Z,{children:[(0,n.jsxs)(c.Z,{mb:3,direction:"row",flexWrap:"wrap",children:[(0,n.jsx)(u.Z,{control:(0,n.jsx)(m.Z,{name:"mini",checked:f,size:"small",onChange:()=>g(!f)}),label:"Group by type"}),(0,n.jsx)(u.Z,{control:(0,n.jsx)(m.Z,{checked:t,onChange:e=>{r(e.target.checked)}}),label:"Sort by stack size"})]}),f&&!Array.isArray(l)?(0,n.jsx)(c.Z,{gap:2,children:Object.entries(l||{}).map((e,t)=>{let[r,l]=e;return 0===l.length?null:(0,n.jsx)(i.Z,{children:(0,n.jsxs)(s.Z,{children:[(0,n.jsx)(d.Z,{children:(0,p.cleanUnderscore)(r).toLowerCase().capitalize()}),(0,n.jsx)(c.Z,{"data-index":t,children:(0,n.jsx)(c.Z,{direction:"row",flexWrap:"wrap",gap:1,children:renderItems(l)})},"".concat(r,"-").concat(t))]})},"".concat(r,"-").concat(t))})}):(0,n.jsx)(c.Z,{direction:"row",gap:1,flexWrap:"wrap",children:renderItems(l)})]})]})}}},function(e){e.O(0,[5675,9774,2888,179],function(){return e(e.s=88586)}),_N_E=e.O()}]);