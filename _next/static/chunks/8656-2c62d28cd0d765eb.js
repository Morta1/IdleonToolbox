"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8656],{70983:function(e,t,a){var r=a(88169),o=a(85893);t.Z=(0,r.Z)((0,o.jsx)("path",{d:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"}),"CheckCircle")},52186:function(e,t,a){var r=a(88169),o=a(85893);t.Z=(0,r.Z)((0,o.jsx)("path",{d:"M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5m0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3"}),"Visibility")},65582:function(e,t,a){a.d(t,{Z:function(){return f}});var r=a(67294),o=a(90512),i=a(34867),n=a(94780),s=a(14142),l=a(29628),c=a(69827),d=a(78136),u=a(85893);let h=(0,d.Z)(),p=(0,c.Z)("div",{name:"MuiContainer",slot:"Root",overridesResolver:(e,t)=>{let{ownerState:a}=e;return[t.root,t[`maxWidth${(0,s.Z)(String(a.maxWidth))}`],a.fixed&&t.fixed,a.disableGutters&&t.disableGutters]}}),useThemePropsDefault=e=>(0,l.Z)({props:e,name:"MuiContainer",defaultTheme:h}),useUtilityClasses=(e,t)=>{let{classes:a,fixed:r,disableGutters:o,maxWidth:l}=e,c={root:["root",l&&`maxWidth${(0,s.Z)(String(l))}`,r&&"fixed",o&&"disableGutters"]};return(0,n.Z)(c,e=>(0,i.ZP)(t,e),a)};function createContainer(e={}){let{createStyledComponent:t=p,useThemeProps:a=useThemePropsDefault,componentName:i="MuiContainer"}=e,n=t(({theme:e,ownerState:t})=>({width:"100%",marginLeft:"auto",boxSizing:"border-box",marginRight:"auto",...!t.disableGutters&&{paddingLeft:e.spacing(2),paddingRight:e.spacing(2),[e.breakpoints.up("sm")]:{paddingLeft:e.spacing(3),paddingRight:e.spacing(3)}}}),({theme:e,ownerState:t})=>t.fixed&&Object.keys(e.breakpoints.values).reduce((t,a)=>{let r=e.breakpoints.values[a];return 0!==r&&(t[e.breakpoints.up(a)]={maxWidth:`${r}${e.breakpoints.unit}`}),t},{}),({theme:e,ownerState:t})=>({..."xs"===t.maxWidth&&{[e.breakpoints.up("xs")]:{maxWidth:Math.max(e.breakpoints.values.xs,444)}},...t.maxWidth&&"xs"!==t.maxWidth&&{[e.breakpoints.up(t.maxWidth)]:{maxWidth:`${e.breakpoints.values[t.maxWidth]}${e.breakpoints.unit}`}}})),s=r.forwardRef(function(e,t){let r=a(e),{className:s,component:l="div",disableGutters:c=!1,fixed:d=!1,maxWidth:h="lg",classes:p,...m}=r,v={...r,component:l,disableGutters:c,fixed:d,maxWidth:h},g=useUtilityClasses(v,i);return(0,u.jsx)(n,{as:l,ownerState:v,className:(0,o.Z)(g.root,s),ref:t,...m})});return s}var m=a(98216),v=a(90948),g=a(28628);let w=createContainer({createStyledComponent:(0,v.ZP)("div",{name:"MuiContainer",slot:"Root",overridesResolver:(e,t)=>{let{ownerState:a}=e;return[t.root,t[`maxWidth${(0,m.Z)(String(a.maxWidth))}`],a.fixed&&t.fixed,a.disableGutters&&t.disableGutters]}}),useThemeProps:e=>(0,g.i)({props:e,name:"MuiContainer"})});var f=w},45843:function(e,t,a){a.d(t,{Z:function(){return x}});var r=a(67294),o=a(90512),i=a(94780),n=a(38366),s=a(98216),l=a(40902),c=a(21964),d=a(90948),u=a(16694),h=a(28628),p=a(1588),m=a(34867);function getSwitchUtilityClass(e){return(0,m.ZP)("MuiSwitch",e)}let v=(0,p.Z)("MuiSwitch",["root","edgeStart","edgeEnd","switchBase","colorPrimary","colorSecondary","sizeSmall","sizeMedium","checked","disabled","input","thumb","track"]);var g=a(85893);let useUtilityClasses=e=>{let{classes:t,edge:a,size:r,color:o,checked:n,disabled:l}=e,c={root:["root",a&&`edge${(0,s.Z)(a)}`,`size${(0,s.Z)(r)}`],switchBase:["switchBase",`color${(0,s.Z)(o)}`,n&&"checked",l&&"disabled"],thumb:["thumb"],track:["track"],input:["input"]},d=(0,i.Z)(c,getSwitchUtilityClass,t);return{...t,...d}},w=(0,d.ZP)("span",{name:"MuiSwitch",slot:"Root",overridesResolver:(e,t)=>{let{ownerState:a}=e;return[t.root,a.edge&&t[`edge${(0,s.Z)(a.edge)}`],t[`size${(0,s.Z)(a.size)}`]]}})({display:"inline-flex",width:58,height:38,overflow:"hidden",padding:12,boxSizing:"border-box",position:"relative",flexShrink:0,zIndex:0,verticalAlign:"middle","@media print":{colorAdjust:"exact"},variants:[{props:{edge:"start"},style:{marginLeft:-8}},{props:{edge:"end"},style:{marginRight:-8}},{props:{size:"small"},style:{width:40,height:24,padding:7,[`& .${v.thumb}`]:{width:16,height:16},[`& .${v.switchBase}`]:{padding:4,[`&.${v.checked}`]:{transform:"translateX(16px)"}}}}]}),f=(0,d.ZP)(c.Z,{name:"MuiSwitch",slot:"SwitchBase",overridesResolver:(e,t)=>{let{ownerState:a}=e;return[t.switchBase,{[`& .${v.input}`]:t.input},"default"!==a.color&&t[`color${(0,s.Z)(a.color)}`]]}})((0,u.Z)(({theme:e})=>({position:"absolute",top:0,left:0,zIndex:1,color:e.vars?e.vars.palette.Switch.defaultColor:`${"light"===e.palette.mode?e.palette.common.white:e.palette.grey[300]}`,transition:e.transitions.create(["left","transform"],{duration:e.transitions.duration.shortest}),[`&.${v.checked}`]:{transform:"translateX(20px)"},[`&.${v.disabled}`]:{color:e.vars?e.vars.palette.Switch.defaultDisabledColor:`${"light"===e.palette.mode?e.palette.grey[100]:e.palette.grey[600]}`},[`&.${v.checked} + .${v.track}`]:{opacity:.5},[`&.${v.disabled} + .${v.track}`]:{opacity:e.vars?e.vars.opacity.switchTrackDisabled:`${"light"===e.palette.mode?.12:.2}`},[`& .${v.input}`]:{left:"-100%",width:"300%"}})),(0,u.Z)(({theme:e})=>({"&:hover":{backgroundColor:e.vars?`rgba(${e.vars.palette.action.activeChannel} / ${e.vars.palette.action.hoverOpacity})`:(0,n.Fq)(e.palette.action.active,e.palette.action.hoverOpacity),"@media (hover: none)":{backgroundColor:"transparent"}},variants:[...Object.entries(e.palette).filter((0,l.Z)(["light"])).map(([t])=>({props:{color:t},style:{[`&.${v.checked}`]:{color:(e.vars||e).palette[t].main,"&:hover":{backgroundColor:e.vars?`rgba(${e.vars.palette[t].mainChannel} / ${e.vars.palette.action.hoverOpacity})`:(0,n.Fq)(e.palette[t].main,e.palette.action.hoverOpacity),"@media (hover: none)":{backgroundColor:"transparent"}},[`&.${v.disabled}`]:{color:e.vars?e.vars.palette.Switch[`${t}DisabledColor`]:`${"light"===e.palette.mode?(0,n.$n)(e.palette[t].main,.62):(0,n._j)(e.palette[t].main,.55)}`}},[`&.${v.checked} + .${v.track}`]:{backgroundColor:(e.vars||e).palette[t].main}}}))]}))),b=(0,d.ZP)("span",{name:"MuiSwitch",slot:"Track",overridesResolver:(e,t)=>t.track})((0,u.Z)(({theme:e})=>({height:"100%",width:"100%",borderRadius:7,zIndex:-1,transition:e.transitions.create(["opacity","background-color"],{duration:e.transitions.duration.shortest}),backgroundColor:e.vars?e.vars.palette.common.onBackground:`${"light"===e.palette.mode?e.palette.common.black:e.palette.common.white}`,opacity:e.vars?e.vars.opacity.switchTrack:`${"light"===e.palette.mode?.38:.3}`}))),k=(0,d.ZP)("span",{name:"MuiSwitch",slot:"Thumb",overridesResolver:(e,t)=>t.thumb})((0,u.Z)(({theme:e})=>({boxShadow:(e.vars||e).shadows[1],backgroundColor:"currentColor",width:20,height:20,borderRadius:"50%"}))),S=r.forwardRef(function(e,t){let a=(0,h.i)({props:e,name:"MuiSwitch"}),{className:r,color:i="primary",edge:n=!1,size:s="medium",sx:l,...c}=a,d={...a,color:i,edge:n,size:s},u=useUtilityClasses(d),p=(0,g.jsx)(k,{className:u.thumb,ownerState:d});return(0,g.jsxs)(w,{className:(0,o.Z)(u.root,r),sx:l,ownerState:d,children:[(0,g.jsx)(f,{type:"checkbox",icon:p,checkedIcon:p,ref:t,ownerState:d,...c,classes:{...u,root:u.switchBase}}),(0,g.jsx)(b,{className:u.track,ownerState:d})]})});var x=S},44287:function(e,t,a){var r=a(67294);t.Z=e=>{let t=r.useRef({});return r.useEffect(()=>{t.current=e}),t.current}},7336:function(e,t,a){a.d(t,{I:function(){return useLocalStorage}});var r=a(67294);function useWindowEvent(e,t,a){(0,r.useEffect)(()=>(window.addEventListener(e,t,a),()=>window.removeEventListener(e,t,a)),[e,t])}function serializeJSON(e,t="use-local-storage"){try{return JSON.stringify(e)}catch(e){throw Error(`@mantine/hooks ${t}: Failed to serialize the value`)}}function deserializeJSON(e){try{return e&&JSON.parse(e)}catch{return e}}function createStorageHandler(e){return{getItem:t=>{try{return window[e].getItem(t)}catch(e){return console.warn("use-local-storage: Failed to get value from storage, localStorage is blocked"),null}},setItem:(t,a)=>{try{window[e].setItem(t,a)}catch(e){console.warn("use-local-storage: Failed to set value to storage, localStorage is blocked")}},removeItem:t=>{try{window[e].removeItem(t)}catch(e){console.warn("use-local-storage: Failed to remove value from storage, localStorage is blocked")}}}}function createStorage(e,t){let a="localStorage"===e?"mantine-local-storage":"mantine-session-storage",{getItem:o,setItem:i,removeItem:n}=createStorageHandler(e);return function({key:s,defaultValue:l,getInitialValueInEffect:c=!0,sync:d=!0,deserialize:u=deserializeJSON,serialize:h=e=>serializeJSON(e,t)}){let p=(0,r.useCallback)(t=>{let a;try{a="undefined"==typeof window||!(e in window)||null===window[e]||!!t}catch(e){a=!0}if(a)return l;let r=o(s);return null!==r?u(r):l},[s,l]),[m,v]=(0,r.useState)(p(c)),g=(0,r.useCallback)(e=>{e instanceof Function?v(t=>{let r=e(t);return i(s,h(r)),window.dispatchEvent(new CustomEvent(a,{detail:{key:s,value:e(t)}})),r}):(i(s,h(e)),window.dispatchEvent(new CustomEvent(a,{detail:{key:s,value:e}})),v(e))},[s]),w=(0,r.useCallback)(()=>{n(s),window.dispatchEvent(new CustomEvent(a,{detail:{key:s,value:l}}))},[]);return useWindowEvent("storage",t=>{d&&t.storageArea===window[e]&&t.key===s&&v(u(t.newValue??void 0))}),useWindowEvent(a,e=>{d&&e.detail.key===s&&v(e.detail.value)}),(0,r.useEffect)(()=>{void 0!==l&&void 0===m&&g(l)},[l,m,g]),(0,r.useEffect)(()=>{let e=p();void 0!==e&&g(e)},[s]),[void 0===m?l:m,g,w]}}function useLocalStorage(e){return createStorage("localStorage","use-local-storage")(e)}!function(e){let{getItem:t}=createStorageHandler(e)}("localStorage")},76947:function(e,t,a){a.d(t,{Z:function(){return r}});/**
 * @license @tabler/icons-react v3.30.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var r=(0,a(33733).Z)("filled","info-circle-filled","IconInfoCircleFilled",[["path",{d:"M12 2c5.523 0 10 4.477 10 10a10 10 0 0 1 -19.995 .324l-.005 -.324l.004 -.28c.148 -5.393 4.566 -9.72 9.996 -9.72zm0 9h-1l-.117 .007a1 1 0 0 0 0 1.986l.117 .007v3l.007 .117a1 1 0 0 0 .876 .876l.117 .007h1l.117 -.007a1 1 0 0 0 .876 -.876l.007 -.117l-.007 -.117a1 1 0 0 0 -.764 -.857l-.112 -.02l-.117 -.006v-3l-.007 -.117a1 1 0 0 0 -.876 -.876l-.117 -.007zm.01 -3l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007z",key:"svg-0"}]])}}]);