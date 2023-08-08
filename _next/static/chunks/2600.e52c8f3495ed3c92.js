"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2600],{26873:function(e,l,o){o.d(l,{MH:function(){return s},WA:function(){return n},jS:function(){return a}});var t=o(72032),i=o(65492);let n=(e,l)=>{let o=null==e?void 0:e.reduce((e,l)=>{let{kills:o}=l;return(null==e?void 0:e.length)===0?o:null==o?void 0:o.map((l,o)=>l+e[o])},[]);return t.deathNote.reduce((e,i)=>{var n,s,r;let{rawName:u,world:d}=i,c=null===t.mapEnemies||void 0===t.mapEnemies?void 0:t.mapEnemies[u],_=null==o?void 0:o[c],v=a(l,_);return{...e,[d]:{...(null==e?void 0:e[d])||{},rank:((null==e?void 0:null===(n=e[d])||void 0===n?void 0:n.rank)||0)+v,mobs:[...(null==e?void 0:null===(s=e[d])||void 0===s?void 0:s.mobs)||[],{rawName:u,displayName:null===t.monsters||void 0===t.monsters?void 0:null===(r=t.monsters[u])||void 0===r?void 0:r.Name,kills:_}]}}},{})},a=(e,l)=>25e3>l?0:1e5>l?1:25e4>l?2:5e5>l?3:1e6>l?4:5e6>l?5:1e8>l?7:1e9<l&&(0,i.R)(null==e?void 0:e.rift,"Eclipse_Skulls")?20:10,s=e=>{var l;let o=(0,i.R)(null==e?void 0:e.rift,"Eclipse_Skulls");return o?null===(l=Object.entries((null==e?void 0:e.deathNote)||{}))||void 0===l?void 0:l.reduce((e,l)=>{let[o,{mobs:t}]=l,i=null==t?void 0:t.reduce((e,l)=>{let{kills:o}=l;return e+(o>=1e9?1:0)},0);return e+i},0):0}},12600:function(e,l,o){o.r(l),o.d(l,{parseData:function(){return el}});var t=o(70708),i=o(60510),n=o(96916),a=o(47780),s=o(3478),r=o(62866);let u={1:!0,2:!0,3:!0,4:!0},d={0:"chopping",1:"fishing",2:"catching",3:"mining"},c=e=>{var l,o;let t=(null==e?void 0:null===(l=e.FamilyValuesMap)||void 0===l?void 0:l.ColosseumHighscores)||(null==e?void 0:e.FamValColosseumHighscores),i=(null==e?void 0:null===(o=e.FamilyValuesMap)||void 0===o?void 0:o.MinigameHiscores)||(null==e?void 0:e.FamValMinigameHiscores);return{coloHighscores:_(t),minigameHighscores:v(i)}},_=e=>e.filter((e,l)=>u[l]).map(e=>parseFloat(e)),v=e=>e.filter((e,l)=>d[l]).map((e,l)=>({minigame:d[l],score:e}));var m=o(39574);let h=e=>{let l=(0,m.tryToParse)(null==e?void 0:e.GemItemsPurchased)||(null==e?void 0:e.GemItemsPurchased);return p(l)},p=e=>e;var f=o(85417),g=o(29222),y=o(52762),b=o(53555),k=o(14573),S=o(47450),w=o(72032);let C=(e,l)=>{let o=null==e?void 0:e.ForgeItemOrder,t=(null==e?void 0:e.ForgeItemQuantity)||(null==e?void 0:e.ForgeItemQty),i=(null==e?void 0:e.FurnaceLevels)||(null==e?void 0:e.ForgeLV);return M(o,t,i,l)},T=[{name:"New Forge Slot",maxLevel:16,description:"extra slots to smelt ores",costMulti:void 0},{name:"Ore Capacity Boost",maxLevel:50,description:"Increases max ores per slot",costMulti:1.41},{name:"Forge Speed",maxLevel:90,description:"Ores are turned into bars faster",costMulti:1.2},{name:"Forge EXP Gain",maxLevel:85,description:"Increased EXP gain from using the forge",costMulti:1.21},{name:"Bar Bonanza",maxLevel:75,description:"Increased chance to make an extra bar",costMulti:1.25},{name:"Puff Puff Go",maxLevel:60,description:"Increased chance for a card drop while afk",costMulti:1.33}],M=(e,l,o,t)=>{var i,n;let a=null==T?void 0:T.map((e,l)=>({...e,level:o[l]})),s=null!==(n=null==t?void 0:null===(i=t.gemShopPurchases)||void 0===i?void 0:i.find((e,l)=>104===l))&&void 0!==n?n:0,r=[],u=0;for(let o=0;o<(null==e?void 0:e.length);o+=3){let[t,i,n]=null==e?void 0:e.slice(o,o+3),[a,d,c]=l.slice(o,o+3);r=[...r,{isBrimestone:u<s,ore:{...null===w.items||void 0===w.items?void 0:w.items[t],rawName:t,quantity:a},barrel:{...null===w.items||void 0===w.items?void 0:w.items[i],rawName:i,quantity:d},bar:{...null===w.items||void 0===w.items?void 0:w.items[n],rawName:n,quantity:c}}],u++}return{list:r,upgrades:a}};var P=o(57277),O=o(66148),G=o(9336);let B=e=>{let l=(null==e?void 0:e.Tasks)||[(0,m.tryToParse)(null==e?void 0:e.TaskZZ0),(0,m.tryToParse)(null==e?void 0:e.TaskZZ1),(0,m.tryToParse)(null==e?void 0:e.TaskZZ2),(0,m.tryToParse)(null==e?void 0:e.TaskZZ3),(0,m.tryToParse)(null==e?void 0:e.TaskZZ4),(0,m.tryToParse)(null==e?void 0:e.TaskZZ5)];return A(l)},A=e=>e;var D=o(8974),N=o(91909),E=o(72094),F=o(20566),I=o(21994),L=o(9798),x=o(30210),U=o(24051),R=o(2183),Z=o(55179),W=o(26873),q=o(58696),j=o(44891),H=o(64529),K=o(30058),V=o(47315),z=o(65492),X=o(37836);let Q=["Get_as_much_total_stats_as_possible,_STR_AGI_WIS_and_LUK_combined.","Get_as_much_STR_stat_as_you_can.","Get_as_much_AGI_stat_as_you_can.","Get_as_much_WIS_stat_as_you_can.","Get_as_much_LUK_stat_as_you_can.","Get_the_highest_DPS_(number_of_digits)_you_can;_but_on_a_beginner","Get_the_highest_DPS_(number_of_digits)_you_can;_but_on_a_warrior.","Get_the_highest_DPS_(number_of_digits)_you_can;_but_on_a_archer.","Get_the_highest_DPS_(number_of_digits)_you_can;_but_on_a_mage.","Get_the_highest_Accuracy_stat_you_can.","Get_the_highest_Defence_stat._Tank_mains;_it's_your_moment!","Get_the_highest_Movement_Speed_you_can.","Get_the_highest_Critical_Chance_%_you_can.","Spawn_as_many_Giant_Mobs_this_week_as_you_can.","Get_the_highest_Max_HP_as_possible.","Get_the_highest_Max_MP_as_possible.","Get_as_many_individual_hits_on_the_DPS_Dummy_as_you_can_within_the_timer.","Get_as_much_Mining_Efficiency_(number_of_digits)_as_you_can.","Get_as_much_Choppin_Efficiency_(number_of_digits)_as_you_can.","Get_as_much_Fishing_Efficiency_(number_of_digits)_as_you_can.","Get_as_much_Catching_Efficiency_(number_of_digits)_as_you_can."],Y=[{effect:"+{,Base_STR",divider:12},{effect:"+{,Base_AGI",divider:12},{effect:"+{,Base_WIS",divider:12},{effect:"+{,Base_LUK",divider:10},{effect:"+{%,Total_DMG",divider:3},{effect:"+{%,Class_EXP",divider:4},{effect:"+{%,Skill_Eff",divider:5}],J=[{effect:"1_in_100000_chance_for_Trophy_per_hr_of_Nothing_AFK",cost:24},{effect:"1.25x_Dungeon_Credits_and_Flurbos_gained",cost:200},{effect:"-30%_Kitchen_Upgrade_Costs",cost:750},{effect:"1.20x_Chance_to_find_Sailing_Artifacts",cost:2500},{effect:"Dirty_Shovel_digs_up_+25%_more_Gold_Nuggets",cost:1e4},{effect:"+100_Star_Talent_Pts",cost:2e4},{effect:"World_6_Bonus..._I_wonder_what_it_will_be...",cost:4e4},{effect:"World_7_Bonus..._I_wonder_what_it_will_be...",cost:6e4}],$=e=>{var l,o,t,i,n,a,s,r,u,d;let c=null==e?void 0:null===(l=e.accountOptions)||void 0===l?void 0:null===(o=l[169])||void 0===o?void 0:o.split(""),_=null==e?void 0:null===(t=e.accountOptions)||void 0===t?void 0:null===(i=t[169])||void 0===i?void 0:i.length,v={0:0,1:8,2:32,3:80,4:200,5:500},h={0:0,1:15,2:45,3:100,4:200,5:500},p=[{name:"Trash",description:"Trade_garbage_that_washs_up_each_day_for_items",preUnlockCost:4,baseCost:10},{name:"Rando",description:"Guaranteed_Random_Event_once_a_week",preUnlockCost:12,baseCost:12},{name:"Crystal",description:"Fight_daily_giant_crystal_mobs_that_drop_candy",preUnlockCost:20,baseCost:15},{name:"Seasalt",description:"Catch_legendary_fish_for_crafting_World_6_equips",preUnlockCost:28,baseCost:50},{name:"Shimmer",description:"Do_Weekly_Challenges_for_Shimmer_Upgrades",preUnlockCost:40,baseCost:25},{name:"Fractal",description:"Dump_your_time_candy_here_for..._nothing...?",preUnlockCost:52,baseCost:70}].map((l,o)=>({...l,unlocked:(null==c?void 0:c.indexOf(null===m.number2letter||void 0===m.number2letter?void 0:m.number2letter[o]))!==-1,cost:0===_?l.preUnlockCost+(null==v?void 0:v[_]):l.baseCost+(null==h?void 0:h[_]),...ee(e,o)})),f=null==e?void 0:null===(n=e.accountOptions)||void 0===n?void 0:n[162],g=(0,b.k)(null==e?void 0:e.bribes,"Bottle_Service"),y=(0,N.U7)(null==e?void 0:e.bundles,"bun_p")?30:0,k=null===(a=null==e?void 0:null===(s=e.quests)||void 0===s?void 0:null===(r=s["Yum-Yum_Desert"])||void 0===r?void 0:r.find(e=>{let{name:l}=e;return"Omar_Da_Ogar"===l}))||void 0===a?void 0:null===(u=a.npcQuests)||void 0===u?void 0:u.reduce((e,l)=>{let{completed:o}=l;return e+((null==o?void 0:o.length)>0?1:0)},0),S=null==e?void 0:null===(d=e.accountOptions)||void 0===d?void 0:d[164];return{islandsUnlocked:_,bottles:f,bottlesPerDay:Math.floor(4*(1+(g+(10*S+10*k+y))/100)),list:p}},ee=(e,l)=>{var o,t,i,n,a,s,r,u,d,c,_;let v={};if(0===l){let l=null==e?void 0:null===(o=e.accountOptions)||void 0===o?void 0:o[161],n=["data/StampB47","data/StampB32","data/StampA38","data/StampA39","etc/Trash_Currency","etc/Bribe","data/Island1","data/TalentBook1","data/EquipmentNametag6b"],a=[20,40,80,300,7*Math.pow(1.4,null==e?void 0:null===(t=e.accountOptions)||void 0===t?void 0:t[163]),135,25*Math.pow(1.5,null==e?void 0:null===(i=e.accountOptions)||void 0===i?void 0:i[164]),450,1500].map((l,o)=>{var t,i;let a=4===o?null==e?void 0:null===(t=e.accountOptions)||void 0===t?void 0:t[163]:6===o?null==e?void 0:null===(i=e.accountOptions)||void 0===i?void 0:i[164]:null;return{cost:Math.round(l),effect:null==n?void 0:n[o],upgrades:a}});v={trash:l,learnMore:!0,shop:a}}else if(1===l)v={learnMore:!0,shop:[{effect:"5% Loot (".concat(null==e?void 0:null===(n=e.accountOptions)||void 0===n?void 0:n[166],")"),cost:Math.round(10*Math.pow(1.5,null==e?void 0:null===(a=e.accountOptions)||void 0===a?void 0:a[166]))},{effect:"3% Double boss (".concat(null==e?void 0:null===(s=e.accountOptions)||void 0===s?void 0:s[167],")"),cost:Math.round(6*Math.pow(1.4,null==e?void 0:null===(r=e.accountOptions)||void 0===r?void 0:r[167]))},{effect:"Star book",cost:200}]};else if(4===l){let l=null==e?void 0:null===(u=e.accountOptions)||void 0===u?void 0:u[183],o=(0,m.notateNumber)(null==e?void 0:null===(d=e.accountOptions)||void 0===d?void 0:d[172]),t=null==e?void 0:null===(c=e.accountOptions)||void 0===c?void 0:c[173],i=null==Y?void 0:Y.map((l,o)=>{var t,i;let{effect:n,divider:a}=l,s=null==e?void 0:null===(t=e.accountOptions)||void 0===t?void 0:t[174+o];return{effect:null===(i=null==n?void 0:n.replace("{",s))||void 0===i?void 0:i.replace(","," "),bonus:s,cost:1+Math.floor(s/a)}});v={shop:i,currentTrial:Q[l],bestDpsEver:o,shimmerCurrency:t,learnMore:!0}}else if(5===l){let l=null==e?void 0:null===(_=e.accountOptions)||void 0===_?void 0:_[184];v={hoursAfk:l,shop:J,learnMore:!0}}return v},el=(e,l,o,t,i)=>{let n,a;try{console.info("%cStart Parsing","color:orange"),(null==e?void 0:e.PlayerDATABASE)&&(l=Object.keys(null==e?void 0:e.PlayerDATABASE),a=Object.values(null==e?void 0:e.PlayerDATABASE).reduce((e,l,o)=>{var t;return{...e,...null===(t=Object.entries(l))||void 0===t?void 0:t.reduce((e,l)=>{let[t,i]=l;return{...e,["".concat(t,"_").concat(o)]:i}},{})}},{}),e={...e,...a});let s=eo(e,l,o,t,i);return n=null==s?void 0:s.accountData,a=null==s?void 0:s.charactersData,console.info("data",{account:n,characters:a}),console.info("%cParsed successfully","color: green"),{account:n,characters:a}}catch(e){console.error("Error while parsing data",e),void 0!==window.gtag&&window.gtag("event","error",{event_category:"error",event_label:"engagement",value:JSON.stringify(e)})}},eo=(e,l,o,u,d)=>{var _,v,p,T,M,A,Q,Y,J,ee,el,eo,et,ei;let en={},ea,es=(0,t.ql)(e,l);en.companions=(0,N.Rf)(o),en.bundles=(0,N.kU)(e),en.serverVars=d,en.accountOptions=(null==e?void 0:e.OptionsListAccount)||(0,m.tryToParse)(null==e?void 0:e.OptLacc),en.bribes=(0,b.t)(e),en.timeAway=(0,m.tryToParse)(null==e?void 0:e.TimeAway)||(null==e?void 0:e.TimeAway),en.alchemy=(0,g.p4)(e),en.equippedBubbles=(0,g.Tw)(e,null===(_=en.alchemy)||void 0===_?void 0:_.bubbles,es),en.storage=(0,y.cF)(e),en.saltLick=(0,E.U)(e,en.storage),en.dungeons=(0,F.MR)(e,en.accountOptions),en.prayers=(0,S.hn)(e,en.storage),en.cards=(0,i.vm)(e,en),en.gemShopPurchases=h(e),en.guild=(0,x.Sk)(e,u),en.currencies=(0,N.DE)(e,en),en.stamps=(0,a.t2)(e),en.obols=(0,n.dR)(e),en.looty=(0,N.NQ)(e),en.tasks=B(e),en.breeding=(0,q.N5)(e,en),en.cooking=(0,I.Tt)(e,en,es),en.divinity=(0,j.y0)(e,es),en.postOfficeShipments=(0,X.NU)(e),en.lab=(0,L.Cs)(e,es,en),en.shrines=(0,r.Xz)(e,en),en.towers=(0,P.d4)(e,en),en.statues=(0,s.Xl)(e,es),en.achievements=(0,O.j)(e),en.lab.connectedPlayers=null===(v=en.lab.connectedPlayers)||void 0===v?void 0:v.map(e=>{var l,o;return{...e,isDivinityConnected:(null==en?void 0:null===(l=en.divinity)||void 0===l?void 0:null===(o=l.linkedDeities)||void 0===o?void 0:o[null==e?void 0:e.playerId])===4||(0,L.p8)(e,4)}}),en.rift=(0,z.w)(e),en.arcade=(0,D.z)(e,en,d);let er=(0,L.c9)(en.lab.labBonuses,7);en.stamps=(0,a.Md)(en.stamps,er);let eu=(0,L.c9)(en.lab.labBonuses,10);if(en.alchemy.vials=(0,g.nm)(en.alchemy.vials,eu),(0,z.R)(en.rift,"Vial_Mastery")){let e=null==en?void 0:null===(et=en.alchemy)||void 0===et?void 0:null===(ei=et.vials)||void 0===ei?void 0:ei.filter(e=>{let{level:l}=e;return 13===l}),l=1+2*(null==e?void 0:e.length)/100;en.alchemy.vials=(0,g.nm)(en.alchemy.vials,eu*l)}let ed=(0,L.c9)(en.lab.labBonuses,8),ec=(0,L.pc)(en.lab.jewels,16,ed);en.cooking.meals=(0,I.wR)(en.cooking.meals,ec);let e_=null==es?void 0:es.map(e=>{var l,o,t;let i=null==e?void 0:e.PersonalValuesMap;return{level:null!==(o=null==i?void 0:null===(l=i.StatList)||void 0===l?void 0:l[4])&&void 0!==o?o:0,class:null!==(t=null===w.classes||void 0===w.classes?void 0:w.classes[null==e?void 0:e.CharacterClass])&&void 0!==t?t:""}});en.starSigns=(0,k.kz)(e),en.constellations=(0,k.tp)(e),en.charactersLevels=e_,ea=es.map(l=>(0,t.SD)(l,e_,{...en},e)),en.lab=(0,L.Cs)(e,es,en,ea),p=[1,2,3,4,5],en.finishedWorlds=void 0===p?void 0:p.reduce((e,l)=>({...e,["World".concat(l)]:(0,Z.jZ)(ea,l)}),{}),en.statues=(0,s.hE)(en.statues,ea);let ev=null==ea?void 0:ea.map(e=>{let{name:l,skillsInfo:o}=e;return{name:l,skillsInfo:o}});en.totalSkillsLevels=(0,N.B4)(ev),en.construction=(0,P.VR)(e,en),en.atoms=(0,V.nK)(e,en);let em=(0,H.yN)(e,ea,en);en.alchemy.p2w.sigils=(0,g.RG)(en.alchemy.p2w.sigils,em),en.alchemy.liquidCauldrons=(0,g.jd)(en),en.gaming=(0,K.gm)(e,ea,en,d),en.sailing=(0,H.x0)(e,em,ea,en,d,e_);let eh=(0,N.tS)(ev);ea=ea.map(e=>({...e,skillsInfo:eh[null==e?void 0:e.name]})),en.highscores=c(e),en.shopStock=(0,f.u6)(e),en.forge=C(e,en),en.refinery=(0,G.w)(e,en.storage,en.tasks),en.printer=(0,U.h)(e,ea,en),en.traps=(0,R.a)(es),en.quests=(0,Z.zz)(ea),en.islands=$(en),en.deathNote=(0,W.WA)(ea,en),en.anvil=ea.map(e=>{let{anvil:l}=e;return l});let ep=parseFloat(null==e?void 0:e.MoneyBANK),ef=null==ea?void 0:ea.reduce((e,l)=>e+parseFloat(null==l?void 0:l.money),0),eg=ep+ef;en.currencies.rawMoney=eg,en.currencies.money=(0,m.getCoinsArray)(eg),en.currencies.gems=null==e?void 0:e.GemsOwned,en.currencies.KeysAll=(0,N.Ix)(null==en?void 0:null===(T=en.currencies)||void 0===T?void 0:T.KeysAll,ea,en),en.currencies.ColosseumTickets=(0,N.cg)(null==en?void 0:null===(M=en.currencies)||void 0===M?void 0:M.ColosseumTickets,ea,en),en.cooking.kitchens=(0,I.vu)(e,ea,en),en.libraryTimes=(0,N.W9)(e,ea,en),ea=null==ea?void 0:ea.map(e=>{let{carryCapBags:l}=e;return e.carryCapBags=null==l?void 0:l.map(l=>{let o=(0,N.HA)(null==l?void 0:l.Class),t=(0,N.z3)(o,e,en);return{...l,capacityPerSlot:t,maxCapacity:t*(null==e?void 0:e.inventorySlots)}}),e});let ey=Math.floor((null==en?void 0:null===(A=en.deathNote)||void 0===A?void 0:null===(Q=A[0])||void 0===Q?void 0:null===(Y=Q.mobs)||void 0===Y?void 0:Y[0].kills)/1e6),eb=(null===(J=en.lab.labBonuses)||void 0===J?void 0:null===(ee=J[13])||void 0===ee?void 0:ee.active)?1.5*ey:0,ek=ey*(null===(el=en.lab.labBonuses)||void 0===el?void 0:null===(eo=el[9])||void 0===eo?void 0:eo.bonusOn);return en.lab.labBonuses=(0,L.ww)(en.lab.labBonuses,ek+eb,9),{accountData:en,charactersData:ea}}},2183:function(e,l,o){o.d(l,{a:function(){return i},q:function(){return a}});var t=o(72032);let i=e=>n(e),n=e=>e.map(e=>{let l=(null==e?void 0:e.PldTraps)||[];return l.reduce((e,l)=>{var o;let[i,,n,a,s,r,u]=l;if(-1===i||"-1"===i)return e;let d=t.traps[r].find(e=>e.trapTime===u),c=u-n;return a?[...e,{name:null===(o=t.items[a])||void 0===o?void 0:o.displayName,rawName:a,crittersQuantity:s,trapType:r,timeLeft:new Date().getTime()+1e3*c,trapData:d}]:e},[])}),a=e=>null==e?void 0:e.reduce((e,l)=>(l.reduce((l,o)=>{var t;let{crittersQuantity:i,rawName:n}=o;e={...e,[n]:(null!==(t=null==e?void 0:e[n])&&void 0!==t?t:0)+i}},{}),e),{})}}]);