(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2731],{65600:function(e,n,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/tools/item-planner",function(){return t(39818)}])},39818:function(e,n,t){"use strict";t.r(n),t.d(n,{default:function(){return item_planner}});var l=t(82729),i=t(85893),a=t(67294),o=t(70473),r=t(21785),s=t(15861),d=t(51233),c=t(50135),u=t(87109),m=t(94054),p=t(40476),v=t(72890),x=t(50480),h=t(36872),j=t(67358),g=t(38895),f=t(22797),y=t(417),Z=t(49425),b=t(69368),w=t(21480),N=t(30925),I=t(83321),_=t(88344),C=t(93946),O=t(23508),Q=t(94895),k=t(34282),T=t(96540),S=t(8364),E=t(61599),A=t(2511),F=t(66242),M=t(44267);function _templateObject(){let e=(0,l._)(["\n  width: 40px;\n"]);return _templateObject=function(){return e},e}let P=E.Z.img(_templateObject()),OwnerTooltip=e=>{let{itemName:n,owners:t}=e;return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(s.Z,{fontWeight:"bold",variant:"h5",children:(0,N.cleanUnderscore)(n)}),(0,i.jsx)(d.Z,{children:(0,i.jsx)(d.Z,{direction:"row",children:(null==t?void 0:t.length)>0?null==t?void 0:t.map((e,n)=>(0,i.jsx)("div",{children:(0,i.jsxs)(s.Z,{children:[e,"\xa0"]})},n+""+e)):(0,i.jsx)(s.Z,{children:"None"})})})]})};var item_planner_ItemsList=e=>{var n;let{account:t,inventoryItems:l,itemsList:r=[],copies:c=1,itemDisplay:u}=e,mapItems=(e,n)=>null==e?void 0:e.reduce((e,i)=>{var a,r,s;let d,c;if((null==i?void 0:i.itemName)==="Dungeon_Credits_Flurbo_Edition")d=null!==(r=null==t?void 0:null===(a=t.dungeons)||void 0===a?void 0:a.flurbos)&&void 0!==r?r:0,c=["account"];else{let e=(0,_.AN)(l,null==i?void 0:i.itemName);d=null==e?void 0:e.amount,c=null==e?void 0:e.owner}if("0"===n){let n=(null==i?void 0:i.itemQuantity)-d;if((null==i?void 0:i.type)==="Equip"&&n!==(null==i?void 0:i.itemQuantity)){let t=null===(s=(0,_.F6)(o.crafts[null==i?void 0:i.itemName]))||void 0===s?void 0:s.map(e=>{let{amount:t,owner:i}=(0,_.AN)(l,null==e?void 0:e.itemName);return{...e,baseQuantity:null==e?void 0:e.itemQuantity,itemQuantity:(null==e?void 0:e.itemQuantity)*n,quantityOwned:t,owner:i}});return t.forEach(t=>{var l,i;let a=null==e?void 0:null===(l=e[null==t?void 0:t.subType])||void 0===l?void 0:l.find(e=>(null==e?void 0:e.itemName)===(null==t?void 0:t.itemName)),o=null==e?void 0:null===(i=e[null==t?void 0:t.subType])||void 0===i?void 0:i.filter(e=>(null==e?void 0:e.itemName)!==(null==t?void 0:t.itemName));a&&n>0&&(null==a?void 0:a.itemQuantity)-d>(null==a?void 0:a.quantityOwned)&&(o=[...o||[],{...a,itemQuantity:(null==a?void 0:a.itemQuantity)-d}]),e={...e,[null==t?void 0:t.subType]:o}}),n>0&&(e={...e,[null==i?void 0:i.subType]:[...(null==e?void 0:e[null==i?void 0:i.subType])||[],{...i,quantityOwned:0,owner:c,itemQuantity:n}]}),e}return d>=(null==i?void 0:i.itemQuantity)?e:{...e,[null==i?void 0:i.subType]:[...(null==e?void 0:e[null==i?void 0:i.subType])||[],{...i,owner:c,quantityOwned:d}]}}return"1"!==n?e:{...e,[null==i?void 0:i.subType]:[...(null==e?void 0:e[null==i?void 0:i.subType])||[],{...i,quantityOwned:d,owner:c}]}},{}),m=(0,a.useMemo)(()=>mapItems(r,u),[r,u,l,t]);return(0,i.jsx)(d.Z,{flexWrap:"wrap",direction:"row",gap:4,children:null===(n=Object.entries(m))||void 0===n?void 0:n.map((e,n)=>{let[t,l]=e,a="0"!==u||(null==l?void 0:l.length)>0;return a?(0,i.jsx)(F.Z,{variant:"outlined",children:(0,i.jsxs)(M.Z,{children:[(0,i.jsx)("span",{className:"title",children:(0,N.cleanUnderscore)((0,N.pascalCase)(t))}),(0,i.jsx)(d.Z,{flexWrap:"wrap",direction:"row",gap:3,children:null==l?void 0:l.map((e,n)=>{let{itemName:t,itemQuantity:l,rawName:a,type:o,quantityOwned:r,owner:m}=e;return(0,i.jsxs)(d.Z,{gap:1,alignItems:"center",children:[(0,i.jsx)(A.Z,{title:(0,i.jsx)(OwnerTooltip,{itemName:t,owners:m}),children:(0,i.jsx)(P,{src:"".concat(N.prefix,"data/").concat(a,".png"),alt:""})}),(0,i.jsxs)(d.Z,{direction:"row",children:[(0,i.jsx)(A.Z,{title:r>=1e3?(0,N.numberWithCommas)(r):"",children:(0,i.jsx)(s.Z,{color:r>=("0"===u?parseInt(l):parseInt(l)*c)?"success.light":"",children:(0,N.notateNumber)(r)})}),(0,i.jsx)(A.Z,{title:l>=1e3?(0,N.numberWithCommas)(l):"",children:(0,i.jsxs)(s.Z,{color:r>=("0"===u?parseInt(l):parseInt(l)*c)?"success.light":"",children:["/","0"===u?(0,N.notateNumber)(parseInt(l)):(0,N.notateNumber)(parseInt(l)*c,2)]})})]})]},t+""+n)})})]})},t+""+n):null})})},W=t(2962),q=t(14689),D=t(73397);function item_planner_templateObject(){let e=(0,l._)(["\n  width: 50px;\n"]);return item_planner_templateObject=function(){return e},e}function _templateObject1(){let e=(0,l._)(["\n  .item-wrapper {\n    width: 105px;\n    height: 102px;\n    position: relative;\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n  }\n\n  .title {\n    font-size: 20px;\n    font-weight: bold;\n    display: inline-block;\n    margin-bottom: 10px;\n  }\n\n  .preview {\n    min-height: 77px;\n    min-width: 77px;\n  }\n\n  .controls {\n    display: flex;\n    align-items: center;\n    gap: 10px;\n    flex-wrap: wrap;\n    @media (max-width: 800px) {\n      padding: 10px;\n    }\n  }\n\n  .items-wrapper {\n    margin-top: 15px;\n\n    .items {\n      margin-top: 10px;\n      display: flex;\n      flex-wrap: wrap;\n      gap: 15px;\n    }\n  }\n\n  .content {\n    margin-top: 25px;\n    display: grid;\n    grid-template-columns: 1fr 3fr;\n    column-gap: 50px;\n  }\n\n  .crafts-container {\n    margin-top: 15px;\n  }\n"]);return _templateObject1=function(){return e},e}function _templateObject2(){let e=(0,l._)(["\n  ","\n  && label.Mui-focused {\n    color: rgba(255, 255, 255, 0.7);\n  }\n"]);return _templateObject2=function(){return e},e}function _templateObject3(){let e=(0,l._)(["\n  && {\n    color: white;\n  }\n"]);return _templateObject3=function(){return e},e}let R=(0,r.D)({trim:!0}),z={rawName:"EquipmentTransparent108"},MaterialsTooltip=e=>{let{name:n,items:t}=e;return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(s.Z,{fontWeight:"bold",variant:"h5",children:(0,N.cleanUnderscore)(n)}),(0,i.jsx)(d.Z,{direction:"row",gap:1,flexWrap:"wrap",children:null==t?void 0:t.map((e,n)=>{let{rawName:t,itemQuantity:l}=e;return(0,i.jsxs)(d.Z,{alignItems:"center",children:[(0,i.jsx)(L,{src:"".concat(N.prefix,"data/").concat(t,".png"),alt:""}),(0,i.jsx)(s.Z,{children:l})]},t+""+n)})})]})},L=E.Z.img(item_planner_templateObject()),U=E.Z.div(_templateObject1()),X=(0,E.Z)(c.Z)(_templateObject2(),e=>{let{width:n}=e;return n?"width:".concat(n,";"):""}),B=(0,E.Z)(b.Z)(_templateObject3());var item_planner=e=>{var n,t;let{}=e,{state:l,lastUpdated:r,dispatch:b}=(0,a.useContext)(w.I),{planner:E={sections:[]}}=l,[F]=(0,a.useState)(Object.keys(o.crafts)),[M,P]=(0,a.useState)({0:""}),[L,V]=(0,a.useState)([]),[G,H]=(0,a.useState)([z]),[J,K]=(0,a.useState)("0"),[Y,$]=(0,a.useState)(!1),[ee,en]=(0,a.useState)(1),[et,el]=(0,a.useState)({}),[ei,ea]=(0,a.useState)(),eo=(0,a.useMemo)(()=>(0,_.tP)(null==l?void 0:l.characters,Y),[Y]),er=(0,a.useMemo)(()=>(0,_.Nx)(null==l?void 0:l.characters,null==l?void 0:l.account),[null==l?void 0:l.characters,null==l?void 0:l.account]),es=(0,a.useRef)();(0,a.useEffect)(()=>{var e;(null==l?void 0:l.characters)||(null==l?void 0:l.account)?V(Y?[...er||[],...eo||[]]:er):V(o.itemsArray),H(null==E?void 0:null===(e=E.sections)||void 0===e?void 0:e.map(()=>z))},[l,r,Y]);let handleFileChange=async e=>{let n=e.target.files[0];if(!n||(null==n?void 0:n.type)!=="application/json"){console.error("File isn't a json file");return}let t=await n.text();t&&(null==(t=(0,N.tryToParse)(t))?void 0:t.sections)&&b({type:"planner",data:{sections:null==t?void 0:t.sections}})},onItemChange=(e,n)=>{let t=G.map((t,l)=>l===n?e?o.crafts[e]:z:t);P({...M,["".concat(n)]:e}),H(t)},onRemoveItem=(e,n,t,l)=>{var i;let a,r;if((null==n?void 0:n.itemQuantity)===0&&t>0)return;let s=null==E?void 0:null===(i=E.sections)||void 0===i?void 0:i[e],d=o.crafts[null==n?void 0:n.itemName];if(d){a=calculateItemsQuantity(null==s?void 0:s.items,d,!1,!1,t,l);let i=Array.isArray(n)?n:(0,_.F6)(n);r=null==i?void 0:i.reduce((e,n)=>calculateItemsQuantity(e,n,!0,!1,t,l),null==s?void 0:s.materials);let o=updateSectionData(e,{materials:r,items:a,name:null==s?void 0:s.name});b({type:"planner",data:{sections:o}})}},onAddItem=(e,n,t)=>{if((null==n?void 0:n.rawName)!==z.rawName){var l;let i,a;let r=null==E?void 0:null===(l=E.sections)||void 0===l?void 0:l[e];i=calculateItemsQuantity(null==r?void 0:r.items,n,!1,!0,t);let s=Array.isArray(o.crafts[null==n?void 0:n.itemName])?o.crafts[null==n?void 0:n.itemName]:(0,_.F6)(o.crafts[null==n?void 0:n.itemName]);a=null==s?void 0:s.reduce((e,n)=>calculateItemsQuantity(e,n,!0,!0,t),null==r?void 0:r.materials);let d=updateSectionData(e,{materials:a,items:i,name:null==r?void 0:r.name});b({type:"planner",data:{sections:d}}),P({...M,[e]:""}),en(1)}},updateSectionData=(e,n)=>{var t;return null==E?void 0:null===(t=E.sections)||void 0===t?void 0:t.map((t,l)=>e===l?n:t)},calculateItemsQuantity=function(e,n,t){let l=!(arguments.length>3)||void 0===arguments[3]||arguments[3],i=arguments.length>4?arguments[4]:void 0,a=arguments.length>5?arguments[5]:void 0,o=null==e?void 0:e.find(e=>(null==n?void 0:n.itemName)===(null==e?void 0:e.itemName));return o?null==e?void 0:e.reduce((e,t)=>{if((null==n?void 0:n.itemName)!==(null==t?void 0:t.itemName))return[...e,t];let r=i?i*(null==n?void 0:n.itemQuantity):null==t?void 0:t.itemQuantity;return!l&&(null==o?void 0:o.itemQuantity)-r<=0&&a?e:[...e,{...o,itemQuantity:l?(null==o?void 0:o.itemQuantity)+r:(null==o?void 0:o.itemQuantity)-r,itemCount:parseFloat(i)}]},[]):l?[...e||[],{...n,itemQuantity:(null==n?void 0:n.itemQuantity)*i,itemCount:parseFloat(i)}]:e},removeSection=e=>{let n=E.sections.filter((n,t)=>t!==e);P({...M,[e]:""}),b({type:"planner",data:{sections:n}})};return(0,i.jsxs)(U,{children:[(0,i.jsx)(W.PB,{title:"Item Planner | Idleon Toolbox",description:"Useful tool to keep track of your crafting projects by tracking existing and missing materials"}),(null==l?void 0:l.characters)||(null==l?void 0:l.account)?null:(0,i.jsx)(s.Z,{component:"div",sx:{mb:2},variant:"caption",children:"* This tool will work better if you're logged in"}),(0,i.jsxs)(d.Z,{direction:"row",gap:5,flexWrap:"wrap",children:[(0,i.jsxs)("div",{children:[(0,i.jsx)(d.Z,{direction:"row",alignItems:"center",children:(0,i.jsx)(c.Z,{sx:{mt:1},label:"Section name",placeholder:"Enter section name",onChange:e=>ea(e.target.value),InputProps:{endAdornment:(0,i.jsx)(u.Z,{position:"end",children:(0,i.jsx)(C.Z,{onClick:()=>{b({type:"planner",data:{sections:[...(null==E?void 0:E.sections)||[],{items:[],materials:[],name:ei||"section-".concat(Math.floor(100*Math.random()))}]}})},children:(0,i.jsx)(T.Z,{})})})}})}),(0,i.jsx)(A.Z,{title:"This will reset all sections and items",children:(0,i.jsxs)(I.Z,{sx:{mt:1},onClick:()=>{P({0:""}),H([z]),b({type:"planner",data:{sections:[]}})},children:[(0,i.jsx)(k.Z,{})," Reset all sections"]})})]}),(0,i.jsxs)(d.Z,{sx:{pl:1,mt:1},children:[(0,i.jsxs)(m.Z,{children:[(0,i.jsx)(p.Z,{id:"demo-radio-buttons-group-label",children:"Display"}),(0,i.jsxs)(v.Z,{row:!0,"aria-labelledby":"demo-radio-buttons-group-label",defaultValue:"0",name:"radio-buttons-group",onChange:e=>K(e.target.value),children:[(0,i.jsx)(x.Z,{value:"0",control:(0,i.jsx)(h.Z,{}),label:"Show Missing Items"}),(0,i.jsx)(x.Z,{value:"1",control:(0,i.jsx)(h.Z,{}),label:"Show All Items"})]})]}),(0,i.jsx)(x.Z,{control:(0,i.jsx)(B,{checked:Y,onChange:()=>$(!Y),name:"Include Equipped Items",color:"default"}),label:"Include Equipped Items"})]}),(0,i.jsxs)(d.Z,{gap:1,sx:{ml:"auto"},alignItems:"center",justifyContent:"center",direction:"row",children:[(0,i.jsx)(A.Z,{title:"Export all sections",children:(0,i.jsxs)(I.Z,{onClick:()=>{var e;let n=localStorage.getItem("planner");n&&(null==E?void 0:null===(e=E.sections)||void 0===e?void 0:e.length)!==0&&(0,N.downloadFile)(n,"it-item-planner.json")},children:[(0,i.jsx)(q.Z,{sx:{mr:1}}),"Export"]})}),(0,i.jsx)(A.Z,{title:"Import (this will override your sections)",children:(0,i.jsxs)(I.Z,{onClick:()=>{es.current.click()},children:[(0,i.jsx)(D.Z,{sx:{mr:1}}),"Import"]})}),(0,i.jsx)("input",{type:"file",id:"file",ref:es,style:{display:"none"},accept:".json",onChange:handleFileChange})]})]}),(0,i.jsx)(d.Z,{sx:{mt:2},children:(null==E?void 0:null===(n=E.sections)||void 0===n?void 0:n.length)>0?null==E?void 0:null===(t=E.sections)||void 0===t?void 0:t.map((e,n)=>{var t;let{items:r,materials:c,name:u}=e;return(0,i.jsxs)(j.Z,{children:[(0,i.jsx)(g.Z,{expandIcon:(0,i.jsx)(O.Z,{}),"aria-controls":"panel1a-content",id:"panel1a-header",children:(0,i.jsx)(s.Z,{children:u||"Accordion-".concat(n)})}),(0,i.jsxs)(f.Z,{children:[(0,i.jsxs)(I.Z,{onClick:()=>removeSection(n),children:[(0,i.jsx)(Q.Z,{})," Remove Section"]}),(0,i.jsxs)("div",{className:"controls",children:[(0,i.jsx)("div",{className:"preview",children:(null==G?void 0:G[n])?(0,i.jsx)("img",{src:"".concat(N.prefix,"data/").concat(null==G?void 0:null===(t=G[n])||void 0===t?void 0:t.rawName,".png"),alt:""}):null}),(0,i.jsx)(y.Z,{id:"item-locator",value:null==M?void 0:M[n],onChange:(e,t)=>onItemChange(t,n),autoComplete:!0,options:[null==M?void 0:M[n],...F],filterSelectedOptions:!0,filterOptions:R,getOptionLabel:e=>e?null==e?void 0:e.replace(/_/g," "):"",renderOption:(e,n)=>{var t;return n?(0,i.jsxs)(d.Z,{...e,gap:2,direction:"row",children:[(0,i.jsx)("img",{width:24,height:24,src:"".concat(N.prefix,"data/").concat(null===o.crafts||void 0===o.crafts?void 0:null===(t=o.crafts[n])||void 0===t?void 0:t.rawName,".png"),alt:""}),null==n?void 0:n.replace(/_/g," ")]}):(0,a.createElement)("span",{...e,style:{height:0},key:"empty"})},style:{width:300},renderInput:e=>(0,i.jsx)(X,{...e,label:"Item Name",variant:"outlined"})}),(0,i.jsx)(X,{value:ee,width:"100px",inputProps:{min:1},onChange:e=>{var n;return en(null==e?void 0:null===(n=e.target)||void 0===n?void 0:n.value)},type:"number",label:"Item Count",variant:"outlined"}),(0,i.jsx)(I.Z,{color:"primary",variant:"contained",onClick:()=>onAddItem(n,null==G?void 0:G[n],ee),title:"Add Item",children:"Add"})]}),(0,i.jsxs)("div",{className:"content",children:[(0,i.jsxs)("div",{className:"items-wrapper",children:[(0,i.jsx)("span",{className:"title",children:"Tracked Items"}),(0,i.jsx)("div",{className:"items",children:null==r?void 0:r.map((e,t)=>(0,i.jsxs)("div",{className:"item-wrapper",onMouseEnter:()=>el({...et,["".concat(n,"-").concat(t)]:!0}),onMouseLeave:()=>el({...et,["".concat(n,"-").concat(t)]:!1}),children:[(0,i.jsx)(Z.Z,{badgeContent:(0,N.numberWithCommas)(null==e?void 0:e.itemQuantity),max:1e4,anchorOrigin:{vertical:"top",horizontal:"right"},color:"primary",children:(0,i.jsx)(A.Z,{title:(0,i.jsx)(MaterialsTooltip,{name:null==e?void 0:e.itemName,items:(0,_.F6)(e)}),children:(0,i.jsx)("img",{src:"".concat(N.prefix,"data/").concat(null==e?void 0:e.rawName,".png"),alt:""},(null==e?void 0:e.rawName)+" "+t)})}),(null==et?void 0:et["".concat(n,"-").concat(t)])?(0,i.jsxs)("div",{className:"buttons",children:[(0,i.jsx)(C.Z,{type:"bottom",size:"small",onClick:()=>onAddItem(n,{...e,itemQuantity:1},1),children:(0,i.jsx)(T.Z,{})}),(0,i.jsx)(C.Z,{type:"bottom",size:"small",onClick:()=>onRemoveItem(n,e,1),children:(0,i.jsx)(Q.Z,{})}),(0,i.jsx)(C.Z,{size:"small",onClick:()=>onRemoveItem(n,e,null==e?void 0:e.itemQuantity,!0),children:(0,i.jsx)(S.Z,{})})]}):null]},n+""+(null==e?void 0:e.itemName)+t))})]}),(0,i.jsxs)("div",{className:"crafts-container",children:[(0,i.jsx)("span",{className:"title",children:"Required Materials"}),(null==L?void 0:L.length)>0?(0,i.jsx)(item_planner_ItemsList,{itemsList:c,account:null==l?void 0:l.account,inventoryItems:L,itemDisplay:J}):null]})]})]})]},"accordion-".concat(n))}):(0,i.jsx)(s.Z,{sx:{mt:3},variant:"h3",children:"Please add a section"})})]})}}},function(e){e.O(0,[417,8356,381,9774,2888,179],function(){return e(e.s=65600)}),_N_E=e.O()}]);