(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[901],{69822:function(l,n,i){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/world-2/bubbles",function(){return i(82004)}])},82004:function(l,n,i){"use strict";i.r(n);var e=i(82729),t=i(85893),o=i(98396),d=i(15861),a=i(67720),u=i(51233),c=i(50480),r=i(69368),s=i(61903),v=i(87109),h=i(66242),x=i(44267),b=i(11703),m=i(40044),p=i(21023),g=i(67294),j=i(41422),f=i(61599),Z=i(39574),y=i(51053),w=i(91296),C=i.n(w),_=i(64529),I=i(2962),B=i(29222),M=i(87357);function k(){let l=(0,e._)(["\n  width: 32px;\n  height: 32px;\n  object-fit: contain;\n"]);return k=function(){return l},l}function N(){let l=(0,e._)(["\n  width: 32px;\n  height: 32px;\n"]);return N=function(){return l},l}function S(){let l=(0,e._)(["\n  opacity: ",";\n"]);return S=function(){return l},l}let O=l=>{let{title:n,bubbles:i,lithium:e,accumulatedCost:o,account:a}=l;return(0,t.jsxs)(u.Z,{justifyContent:"center",alignItems:"center",children:[(0,t.jsx)(d.Z,{children:n}),e?(0,t.jsx)(d.Z,{variant:"caption",children:"* 15% chance to be upgraded by lithium (atom collider)"}):null,(0,t.jsx)(u.Z,{direction:"row",flexWrap:"wrap",gap:1,children:null==i?void 0:i.map((l,n)=>{var i,c,r,s,v,h,x,b,m;let{rawName:g,bubbleName:j,level:f,itemReq:w,index:C,cauldron:_}=l,{singleLevelCost:I,total:M}=o(C,f,null==w?void 0:null===(i=w[0])||void 0===i?void 0:i.baseCost,null==w?void 0:null===(c=w[0])||void 0===c?void 0:null===(r=c.name)||void 0===r?void 0:r.includes("Liquid"),_),k=I>1e8&&!(null==w?void 0:null===(s=w[0])||void 0===s?void 0:null===(v=s.name)||void 0===v?void 0:v.includes("Liquid"))&&!(null==w?void 0:null===(h=w[0])||void 0===h?void 0:null===(x=h.name)||void 0===x?void 0:x.includes("Bits"))&&(0,B.a2)(C,I);return(0,t.jsxs)(u.Z,{alignItems:"center",children:[(0,t.jsx)(y.Z,{title:(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(d.Z,{sx:{fontWeight:"bold"},children:(0,Z.pascalCase)((0,Z.cleanUnderscore)(j))}),(0,t.jsx)(u.Z,{direction:"row",justifyContent:"center",gap:1,children:null==w?void 0:w.map(l=>{let{rawName:n}=l;if("Blank"===n||"ERROR"===n||n.includes("Liquid"))return null;let i=["sail","bits"].find(l=>n.toLowerCase().includes(l))?"".concat(n,"_x1"):n;return(0,t.jsxs)(u.Z,{alignItems:"center",direction:"row",gap:1,children:[(0,t.jsxs)(u.Z,{alignItems:"center",justifyContent:"space-between",children:[(0,t.jsx)(E,{src:"".concat(Z.prefix,"data/").concat(i,".png"),alt:""}),(0,t.jsx)(d.Z,{children:(0,Z.notateNumber)(M,"Big")})]}),k>0?(0,t.jsxs)(u.Z,{alignItems:"center",justifyContent:"space-between",children:[(0,t.jsx)(u.Z,{sx:{width:32,height:32},alignItems:"center",justifyContent:"center",children:(0,t.jsx)("img",{width:18,height:18,src:"".concat(Z.prefix,"etc/Particle.png"),alt:""})}),(0,t.jsx)(d.Z,{children:k})]}):null]})})})]}),children:(0,t.jsx)("img",{style:{opacity:e?.8:1},width:42,height:42,src:"".concat(Z.prefix,"data/").concat(g,".png"),alt:""})}),(0,t.jsxs)(u.Z,{direction:"row",alignItems:"center",gap:.5,children:[k>0?(0,t.jsx)(p.Z,{title:(0,t.jsxs)(d.Z,{color:(null==a?void 0:null===(b=a.atoms)||void 0===b?void 0:b.particles)>k?"success.light":"",children:[Math.floor(null==a?void 0:null===(m=a.atoms)||void 0===m?void 0:m.particles)," / ",k]}),children:(0,t.jsx)("img",{width:18,height:18,src:"".concat(Z.prefix,"etc/Particle.png"),alt:""})}):null,(0,t.jsx)(d.Z,{variant:"body1",children:f})]})]},"".concat(g,"-").concat(n))})})]})},P=f.Z.img(k()),E=f.Z.img(N()),L=f.Z.img(S(),l=>{let{level:n}=l;return 0===n?.5:1}),q=l=>{let{goalLevel:n,bubbleName:i,desc:e,func:o,x1:a,x2:u,level:c}=l,r=(0,Z.growth)(o,c,a,u,!0),s=(0,Z.growth)(o,n,a,u,!0);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(d.Z,{fontWeight:"bold",variant:"h6",children:(0,Z.cleanUnderscore)(i)}),(0,t.jsx)(d.Z,{variant:"body1",children:(0,Z.cleanUnderscore)(e.replace(/{/,r))}),c!==n?(0,t.jsxs)(d.Z,{sx:{color:c>0?"multi":""},variant:"body1",children:["Goal: +",s]}):null]})};n.default=()=>{var l,n,i,e,f,w,k,N,S;let{state:R}=(0,g.useContext)(j.I),W=(0,o.Z)(l=>l.breakpoints.down("md"),{noSsr:!0}),[A,F]=(0,g.useState)(!1),[T,z]=(0,g.useState)(0),[U,D]=(0,g.useState)(0),[G,V]=(0,g.useState)(),[X,K]=(0,g.useState)(),Y=(0,g.useMemo)(()=>{var l,n,i,e;return null===(l=null==R?void 0:null===(n=R.account)||void 0===n?void 0:null===(i=n.lab)||void 0===i?void 0:null===(e=i.labBonuses)||void 0===e?void 0:e.find(l=>"My_1st_Chemistry_Set"===l.name))||void 0===l?void 0:l.active},[null==R?void 0:null===(l=R.account)||void 0===l?void 0:l.lab.vials]);(0,g.useEffect)(()=>{var l,n,i,e,t,o;let d=null===(l=Object.keys(null==R?void 0:null===(n=R.account)||void 0===n?void 0:null===(i=n.alchemy)||void 0===i?void 0:i.bubbles))||void 0===l?void 0:l[U];V(null==R?void 0:null===(e=R.account)||void 0===e?void 0:null===(t=e.alchemy)||void 0===t?void 0:null===(o=t.bubbles)||void 0===o?void 0:o[d])},[]);let H=l=>{var n;z(null==l?void 0:null===(n=l.target)||void 0===n?void 0:n.value)},J=C()((l,n,i)=>{let{value:e}=l.target;K({...X,[n]:{...(null==X?void 0:X[n])||{},[i]:e?parseInt(e):0}})},100),Q=function(l){arguments.length>1&&void 0!==arguments[1]&&arguments[1];let n=arguments.length>2?arguments[2]:void 0,i=arguments.length>3?arguments[3]:void 0,e=arguments.length>4?arguments[4]:void 0,t=arguments.length>5?arguments[5]:void 0,o=(arguments.length>6&&arguments[6],arguments.length>7&&arguments[7],arguments.length>8?arguments[8]:void 0),d=arguments.length>9?arguments[9]:void 0,a=arguments.length>10?arguments[10]:void 0,u=arguments.length>11?arguments[11]:void 0,c=arguments.length>12?arguments[12]:void 0;if(e)return i+Math.floor(n/20);{var r,s,v,h;let e=Math.max(.1,1-Math.round(10*(0,Z.growth)("decay",t,90,100,!1))/10/100),x=(0,B.iu)(null==R?void 0:null===(r=R.account)||void 0===r?void 0:null===(s=r.alchemy)||void 0===s?void 0:s.vials,"AlchBubbleCost"),b=(0,B.om)(null==R?void 0:null===(v=R.account)||void 0===v?void 0:null===(h=v.alchemy)||void 0===h?void 0:h.bubbles,"kazam","UNDEVELOPED_COSTS",!1),m=Math.max(.05,1-(0,Z.growth)("decay",o,40,12,!1)/100*(0,Z.growth)("decayMulti",d,2,50,!1)*(0,Z.growth)("decayMulti",c,1.4,30,!1));return Math.min((l<15?i*Math.pow(1.35-.3*n/(50+n),n):i*Math.pow(1.37-.28*n/(60+n),n))*m*e*Math.max(.05,1-(x+b)/100)*Math.max(.1,Math.pow(.75,a))*Math.max(.9,1-.1*u),1e9)}},$=(l,n,i,e,t)=>{var o,d,a,u,c,r,s,v,h,x,b,m,p,g,j,f,Z,y,w,C,_,I,B,M,k,N,S,O,P,E,L;let q=(null==R?void 0:null===(o=R.account)||void 0===o?void 0:null===(d=o.alchemy)||void 0===d?void 0:null===(a=d.cauldrons)||void 0===a?void 0:null===(u=a[e])||void 0===u?void 0:null===(c=u.boosts)||void 0===c?void 0:null===(r=c.cost)||void 0===r?void 0:r.level)||0,W=(null==R?void 0:null===(s=R.account)||void 0===s?void 0:null===(v=s.alchemy)||void 0===v?void 0:null===(h=v.bubbles)||void 0===h?void 0:null===(x=h.kazam)||void 0===x?void 0:x[6].level)||0,F=(null==R?void 0:null===(b=R.account)||void 0===b?void 0:null===(m=b.alchemy)||void 0===m?void 0:null===(p=m.vials)||void 0===p?void 0:null===(g=p[9])||void 0===g?void 0:g.level)||0,z="kazam"!==e&&(null==R?void 0:null===(j=R.account)||void 0===j?void 0:null===(f=j.alchemy)||void 0===f?void 0:null===(Z=f.bubbles)||void 0===Z?void 0:null===(y=Z[e])||void 0===y?void 0:null===(w=y[16])||void 0===w?void 0:w.level)||0,U=(null==R?void 0:null===(C=R.account)||void 0===C?void 0:null===(_=C.alchemy)||void 0===_?void 0:null===(I=_.bubbles)||void 0===I?void 0:null===(B=I[e])||void 0===B?void 0:null===(M=B[14])||void 0===M?void 0:M.level)||0,D=A&&"kazam"!==e&&(null==R?void 0:null===(k=R.account)||void 0===k?void 0:null===(N=k.alchemy)||void 0===N?void 0:null===(S=N.bubbles)||void 0===S?void 0:null===(O=S[e])||void 0===O?void 0:null===(P=O[1])||void 0===P?void 0:P.level)||0,G=T||0,V=null===(E=null==R?void 0:null===(L=R.account)||void 0===L?void 0:L.achievements[108])||void 0===E?void 0:E.completed;return Q(t,Y?2:1,l,n,i,q,W,F,U,D,G,V,z)},ll=(l,n,i,e,t)=>{var o,d;let a=(null!==(d=null==X?void 0:null===(o=X[t])||void 0===o?void 0:o[l])&&void 0!==d?d:0)-n;if(a<=0){let o=$(n,i,e,t,l);return{singleLevelCost:o,total:o}}let u=Array(a||0).fill(1),c=0,r=u.reduce((o,d,a)=>{let u=$(n+(0===a?1:a),i,e,t,l);return e||(c=u),o+u},$(n,i,e,t,l));return{total:r,singleLevelCost:c}},ln=(0,g.useCallback)((l,n,i,e,t)=>ll(l,n,i,e,t),[X,T,A]),li=l=>{var n,i,e,t,o,d,a,u,c,r,s;let v=3,h=null===(n=null==l?void 0:null===(i=l.lab)||void 0===i?void 0:null===(e=i.labBonuses)||void 0===e?void 0:e.find(l=>"No_Bubble_Left_Behind"===l.name))||void 0===n?void 0:n.active;if(!h)return null;let x=Object.values(null==l?void 0:null===(t=l.alchemy)||void 0===t?void 0:t.bubbles).flatMap((l,n)=>l.map((l,i)=>({...l,tab:n,flatIndex:1e3*n+i}))),b=x.sort((l,n)=>n.flatIndex-l.flatIndex).filter(l=>{let{level:n,index:i}=l;return n>=5}).sort((l,n)=>l.level-n.level),m=x.filter(l=>{let{level:n,index:i}=l;return n>=5&&i<15}),p=m.sort((l,n)=>n.flatIndex-l.flatIndex).sort((l,n)=>l.level-n.level);(null===(o=null==l?void 0:null===(d=l.lab)||void 0===d?void 0:null===(a=d.jewels)||void 0===a?void 0:a.find(l=>"Pyrite_Rhinestone"===l.name))||void 0===o?void 0:o.active)&&v++;let g=(0,_.YS)(null==l?void 0:null===(u=l.sailing)||void 0===u?void 0:u.artifacts,"Amberite");g&&(v+=(null==g?void 0:g.acquired)===3?(null==g?void 0:g.baseBonus)*3:(null==g?void 0:g.acquired)===2?(null==g?void 0:g.baseBonus)*2:null==g?void 0:g.baseBonus);let j=null==l?void 0:null===(c=l.tasks)||void 0===c?void 0:null===(r=c[2])||void 0===r?void 0:null===(s=r[3])||void 0===s?void 0:s[6];j>0&&(v+=j);let f=p.slice(0,v),Z=b.slice(0,v);return{normal:f,atomBubbles:Z}},le=(0,g.useMemo)(()=>li(null==R?void 0:R.account),[null==R?void 0:R.account]),lt=(l,n)=>{if(!(null==l?void 0:l.includes("decay")))return null;let i=n;return"decayMulti"===l&&(i+=1),i};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(I.PB,{title:"Idleon Toolbox | Bubbles",description:"Keep track of your bubbles level and requirements with a handy calculator"}),(0,t.jsx)(d.Z,{variant:"h2",textAlign:"center",mb:3,children:"Bubbles"}),(0,t.jsxs)(M.Z,{sx:{width:"fit-content",margin:"24px auto"},children:[(0,t.jsx)(O,{title:"Next bubble upgrades",bubbles:null==le?void 0:le.normal,accumulatedCost:ln,account:null==R?void 0:R.account}),(0,t.jsx)(a.Z,{sx:{my:2}}),(0,t.jsx)(O,{lithium:!0,bubbles:null==le?void 0:le.atomBubbles,accumulatedCost:ln,account:null==R?void 0:R.account})]}),(0,t.jsxs)(u.Z,{direction:"row",justifyContent:"center",mt:2,gap:2,flexWrap:"wrap",children:[(null===(n=Object.keys(null==R?void 0:null===(i=R.account)||void 0===i?void 0:null===(e=i.alchemy)||void 0===e?void 0:e.bubbles))||void 0===n?void 0:n[U])!=="kazam"?(0,t.jsx)(c.Z,{control:(0,t.jsx)(r.Z,{checked:A,onChange:()=>F(!A)}),name:"classDiscount",label:"Class Discount"}):null,(0,t.jsx)(s.Z,{value:T,type:"number",inputProps:{min:0,max:8},onChange:l=>H(l),helperText:"".concat(parseFloat((-(25*(Math.pow(.75,T)-1)/.25)).toFixed(1)),"%"),InputProps:{startAdornment:(0,t.jsx)(v.Z,{position:"start",children:(0,t.jsx)("img",{width:36,height:36,src:"".concat(Z.prefix,"data/aShopItems10.png"),alt:""})})}}),(0,t.jsx)(h.Z,{sx:{alignItems:"center",display:"flex"},children:(0,t.jsx)(x.Z,{sx:{"&:last-child":{px:1,py:{xs:1,sm:0}},width:200},children:(0,t.jsxs)(u.Z,{direction:"row",alignItems:"center",justifyContent:"center",gap:1,children:[(0,t.jsx)(E,{src:"".concat(Z.prefix,"etc/Particle.png"),alt:""}),(0,t.jsxs)(d.Z,{children:["Alternate particle upgrades left: ",null==R?void 0:null===(f=R.account)||void 0===f?void 0:null===(w=f.accountOptions)||void 0===w?void 0:w[135]]})]})})})]}),(0,t.jsx)(b.Z,{centered:!0,sx:{marginBottom:3,marginTop:1},variant:W?"fullWidth":"standard",value:U,onChange:(l,n)=>{var i,e,t,o,d,a;D(n);let u=null===(i=Object.keys(null==R?void 0:null===(e=R.account)||void 0===e?void 0:null===(t=e.alchemy)||void 0===t?void 0:t.bubbles))||void 0===i?void 0:i[n];V(null==R?void 0:null===(o=R.account)||void 0===o?void 0:null===(d=o.alchemy)||void 0===d?void 0:null===(a=d.bubbles)||void 0===a?void 0:a[u]),3===n&&F(!1)},children:null===(k=Object.keys(null==R?void 0:null===(N=R.account)||void 0===N?void 0:null===(S=N.alchemy)||void 0===S?void 0:S.bubbles))||void 0===k?void 0:k.map((l,n)=>(0,t.jsx)(m.Z,{label:l},"".concat(l,"-").concat(n)))}),(0,t.jsx)(u.Z,{direction:"row",flexWrap:"wrap",gap:3,justifyContent:"center",children:null==G?void 0:G.map((l,n)=>{var i,e,o;if(n>24)return null;let{level:a,itemReq:c,rawName:r,bubbleName:v,func:b,x1:m,x2:j,cauldron:f}=l,w=(null==X?void 0:null===(i=X[f])||void 0===i?void 0:i[n])?(null==X?void 0:null===(e=X[f])||void 0===e?void 0:e[n])<a?a:null==X?void 0:null===(o=X[f])||void 0===o?void 0:o[n]:a,C=(0,Z.growth)(b,w,m,j,!0),_=lt(b,m),I=w/(w+j)*100;return(0,t.jsx)(g.Fragment,{children:(0,t.jsx)(h.Z,{sx:{width:330},children:(0,t.jsxs)(x.Z,{children:[(0,t.jsxs)(u.Z,{direction:"row",alignItems:"center",justifyContent:"space-around",gap:2,children:[(0,t.jsxs)(u.Z,{alignItems:"center",children:[(0,t.jsx)(y.Z,{title:(0,t.jsx)(q,{...l,goalLevel:w}),children:(0,t.jsx)(L,{width:48,height:48,level:a,src:"".concat(Z.prefix,"data/").concat(r,".png"),alt:""})}),(0,t.jsxs)(d.Z,{variant:"body1",children:["Lv. ",a]})]}),(0,t.jsx)(s.Z,{type:"number",sx:{width:90},defaultValue:w,onChange:l=>J(l,f,n),label:"Goal",variant:"outlined",inputProps:{min:a||0}})]}),(0,t.jsxs)(u.Z,{mt:1.5,direction:"row",justifyContent:"center",gap:3,flexWrap:"wrap",children:[(0,t.jsxs)(u.Z,{gap:2,justifyContent:"center",alignItems:"center",children:[(0,t.jsx)(y.Z,{title:"Bubble's effect",children:(0,t.jsx)(P,{src:"".concat(Z.prefix,"data/SignStar3b.png"),alt:""})}),(0,t.jsx)(y.Z,{title:_?"".concat(C," is ").concat((0,Z.notateNumber)(I),"% of possible hard cap effect of ").concat(_):"",children:(0,t.jsxs)(d.Z,{children:[C," ",_?"(".concat((0,Z.notateNumber)(I),"%)"):""]})})]}),null==c?void 0:c.map((l,i)=>{var e,o,c,r;let{rawName:s,name:v,baseCost:h}=l;if("Blank"===s||"ERROR"===s)return null;let{singleLevelCost:x,total:b}=ln(n,a,h,null==v?void 0:v.includes("Liquid"),f),m=["sail","bits"].find(l=>s.toLowerCase().includes(l))?"".concat(s,"_x1"):s,g=x>1e8&&!(null==v?void 0:v.includes("Liquid"))&&!(null==v?void 0:v.includes("Bits"))&&(0,B.a2)(n,x);return(0,t.jsxs)(u.Z,{direction:"row",gap:3,children:[g?(0,t.jsxs)(u.Z,{gap:2,alignItems:"center",children:[(0,t.jsx)(p.Z,{title:(0,t.jsxs)(d.Z,{color:(null==R?void 0:null===(e=R.account)||void 0===e?void 0:null===(o=e.atoms)||void 0===o?void 0:o.particles)>g?"success.light":"",children:[Math.floor(null==R?void 0:null===(c=R.account)||void 0===c?void 0:null===(r=c.atoms)||void 0===r?void 0:r.particles)," / ",g]}),children:(0,t.jsx)(E,{src:"".concat(Z.prefix,"etc/Particle.png"),alt:""})}),(0,t.jsx)(y.Z,{title:g,children:(0,t.jsx)(d.Z,{children:(0,Z.notateNumber)(g,"Big")})})]}):null,(0,t.jsxs)(u.Z,{gap:2,justifyContent:"center",alignItems:"center",children:[(0,t.jsx)(y.Z,{title:(0,Z.cleanUnderscore)(v),children:(0,t.jsx)(E,{src:"".concat(Z.prefix,"data/").concat(m,".png"),alt:""})}),(0,t.jsx)(y.Z,{title:b,children:(0,t.jsx)(d.Z,{children:(0,Z.notateNumber)(b,"Big")})})]})]},"".concat(s,"-").concat(v,"-").concat(i))})]})]})})},r+""+v+n)})})]})}}},function(l){l.O(0,[3749,9774,2888,179],function(){return l(l.s=69822)}),_N_E=l.O()}]);