(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[405],{2385:function(e,t,n){"use strict";n.d(t,{Z:function(){return _}});var r=n(7294),a=n(9163),i=n(1163),o=n(7665),s=n(266),c=n(809),l=n.n(c),d=n(282),p=n(5477),u=n(2063),m=n(1395),h=n(2605),f=n(9740),g=n(5893),x=function(){try{return(0,h.Z)(new Date,"dd/MM/yyyy HH:mm:ss")}catch(e){return console.log("Failed parsing date"),new Date}},y=(0,a.ZP)(d.Z).withConfig({displayName:"JsonImport__StyledButton",componentId:"sc-2fvihg-0"})(["&&{width:150px;text-transform:none;}"]),v=(0,a.ZP)(p.Z).withConfig({displayName:"JsonImport__StyledLoader",componentId:"sc-2fvihg-1"})(["&&{color:white;}"]),b=a.ZP.div.withConfig({displayName:"JsonImport__JsonImportStyled",componentId:"sc-2fvihg-2"})(["display:inline-flex;flex-wrap:wrap;align-items:center;margin-left:auto;iframe{position:absolute;top:-5000px;left:-5000px;}.updated-info{-webkit-animation:cssAnimation 5s forwards;animation:cssAnimation 5s forwards;}@keyframes cssAnimation{0%{opacity:1;}90%{opacity:1;}100%{opacity:0;}}@-webkit-keyframes cssAnimation{0%{opacity:1;}90%{opacity:1;}100%{opacity:0;}}"]),w=function(){var e=(0,r.useContext)(f.I),t=e.userData,n=e.setUserData,a=e.setUserLastUpdated,i=(0,r.useState)(!1),o=i[0],c=i[1],d=(0,r.useState)(!1),p=d[0],h=d[1],w=(0,r.useState)(null),j=w[0],O=w[1],N=(0,r.useState)(),_=N[0],C=N[1],S=(0,r.useState)(0),P=S[0],k=S[1],I=(0,r.useRef)(0),Z=(0,r.useState)(!1),D=Z[0],A=Z[1];I.current=P,(0,r.useEffect)((function(){return t&&A(!0),function(){clearInterval(_)}}),[t]);var E=function(e,t){A(t),c(!1),h(!1),O({success:t}),k(0),clearInterval(e)},T=function(){var e=(0,s.Z)(l().mark((function e(){var t,r;return l().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:try{o||(c(!0),h(!0),t=JSON.parse(localStorage.getItem("characterData")),localStorage.removeItem("characterData"),r=setInterval((function(){if(I.current>50)return console.log("Please make sure the latest version of idleon-data-extractor is installed and you're logged in and try again."),n(t),void E(r,!1);if(k(I.current+1),localStorage.getItem("characterData")){var e=JSON.parse(localStorage.getItem("characterData"));n(e),a(x()),E(r,!0)}}),1e3),C(r))}catch(i){console.log("Failed to load family JSON",i),c(!1)}case 1:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}();return(0,g.jsxs)(b,{children:[j?null!==j&&void 0!==j&&j.success?(0,g.jsx)(m.Z,{className:"updated-info",style:{marginRight:5,color:"rgb(76, 175, 80)"},titleAccess:"Updated"}):(0,g.jsx)(u.Z,{style:{marginRight:5,color:"#f48fb1"},titleAccess:"Please make sure the latest version of idleon-data-extractor is installed and try again."}):null,null!==j&&void 0!==j&&j.success?(0,g.jsx)("div",{className:"updated-info",style:{marginRight:10,color:"white"},children:"Updated"}):null,(0,g.jsx)(y,{variant:"contained",color:"primary",onClick:T,children:o?(0,g.jsx)(v,{size:24}):D?"Update":"Fetch Data"}),p?(0,g.jsx)("iframe",{height:"1px",width:"1px",src:"https://legendsofidleon.com"}):null]})},j=a.ZP.div.withConfig({displayName:"NavBar__ListWrapper",componentId:"sc-1uyrns6-0"})(["background-color:#393e46;.family-navigation{list-style-type:none;margin-left:30px;display:flex;flex-wrap:wrap;align-items:center;gap:20px;> li{cursor:pointer;padding-bottom:4px;&.active{border-bottom:1px solid #00ADB5;font-weight:bold;}}}"]),O=a.ZP.ul.withConfig({displayName:"NavBar__CustomList",componentId:"sc-1uyrns6-1"})(["display:flex;align-items:center;list-style-type:none;margin:0 auto;padding:10px 0;width:95%;min-height:40px;flex-wrap:wrap;gap:10px;> span{color:white;}"]),N=a.ZP.li.withConfig({displayName:"NavBar__ListItem",componentId:"sc-1uyrns6-2"})(["cursor:pointer;position:relative;display:block;padding:4px 0;color:white;text-decoration:none;text-transform:capitalize;transition:0.5s;"," ",' &::after{position:absolute;content:"";top:100%;left:0;width:100%;height:3px;background:',";transform:scaleX(0);transform-origin:right;transition:transform 0.5s;}&:hover{}&:hover::after{transform:scaleX(1);transform-origin:left;}a{text-decoration:none;color:black;&:visited{color:black;}}"],(function(e){var t=e.active,n=e.inner;return t?"border-bottom: 1px solid ".concat(n?"#00ADB5":"white",";"):""}),(function(e){return e.active?"font-weight: bold;":""}),(function(e){return e.inner?"#00ADB5":"white"})),_=function(){var e=(0,r.useContext)(f.I),t=e.display,n=e.setUserDisplay,a=e.userData,s=(0,i.useRouter)(),c=[{label:"Card Search",path:o.O4?o.O4:"/",name:"/"},{label:"Family",path:"".concat(o.O4,"family"),name:"family"}],l=Object.keys(o.FB).map((function(e){return e.replace(/([A-Z])/g," $1")}));return(0,g.jsx)(j,{children:(0,g.jsxs)(O,{children:[c.map((function(e,t){var n=e.label,a=e.path,i=e.name;return(0,g.jsxs)(r.Fragment,{children:[(0,g.jsx)(N,{inner:!1,active:null===s||void 0===s?void 0:s.pathname.endsWith(i),onClick:function(e){return function(e,t){e.preventDefault(),s.push(t)}(e,a)},children:n}),t!==c.length-1?(0,g.jsx)("span",{children:"|"}):null]},n+"-"+t)})),null!==s&&void 0!==s&&s.pathname.endsWith("family")&&(null===a||void 0===a?void 0:a.version)===o.QE?(0,g.jsx)("ul",{className:"family-navigation",children:l.map((function(e,r){return(0,g.jsx)(N,{onClick:function(){return n(r)},active:(null===t||void 0===t?void 0:t.view)===r,inner:!0,children:e},e+r)}))}):null,null!==s&&void 0!==s&&s.pathname.endsWith("family")?(0,g.jsx)(w,{}):null]})})}},4151:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return O}});var r=n(2809),a=n(7294),i=n(9163),o=n(7665),s=n(1267),c=n(9184),l=n(7397),d=n(5996),p=n(868),u=n(5893);function m(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function h(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?m(Object(n),!0).forEach((function(t){(0,r.Z)(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):m(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}var f=(0,i.ZP)((function(e){return(0,u.jsx)(p.ZP,h(h({},e),{},{classes:{popper:e.className,tooltip:"tooltip",touch:"touch"}}))})).withConfig({displayName:"CustomTooltip__StyledTooltip",componentId:"sc-1z0z8ct-0"})(["& .tooltip{will-change:contents;font-size:16px;background-color:#393e46;box-shadow:0 2px 4px -1px rgb(0 0 0 / 20%),0px 4px 5px 0px rgb(0 0 0 / 14%),0px 1px 10px 0px rgb(0 0 0 / 12%);max-width:300px;@media only screen and (max-width:600px){max-width:200px;}}& .touch{padding:8px;max-width:300px;@media only screen and (max-width:600px){max-width:200px;}}.tooltip-body{.tooltip-header{text-align:center;font-weight:bold;padding:10px 0;}.stars{border-top:1px solid white;padding:10px 0;display:flex;justify-content:space-around;.star-line{display:flex;align-items:center;flex-direction:column;}.image-wrapper{}.stat{margin-top:3px;}}}"]),g=function(e){var t,n=e.header,r=e.base,a=e.children;return(0,u.jsx)(f,{interactive:!0,enterTouchDelay:100,placement:"top-start",title:(0,u.jsxs)("div",{className:"tooltip-body",children:[(0,u.jsx)("div",{className:"tooltip-header",children:n}),(0,u.jsx)("div",{className:"stars",children:r?null===(t=[1,2,3,4])||void 0===t?void 0:t.map((function(e,t){return(0,u.jsxs)("div",{className:"star-line",children:[(0,u.jsx)("div",{className:"image-wrapper",children:0===t?(0,u.jsx)("span",{style:{fontWeight:"bold"},children:"Base"}):(0,u.jsx)("img",{src:"".concat(o.O4,"etc/Star").concat(t,".png"),alt:""})}),(0,u.jsx)("div",{className:"stat",children:r*(t+1)})]},r+" "+t)})):null})]}),children:a})},x=n(2385),y=n(65),v=i.ZP.div.withConfig({displayName:"common-styles__Wrapper",componentId:"sc-fzmwzp-0"})(["width:95%;margin:20px auto 0;@media (max-width:1440px){width:98%;}@media (max-width:750px){width:100%;margin:0;}"]),b=((0,i.ZP)(y.Z).withConfig({displayName:"common-styles__StyledTabs",componentId:"sc-fzmwzp-1"})(["&&{background-color:#393E46;}& .MuiTabs-indicator{background-color:#00ADB5;}"]),n(9008));function w(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function j(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?w(Object(n),!0).forEach((function(t){(0,r.Z)(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):w(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function O(){var e,t=(0,a.useState)(""),n=t[0],i=t[1],c=(0,a.useState)(o.ob),l=c[0],p=c[1];return(0,a.useEffect)((function(){var e=Object.keys(o.ob).reduce((function(e,t){var a=o.ob[t].filter((function(e){var t,r=e.effect,a=e.alsoEffect,i=null===r||void 0===r||null===(t=r.toLowerCase())||void 0===t?void 0:t.includes(n.toLowerCase()),o=null===a||void 0===a?void 0:a.some((function(e){var t;return null===e||void 0===e||null===(t=e.toLowerCase())||void 0===t?void 0:t.includes(n.toLowerCase())}));return i||o}));return j(j({},e),{},(0,r.Z)({},t,a))}),{});p(e)}),[n]),(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(b.default,{children:(0,u.jsx)("title",{children:"Idleon Toolbox - Card Search Helper"})}),(0,u.jsx)(x.Z,{}),(0,u.jsx)(v,{children:(0,u.jsxs)(C,{style:{padding:10},children:[(0,u.jsx)("h1",{style:{marginTop:0},children:"Search Cards by Stats"}),(0,u.jsx)(N,{InputProps:{endAdornment:(0,u.jsx)(_,{onClick:function(){return i("")},position:"end",children:(0,u.jsx)(d.Z,{})})},label:"Enter Card stat..",type:"text",value:n,onChange:function(e){var t=e.target;return i(null===t||void 0===t?void 0:t.value)}}),(0,u.jsx)("div",{className:"chips",children:["Show All","Choppin","Mining","Fishing","Catching","Trapping","Accuracy","Card Drop","Monster Exp","Skill Exp","Damage","Drop Rate","STR","AGI","WIS","LUK"].map((function(e,t){return(0,u.jsx)(s.Z,{className:"chip",size:"small",variant:"outlined",label:e,onClick:function(){i("Show All"===e?"":e)}},e+""+t)}))}),(0,u.jsx)("div",{className:"cards",children:(null===(e=Object.keys(l))||void 0===e?void 0:e.length)>0?Object.keys(l).map((function(e,t){var n=l[e];return n&&0!==(null===n||void 0===n?void 0:n.length)?(0,u.jsxs)(a.Fragment,{children:[(0,u.jsx)("img",{className:"card-banner",src:"".concat(o.O4,"banners/").concat(e,"_Cardbanner.png"),alt:""}),(0,u.jsx)("div",{children:n.map((function(e,t){var n=e.img,r=e.effect,i=e.base;return(0,u.jsxs)(a.Fragment,{children:[(0,u.jsx)(g,{header:n.replace(/_/g," ").replace(/Card.png/,"")+" - "+r,base:i,children:(0,u.jsx)("img",{className:"card",src:"".concat(o.O4,"cards/").concat(n),alt:r,height:72,width:52})}),7===t?(0,u.jsx)("br",{}):null]},r+""+t)}))})]},e+""+t):null})):(0,u.jsx)("div",{className:"not-found",children:"Please try another phrase"})})]})})]})}var N=(0,i.ZP)(c.Z).withConfig({displayName:"pages__StyledTextField",componentId:"sc-9v9q6u-0"})(["&& label.Mui-focused{color:rgba(255,255,255,0.7);}& .MuiInput-underline:after{border-bottom-color:green;}"]),_=(0,i.ZP)(l.Z).withConfig({displayName:"pages__StyledInputAdornment",componentId:"sc-9v9q6u-1"})(["cursor:pointer;"]),C=i.ZP.main.withConfig({displayName:"pages__Main",componentId:"sc-9v9q6u-2"})(["color:white;.chips{margin:20px 0;.chip{margin-right:10px;margin-top:8px;}}.cards{min-height:600px;.card{margin:5px 10px;@media only screen and (max-width:600px){margin:5px 5px;}}.card-banner{margin:10px;display:block;}.not-found{margin:20px;font-size:30px;}.image-wrapper{display:inline-block;}}h1{color:white;}"])},8581:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return n(4151)}])}},function(e){e.O(0,[172,278,774,888,179],(function(){return t=8581,e(e.s=t);var t}));var t=e.O();_N_E=t}]);