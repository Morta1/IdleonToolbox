(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6555],{52165:function(e,n,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/account/misc/quests",function(){return t(87626)}])},91921:function(e,n,t){"use strict";var l=t(82729),r=t(85893),i=t(30925),s=t(61599),a=t(15861),c=t(51233);function _templateObject(){let e=(0,l._)(["\n  width: 23px;\n  height: 27px;\n  object-fit: contain;\n"]);return _templateObject=function(){return e},e}let o=s.Z.img(_templateObject());n.Z=e=>{let{variant:n="vertical",centered:t=!0,style:l={},money:s,title:u="Total Money",maxCoins:d=5}=e;return(0,r.jsxs)("div",{style:l,children:[u?(0,r.jsx)(a.Z,{style:{textAlign:t?"center":"left"},children:u}):null,(0,r.jsx)(c.Z,{flexWrap:"wrap",justifyContent:t?"center":"flex-start",direction:"row",gap:"vertical"===n?2.3:1,children:null==s?void 0:s.map((e,t)=>{let[l,s]=e;return t<d&&Number(s)>=0?(0,r.jsxs)(c.Z,{direction:"vertical"===n?"column":"row",gap:"vertical"===n?0:.5,justifyContent:"center",alignItems:"center",children:[(0,r.jsx)(o,{src:"".concat(i.prefix,"data/Coins").concat(l,".png"),alt:""}),(0,r.jsx)(a.Z,{variant:"body1",component:"span",className:"coin-value",children:Number(s)})]},s+""+l):null})})]})}},87626:function(e,n,t){"use strict";t.r(n),t.d(n,{default:function(){return quests}});var l=t(85893),r=t(67294),i=t(16704),s=t(51233),a=t(33454),c=t(96420),o=t(82729),u=t(23508),d=t(8857),h=t(60888),p=t(27028),x=t(87357),m=t(38895),v=t(15861),j=t(49425),g=t(69661),f=t(67358),Z=t(22797),_=t(61599),b=t(36599),w=t(36270),y=t(54123),C=t(9601),O=t(17494),N=t(51221),W=t(72162),I=t(2511),q=t(91921),Q=t(30925);function _templateObject(){let e=(0,o._)(["\n  width: 40px;\n  height: 40px;\n"]);return _templateObject=function(){return e},e}function _templateObject1(){let e=(0,o._)(["\n  width: 12px;\n  height: 12px;\n  background-color: ",";\n  border-radius: 50%;\n  border: 1px solid white;\n"]);return _templateObject1=function(){return e},e}function _templateObject2(){let e=(0,o._)(['\n  & .MuiCollapse-root .MuiList-root:not(:last-child):after {\n    content: "";\n    position: absolute;\n    bottom: -30px;\n    left: 20px;\n    height: 100%;\n    width: 2px;\n    background-color: #e6d1d1;\n  }\n\n  .MuiAccordionSummary-content {\n    display: flex;\n    align-items: center;\n\n    .npc-name {\n      margin-left: 10px;\n    }\n\n    & > img {\n      object-fit: contain;\n    }\n  }\n']);return _templateObject2=function(){return e},e}function _templateObject3(){let e=(0,o._)(["\n  && {\n    display: flex;\n    flex-direction: column;\n    gap: 10px;\n  }\n\n  .quest-name-wrapper {\n    display: flex;\n    align-items: center;\n    gap: 10px;\n  }\n\n  .characters {\n    display: flex;\n    align-items: center;\n  }\n\n  .npc-quests-wrapper {\n    .quest-name {\n    }\n  }\n"]);return _templateObject3=function(){return e},e}function _templateObject4(){let e=(0,o._)(["\n  width: 100%;\n  height: 53px;\n  object-fit: cover;\n  object-position: -20px;\n"]);return _templateObject4=function(){return e},e}let getExpType=e=>{switch(e){case 0:return"Class";case 1:return"Mining";case 2:return"Smithing";case 3:return"Choppin";case 4:return"Fishing";case 5:return"Alchemy";case 6:return"Catching";case 7:return"Trapping";case 8:return"Construction";case 9:return"Worship";default:return""}},QuestTooltip=e=>{let{rewards:n,itemReq:t,customArray:r}=e;return(0,l.jsxs)(s.Z,{gap:2,children:[(null==r?void 0:r.length)>0?(0,l.jsxs)(s.Z,{children:[(0,l.jsx)(v.Z,{variant:"h6",fontWeight:"bold",children:"Requirements"}),(0,l.jsx)(s.Z,{children:null==r?void 0:r.map((e,n)=>{let{desc:t,value:r}=e;return(0,l.jsxs)("div",{children:[(0,Q.cleanUnderscore)(t)," ",r]},t+""+n)})})]}):null,(null==t?void 0:t.length)>0?(0,l.jsxs)(s.Z,{children:[(0,l.jsx)(v.Z,{variant:"h6",fontWeight:"bold",children:"Item Requirements"}),(0,l.jsx)(s.Z,{direction:"row",gap:2,children:null==t?void 0:t.map((e,n)=>{let{name:t,rawName:r,amount:i}=e;return(0,l.jsxs)(s.Z,{alignItems:"center",justifyContent:"center",children:[(0,l.jsx)(S,{className:"item-img",src:"".concat(Q.prefix,"data/").concat(r,".png"),alt:""}),(0,l.jsx)(v.Z,{className:"amount",children:(0,Q.numberWithCommas)(i)})]},t+""+n)})})]}):null,(null==n?void 0:n.length)>0?(0,l.jsxs)(s.Z,{children:[(0,l.jsx)(v.Z,{variant:"h6",fontWeight:"bold",children:"Rewards"}),(0,l.jsx)(s.Z,{direction:"row",alignItems:"center",gap:2,children:null==n?void 0:n.map((e,n)=>{let t,r,{name:i,rawName:a,amount:c}=e;return a.includes("Experience")?(t="XP",r=getExpType(parseInt(null==a?void 0:a.replace("Experience","")))):t=a.includes("Talent")?"TalentBook1":a.includes("Recipes")?"SmithingRecipes".concat(a[a.length-1]):a,(0,l.jsx)("div",{className:"item-wrapper",title:(0,Q.cleanUnderscore)(i),children:"COIN"!==a?(0,l.jsxs)(s.Z,{justifyContent:"center",alignItems:"center",children:[(0,l.jsx)(S,{title:(0,Q.cleanUnderscore)(i||a),src:"".concat(Q.prefix,"data/").concat(t,".png"),alt:""}),r?(0,l.jsxs)(v.Z,{variant:"caption",children:[r," exp"]}):null,(0,l.jsx)(v.Z,{className:"amount",children:(0,Q.numberWithCommas)(c)})]}):(0,l.jsx)("div",{className:"coins",children:(0,l.jsx)(q.Z,{title:"",noShadow:!0,money:(0,Q.getCoinsArray)(c)})})},i+""+n)})})]}):null]})},S=_.Z.img(_templateObject()),E=_.Z.div(_templateObject1(),e=>{let{color:n}=e;return n}),T=(0,_.Z)(f.Z)(_templateObject2()),k=(0,_.Z)(Z.Z)(_templateObject3()),M=_.Z.img(_templateObject4());var Misc_WorldQuest=e=>{let{quests:n,characters:t,totalCharacters:r,worldName:i}=e,getQuestIndicator=e=>{switch(e){case 1:return(0,l.jsx)(h.Z,{style:{marginLeft:"auto",fontSize:24,color:"#23bb23"}});case 0:return(0,l.jsx)(d.Z,{alt:"",style:{marginLeft:"auto",width:24,height:24,fill:"#ff8d00"}});case -1:return(0,l.jsx)(p.Z,{style:{marginLeft:"auto",color:"#868484"}});default:return null}};return(0,l.jsxs)(x.Z,{sx:{width:{xs:350,sm:400}},children:[(0,l.jsx)(M,{src:"".concat(Q.prefix,"npcs/").concat(i,".png"),onError:e=>{e.target.src="".concat(Q.prefix,"data/Wb5.png"),e.target.style.width="auto"},alt:""}),null==n?void 0:n[i].map((e,n)=>{var i,a,c,o,d;let h;if((null==e?void 0:e.name)==="Picnic_Stowaway"){let n=null==e?void 0:null===(a=e.npcQuests)||void 0===a?void 0:a.find(e=>{let{Name:n}=e;return"Live-Action_Entertainment"===n});h=(null==n?void 0:null===(c=n.completed)||void 0===c?void 0:c.length)===r?1:0}else if((null==e?void 0:e.name)==="Scripticus"){let n=null==e?void 0:null===(o=e.npcQuests)||void 0===o?void 0:o.find(e=>{let{Name:n}=e;return"Champion_of_the_Grasslands"===n});h=(null==n?void 0:null===(d=n.completed)||void 0===d?void 0:d.length)===r?1:0}return(0,l.jsxs)(T,{TransitionProps:{unmountOnExit:!0},children:[(0,l.jsxs)(m.Z,{expandIcon:(0,l.jsx)(u.Z,{}),children:[(0,l.jsx)("img",{width:50,height:50,src:"".concat(Q.prefix,"npcs/").concat(null==e?void 0:e.name,".gif"),alt:""}),(0,l.jsx)("span",{className:"npc-name",children:(0,Q.cleanUnderscore)(null==e?void 0:e.name)}),getQuestIndicator(h||(null==e?void 0:e.questsStatus))]}),(0,l.jsx)(k,{children:(0,l.jsx)(b.Z,{sx:{m:0,p:0},children:null==e?void 0:null===(i=e.npcQuests)||void 0===i?void 0:i.map((i,a)=>{var c;let{Name:o,completed:u=[],progress:d=[]}=i;return(0,l.jsxs)(w.Z,{children:[(0,l.jsx)(y.Z,{sx:{display:"none"}}),(0,l.jsxs)(C.Z,{children:[(0,l.jsx)(I.Z,{title:(0,l.jsx)(QuestTooltip,{...i,npcName:null==e?void 0:e.name}),children:(0,l.jsx)(O.Z,{sx:{width:15,height:15},color:(null==u?void 0:u.length)===r?"success":(null==u?void 0:u.length)===0&&0===d.length?"grey":"warning"})}),a<(null==e?void 0:null===(c=e.npcQuests)||void 0===c?void 0:c.length)-1?(0,l.jsx)(N.Z,{}):null]}),(0,l.jsxs)(W.Z,{children:[(0,l.jsx)(v.Z,{children:(0,Q.cleanUnderscore)(o)}),(null==d?void 0:d.length)>0?(0,l.jsx)(s.Z,{direction:"row",flexWrap:"wrap",gap:1,children:null==d?void 0:d.map(e=>{var n,r;let{charIndex:i,status:s}=e;return(0,l.jsx)(j.Z,{anchorOrigin:{vertical:"bottom",horizontal:"right"},badgeContent:(0,l.jsx)(E,{color:1===s?"#23bb23":-1===s?"#868484":"#ff8d00"}),children:(0,l.jsx)(I.Z,{title:"".concat(null==t?void 0:null===(n=t[i])||void 0===n?void 0:n.name," - ").concat(1===s?"Completed":-1===s?"Not yet unlocked":"In progress"),children:(0,l.jsx)(g.Z,{alt:"",src:"".concat(Q.prefix,"data/ClassIcons").concat(null===(r=t[i])||void 0===r?void 0:r.classIndex,".png")})})},i+""+a)})}):null]})]},(null==e?void 0:e.name)+""+n+a)})})})]},(null==e?void 0:e.name)+n)})]})},A=t(21480),P=t(2962),quests=()=>{var e;let{state:n}=(0,r.useContext)(A.I),[t,o]=(0,r.useState)(),[u,d]=(0,r.useState)([0]);(0,r.useEffect)(()=>{var e;if(!u)return;let t={};for(let[l,r]of Object.entries(null==n?void 0:null===(e=n.account)||void 0===e?void 0:e.quests))t[l]=r.map(e=>{let n,{npcQuests:t,...l}=e,r=JSON.parse(JSON.stringify(t)),i=0,s=0;for(let[e,n]of Object.entries(r)){let t=filterArrByCharacters(null==n?void 0:n.completed)||[],l=filterArrByCharacters(null==n?void 0:n.progress)||[];r[e]={...n,completed:t,progress:l},t.length===(null==u?void 0:u.length)?i++:t.length>0&&(i+=.5),l.some(e=>{let{charIndex:n,status:t}=e;return(null==u?void 0:u.indexOf(n))!==-1&&-1!==t})&&s++}return n=0===i?s>0?0:-1:i===(null==t?void 0:t.length)?1:0,{...l,npcQuests:r,questsStatus:n}});o(t)},[u,n]);let filterArrByCharacters=e=>null==e?void 0:e.filter(e=>{let{charIndex:n}=e;return(null==u?void 0:u.indexOf(n))!==-1});return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(P.PB,{title:"Quests | Idleon Toolbox",description:"Keep track of your characters' quests progression"}),u?(0,l.jsxs)(l.Fragment,{children:[(0,l.jsxs)(s.Z,{direction:"row",my:2,justifyContent:"center",flexWrap:"wrap",children:[(0,l.jsx)(a.Z,{size:"small",sx:{display:"flex",flexWrap:"wrap"},value:u,onChange:(e,n)=>{n.length&&d(n)},children:null==n?void 0:null===(e=n.characters)||void 0===e?void 0:e.map((e,n)=>(0,l.jsx)(c.Z,{title:null==e?void 0:e.name,value:n,children:(0,l.jsx)("img",{src:"".concat(Q.prefix,"data/ClassIcons").concat(null==e?void 0:e.classIndex,".png"),alt:""})},(null==e?void 0:e.name)+""+n))}),(0,l.jsx)(a.Z,{sx:{display:"flex",flexWrap:"wrap"},size:"small",children:(0,l.jsx)(c.Z,{onClick:()=>{var e,t;let l=(null==u?void 0:u.length)===(null==n?void 0:null===(e=n.characters)||void 0===e?void 0:e.length),r=Array.from(Array(l?1:null==n?void 0:null===(t=n.characters)||void 0===t?void 0:t.length).keys());d(r)},title:"Select all",value:"all",children:(0,l.jsx)(i.Z,{})})})]}),(0,l.jsxs)(s.Z,{direction:"row",justifyContent:"center",flexWrap:"wrap",gap:4,children:[(0,l.jsx)(Misc_WorldQuest,{quests:t,totalCharacters:null==u?void 0:u.length,characters:null==n?void 0:n.characters,worldName:"Blunder_Hills"}),(0,l.jsx)(Misc_WorldQuest,{quests:t,totalCharacters:null==u?void 0:u.length,characters:null==n?void 0:n.characters,worldName:"Yum-Yum_Desert"}),(0,l.jsx)(Misc_WorldQuest,{quests:t,totalCharacters:null==u?void 0:u.length,characters:null==n?void 0:n.characters,worldName:"Frostbite_Tundra"}),(0,l.jsx)(Misc_WorldQuest,{quests:t,totalCharacters:null==u?void 0:u.length,characters:null==n?void 0:n.characters,worldName:"Hyperion_Nebula"}),(0,l.jsx)(Misc_WorldQuest,{quests:t,totalCharacters:null==u?void 0:u.length,characters:null==n?void 0:n.characters,worldName:"Smolderin'_Plateau"})]})]}):null]})}}},function(e){e.O(0,[294,9774,2888,179],function(){return e(e.s=52165)}),_N_E=e.O()}]);