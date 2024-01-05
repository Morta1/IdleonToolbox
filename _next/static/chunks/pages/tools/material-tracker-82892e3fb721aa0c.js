(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[5053],{8364:function(e,t,l){"use strict";var n=l(64836);t.Z=void 0;var i=n(l(64938)),r=l(85893),o=(0,i.default)((0,r.jsx)("path",{d:"M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12 1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"}),"DeleteForever");t.Z=o},74721:function(e,t,l){"use strict";var n=l(64836);t.Z=void 0;var i=n(l(64938)),r=l(85893),o=(0,i.default)((0,r.jsx)("path",{d:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"}),"Info");t.Z=o},66242:function(e,t,l){"use strict";l.d(t,{Z:function(){return x}});var n=l(87462),i=l(63366),r=l(67294),o=l(86010),a=l(94780),u=l(90948),d=l(71657),s=l(90629),v=l(1588),c=l(34867);function getCardUtilityClass(e){return(0,c.Z)("MuiCard",e)}(0,v.Z)("MuiCard",["root"]);var m=l(85893);let f=["className","raised"],useUtilityClasses=e=>{let{classes:t}=e;return(0,a.Z)({root:["root"]},getCardUtilityClass,t)},h=(0,u.ZP)(s.Z,{name:"MuiCard",slot:"Root",overridesResolver:(e,t)=>t.root})(()=>({overflow:"hidden"})),p=r.forwardRef(function(e,t){let l=(0,d.Z)({props:e,name:"MuiCard"}),{className:r,raised:a=!1}=l,u=(0,i.Z)(l,f),s=(0,n.Z)({},l,{raised:a}),v=useUtilityClasses(s);return(0,m.jsx)(h,(0,n.Z)({className:(0,o.Z)(v.root,r),elevation:a?8:void 0,ref:t,ownerState:s},u))});var x=p},44267:function(e,t,l){"use strict";l.d(t,{Z:function(){return p}});var n=l(87462),i=l(63366),r=l(67294),o=l(86010),a=l(94780),u=l(90948),d=l(71657),s=l(1588),v=l(34867);function getCardContentUtilityClass(e){return(0,v.Z)("MuiCardContent",e)}(0,s.Z)("MuiCardContent",["root"]);var c=l(85893);let m=["className","component"],useUtilityClasses=e=>{let{classes:t}=e;return(0,a.Z)({root:["root"]},getCardContentUtilityClass,t)},f=(0,u.ZP)("div",{name:"MuiCardContent",slot:"Root",overridesResolver:(e,t)=>t.root})(()=>({padding:16,"&:last-child":{paddingBottom:24}})),h=r.forwardRef(function(e,t){let l=(0,d.Z)({props:e,name:"MuiCardContent"}),{className:r,component:a="div"}=l,u=(0,i.Z)(l,m),s=(0,n.Z)({},l,{component:a}),v=useUtilityClasses(s);return(0,c.jsx)(f,(0,n.Z)({as:a,className:(0,o.Z)(v.root,r),ownerState:s,ref:t},u))});var p=h},2097:function(e,t,l){"use strict";var n=l(67294);t.Z=e=>{let t=n.useRef({});return n.useEffect(()=>{t.current=e}),t.current}},12281:function(e,t,l){(window.__NEXT_P=window.__NEXT_P||[]).push(["/tools/material-tracker",function(){return l(72659)}])},72659:function(e,t,l){"use strict";l.r(t);var n=l(85893),i=l(67294),r=l(21785),o=l(98396),a=l(51233),u=l(417),d=l(87918),s=l(15861),v=l(50135),c=l(66242),m=l(44267),f=l(30925),h=l(70473),p=l(83321),x=l(74721),g=l(5072),y=l(88344),w=l(23513),C=l(2962),N=l(8364),Z=l(93946);let j=(0,r.D)({trim:!0,limit:250});t.default=()=>{var e;let{state:t}=(0,i.useContext)(w.I),l=(0,o.Z)(e=>e.breakpoints.down("md"),{noSsr:!0}),[r,I]=(0,i.useState)([]),[A,S]=(0,i.useState)(""),[b,E]=(0,i.useState)(""),[T,U]=(0,i.useState)({}),[k,O]=(0,i.useState)(JSON.parse(localStorage.getItem("material-tracker"))||{}),Q=(0,i.useMemo)(()=>h.itemsArray.filter(e=>{let{itemType:t,typeGen:l,displayName:n}=e;return"ERROR"!==n&&"Blank"!==n&&"Filler"!==n&&"DONTFILL"!==n&&"FILLER"!==n&&"Equip"!==t&&!l.includes("Quest")}),[]),q=(0,i.useMemo)(()=>(0,y.Nx)(null==t?void 0:t.characters,null==t?void 0:t.account),[null==t?void 0:t.characters,null==t?void 0:t.account]),[M,L]=(0,i.useState)({material:!1,threshold:!1}),handleDeleteThreshold=e=>{let t={...k};delete t[e],O(t),U({}),localStorage.setItem("material-tracker",JSON.stringify(t))};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(C.PB,{title:"Material Tracker | Idleon Toolbox",description:"Add a material, set your own threshold and keep track of your inventory."}),(0,n.jsx)(a.Z,{children:(0,n.jsx)(u.Z,{id:"material tracker",value:r,onChange:(e,t)=>{I(t),L({...M,material:!1})},multiple:!0,options:[...Q],filterSelectedOptions:!0,disableCloseOnSelect:!0,filterOptions:j,getOptionLabel:e=>{var t;return(null==e?void 0:e.displayName)?null==e?void 0:null===(t=e.displayName)||void 0===t?void 0:t.replace(/_/g," "):""},sx:{width:l?"100%":600,mb:3,flexShrink:1},renderTags:(e,t)=>e.map((e,l)=>{var i;return(0,n.jsx)(d.Z,{icon:(0,n.jsx)("img",{width:24,height:24,src:"".concat(f.prefix,"data/").concat(null==e?void 0:e.rawName,".png"),alt:""}),label:null==e?void 0:null===(i=e.displayName)||void 0===i?void 0:i.replace(/_/g," "),...t({index:l})},l)}),renderOption:(e,t)=>{var l;return t?(0,i.createElement)(a.Z,{...e,key:e.id,gap:2,direction:"row",children:[(0,n.jsx)("img",{width:24,height:24,src:"".concat(f.prefix,"data/").concat(null==t?void 0:t.rawName,".png"),alt:""},"img-".concat(e.id)),(0,n.jsx)(s.Z,{children:null==t?void 0:null===(l=t.displayName)||void 0===l?void 0:l.replace(/_/g," ")},"text-".concat(e.id))]}):null},renderInput:e=>(0,n.jsx)(v.Z,{...e,error:null==M?void 0:M.material,label:"Material name",variant:"outlined"})})}),(0,n.jsxs)(a.Z,{justifyContent:l?"space-between":"flex-start",direction:"row",gap:3,alignItems:"center",flexWrap:"wrap",children:[(0,n.jsx)(v.Z,{error:null==M?void 0:M.threshold,value:A,onChange:e=>{let{target:t}=e,l=t.value.replace(/,/g,"");S((0,f.numberWithCommas)(l)),L({...M,threshold:!1})},label:"Threshold"}),(0,n.jsx)(v.Z,{value:b,onChange:e=>{let{target:t}=e;return E(t.value)},label:"Note"}),(0,n.jsx)(p.Z,{onClick:()=>{let e={};0===r.length&&(e.material=!0);let t=null==A?void 0:A.replace(/,/g,"");if((!A||isNaN(t))&&(e.threshold=!0),(null==e?void 0:e.material)||(null==e?void 0:e.threshold)){L(e);return}let l={...k};r.forEach(e=>{l[null==e?void 0:e.rawName]={item:e,threshold:parseInt(t),note:b}}),O(l),localStorage.setItem("material-tracker",JSON.stringify(l)),I([]),S(""),E("")},sx:{height:"fit-content"},variant:"contained",children:"Add threshold"})]}),(0,n.jsx)(a.Z,{mt:3,direction:l?"column":"row",gap:3,flexWrap:"wrap",children:null===(e=Object.values(k))||void 0===e?void 0:e.map((e,t)=>{let{item:i,threshold:r,note:o}=e,{amount:u}=(0,y.AN)(q,null==i?void 0:i.displayName),d,v=.02*r;return d=u<r?"error.light":u<=r+v?"warning.main":"success.main",(0,n.jsx)(c.Z,{children:(0,n.jsx)(m.Z,{children:(0,n.jsxs)(a.Z,{direction:l?"row":"column",alignItems:"center",justifyContent:l?"space-between":"flex-start",gap:l?3:0,flexWrap:"wrap",sx:{position:"relative"},onMouseEnter:()=>U({...T,[t]:!0}),onMouseLeave:()=>U({...T,[t]:!1}),children:[(null==T?void 0:T[t])?(0,n.jsx)(Z.Z,{onClick:()=>handleDeleteThreshold(null==i?void 0:i.rawName),sx:{position:"absolute",top:l?0:-10,left:-10},children:(0,n.jsx)(N.Z,{})}):null,(0,n.jsx)("img",{style:l?{marginLeft:16}:{},width:48,height:48,src:"".concat(f.prefix,"data/").concat(null==i?void 0:i.rawName,".png"),alt:""}),(0,n.jsxs)(a.Z,{direction:"row",gap:2,children:[o&&l?(0,n.jsx)(g.Z,{title:o,children:(0,n.jsx)(x.Z,{})}):null,(0,n.jsx)(s.Z,{children:(0,f.cleanUnderscore)(null==i?void 0:i.displayName)}),o&&!l?(0,n.jsx)(g.Z,{title:o,children:(0,n.jsx)(x.Z,{})}):null]}),(0,n.jsxs)(s.Z,{color:d,mt:l?0:1,children:[(0,f.notateNumber)(u),"/",(0,f.notateNumber)(r)]})]})})},"tracked-item-".concat(t))})})]})}},88344:function(e,t,l){"use strict";l.d(t,{AN:function(){return findQuantityOwned},F6:function(){return flattenCraftObject},Nx:function(){return getAllItems},QU:function(){return findItemInInventory},ju:function(){return calculateItemTotalAmount},t8:function(){return addStoneDataToEquip},tP:function(){return addEquippedItems},tT:function(){return createItemsWithUpgrades},w$:function(){return getAllTools},wA:function(){return findItemByDescriptionInInventory},zi:function(){return getStatsFromGear}});var n=l(70473);let addStoneDataToEquip=(e,t)=>{var l;return e&&t?null===(l=Object.keys(t))||void 0===l?void 0:l.reduce((l,n)=>{if("UQ1txt"===n||"UQ2txt"===n)return{...l,[n]:(null==e?void 0:e[n])||(null==t?void 0:t[n])};let i=null==e?void 0:e[n],r=null==t?void 0:t[n],o=i;return isNaN(r)||r<0?{...l,[n]:r}:(o=(i||0)+((null==t?void 0:t.UQ1txt)&&(null==e?void 0:e.Type)!=="KEYCHAIN"&&(null==e?void 0:e.UQ1txt)!==(null==t?void 0:t.UQ1txt)?0:r),{...l,[n]:parseFloat(o)})},{}):{}},calculateItemTotalAmount=function(e,t,l){let n=arguments.length>3&&void 0!==arguments[3]&&arguments[3];return null==e?void 0:e.reduce((e,i)=>{if(l)t===(n?null==i?void 0:i.rawName:null==i?void 0:i.name)&&(e+=null==i?void 0:i.amount);else{var r,o;(n?null==i?void 0:null===(r=i.rawName)||void 0===r?void 0:r.includes(t):null==i?void 0:null===(o=i.name)||void 0===o?void 0:o.includes(t))&&(e+=null==i?void 0:i.amount)}return e},0)},getStatsFromGear=function(e,t,l){var i,r,o,a,u,d,s,v,c,m,f,h;let p=arguments.length>3&&void 0!==arguments[3]&&arguments[3],{equipment:x,tools:g}=e||{},y=null!==(m=null==l?void 0:null===(o=l.lab)||void 0===o?void 0:null===(r=o.playersChips)||void 0===r?void 0:null===(i=r[null==e?void 0:e.playerId])||void 0===i?void 0:i.find(e=>16===e.index))&&void 0!==m?m:0,w=null!==(f=null==l?void 0:null===(d=l.lab)||void 0===d?void 0:null===(u=d.playersChips)||void 0===u?void 0:null===(a=u[null==e?void 0:e.playerId])||void 0===a?void 0:a.find(e=>17===e.index))&&void 0!==f?f:0,C=null!==(h=null==l?void 0:null===(c=l.lab)||void 0===c?void 0:null===(v=c.playersChips)||void 0===v?void 0:null===(s=v[null==e?void 0:e.playerId])||void 0===s?void 0:s.find(e=>18===e.index))&&void 0!==h?h:0,N=p?g:x;return isNaN(t)?null==N?void 0:N.reduce((e,l)=>e+getStatFromEquipment(l,t),0):null==N?void 0:N.reduce((e,l,i)=>{var r;return e+getStatFromEquipment(l,null===n.bonuses||void 0===n.bonuses?void 0:null===(r=n.bonuses.etcBonuses)||void 0===r?void 0:r[t])*(3===i&&C||10===i&&y||9===i&&w?2:1)},0)},getStatFromEquipment=(e,t)=>{let l=(null==e?void 0:e.UQ1txt)===t?null==e?void 0:e.UQ1val:0,n=(null==e?void 0:e.UQ2txt)===t?null==e?void 0:e.UQ2val:0;return(null==e?void 0:e[t])?null==e?void 0:e[t]:l+n},createItemsWithUpgrades=(e,t,l)=>Array.from(Object.values(e)).reduce((e,i,r)=>{var o;let a=addStoneDataToEquip(null===n.items||void 0===n.items?void 0:n.items[i],null==t?void 0:t[r]),u="",d={...null===n.items||void 0===n.items?void 0:n.items[i],...a};return(null==d?void 0:d.UQ1txt)&&(u+=null==d?void 0:d.UQ1txt),(null==d?void 0:d.UQ2txt)&&(u+=" ".concat(null==d?void 0:d.UQ2txt)),i?[...e,{name:null===n.items||void 0===n.items?void 0:null===(o=n.items[i])||void 0===o?void 0:o.displayName,rawName:i,owner:l,..."Blank"===i?{}:{...null===n.items||void 0===n.items?void 0:n.items[i],...a},misc:u}]:e},[]),findItemInInventory=(e,t)=>t?e.reduce((e,l)=>{let{name:n,owner:i,amount:r}=l;if(n===t){var o;return null!=e&&e[i]?{...e,[i]:{amount:(null==e?void 0:null===(o=e[i])||void 0===o?void 0:o.amount)+1}}:{...e,[i]:{amount:r}}}return e},{}):{},findItemByDescriptionInInventory=(e,t)=>{if(!t)return{};let l=e.filter(e=>{var l,n;let{misc:i,description:r}=e;return(null==r?void 0:null===(l=r.toLowerCase())||void 0===l?void 0:l.includes(null==t?void 0:t.toLowerCase()))||(null==i?void 0:null===(n=i.toLowerCase())||void 0===n?void 0:n.includes(null==t?void 0:t.toLowerCase()))},[]);return null==l?void 0:l.reduce((e,t)=>{let l=null==e?void 0:e.findIndex(e=>(null==e?void 0:e.rawName)===(null==t?void 0:t.rawName)),n=null==e?void 0:e[l];if(n){var i;let r=null==n?void 0:null===(i=n.owners)||void 0===i?void 0:i.includes(null==t?void 0:t.owner),o=r?null==n?void 0:n.owners:[...null==n?void 0:n.owners,null==t?void 0:t.owner];(null==n?void 0:n.misc)===(null==t?void 0:t.misc)&&(null==e||e.splice(l,1)),e=[...e,{...t,owners:o}]}else e=[...e,{...t,owners:[null==t?void 0:t.owner]}];return e},[])},flattenCraftObject=e=>{if(!e)return[];let t={},l=JSON.parse(JSON.stringify(e)),flatten=(e,l)=>null==e?void 0:e.reduce((e,n)=>(e.push(n),n.materials&&(e=e.concat(flatten(null==n?void 0:n.materials,l)),n.materials=[]),t[null==n?void 0:n.itemName]?t[null==n?void 0:n.itemName].itemQuantity+=null==n?void 0:n.itemQuantity:t[null==n?void 0:n.itemName]=n,e),[]);return flatten(null==l?void 0:l.materials,t),Object.values(t)},findQuantityOwned=(e,t)=>{var l;let n=findItemInInventory(e,t);return null===(l=Object.entries(n))||void 0===l?void 0:l.reduce((e,t)=>{let[l,{amount:n}]=t;return{amount:(null==e?void 0:e.amount)+n,owner:[...null==e?void 0:e.owner,l]}},{amount:0,owner:[]})},addEquippedItems=(e,t)=>t?null==e?void 0:e.reduce((e,t)=>{let{tools:l,equipment:n,food:i}=t;return[...e,...l,...n,...i]},[]).filter(e=>{let{rawName:t}=e;return"Blank"!==t}).map(e=>(null==e?void 0:e.amount)?e:{...e,amount:1}):[],getAllItems=(e,t)=>{let l=null==e?void 0:e.reduce((e,t)=>{let{inventory:l=[]}=t;return[...e,...l]},[]);return[...l||[],...(null==t?void 0:t.storage)||[]]},getAllTools=()=>{var e,t,l,i,r;let o=null===n.itemsArray||void 0===n.itemsArray?void 0:null===(e=n.itemsArray.filter(e=>{let{rawName:t}=e;return null==t?void 0:t.match(/EquipmentTools[0-9]+/)}))||void 0===e?void 0:e.filter(e=>{let{rawName:t}=e;return"EquipmentTools13"!==t&&"EquipmentTools10"!==t}),a=null===n.itemsArray||void 0===n.itemsArray?void 0:null===(t=n.itemsArray.filter(e=>{let{rawName:t}=e;return null==t?void 0:t.match(/EquipmentToolsHatchet[0-9]+/)}))||void 0===t?void 0:t.filter(e=>{let{rawName:t}=e;return"EquipmentToolsHatchet0"!==t&&"EquipmentToolsHatchet3"!==t&&"EquipmentToolsHatchet11"!==t&&"EquipmentToolsHatchet10"!==t}),u=null===n.itemsArray||void 0===n.itemsArray?void 0:null===(l=n.itemsArray.filter(e=>{let{rawName:t}=e;return null==t?void 0:t.match(/FishingRod[0-9]+/)}))||void 0===l?void 0:l.filter(e=>{let{rawName:t}=e;return"FishingRod1"!==t}),d=null===n.itemsArray||void 0===n.itemsArray?void 0:null===(i=n.itemsArray.filter(e=>{let{rawName:t}=e;return null==t?void 0:t.match(/CatchingNet[0-9]+/)}))||void 0===i?void 0:i.filter(e=>{let{rawName:t}=e;return"CatchingNet1"!==t}),s=null===n.itemsArray||void 0===n.itemsArray?void 0:n.itemsArray.filter(e=>{let{rawName:t}=e;return null==t?void 0:t.match(/TrapBoxSet[0-9]+/)}),v=null===n.itemsArray||void 0===n.itemsArray?void 0:null===(r=n.itemsArray.filter(e=>{let{rawName:t}=e;return null==t?void 0:t.match(/WorshipSkull[0-9]+/)}))||void 0===r?void 0:r.filter(e=>{let{rawName:t}=e;return"WorshipSkull8"!==t});return[o,a,u,d,s,v]}}},function(e){e.O(0,[417,9774,2888,179],function(){return e(e.s=12281)}),_N_E=e.O()}]);