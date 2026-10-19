/** P05.4 rules extracted from ../index.html. No terrain or facing combat modifiers. */
export type Side='ally'|'enemy'|'guest';
export type Mission='wipe'|'capture'|'escort';
export type Pos={x:number;y:number};
export type Tile=Pos & {h:number;walk:boolean;type:string};
export type Unit=Pos & {id:number;name:string;side:Side;hp:number;max:number;atk:number;def:number;move:number;rmin:number;rmax:number;speed:number;done:boolean;moved:boolean;level:number;exp:number};
export const key=(p:Pos)=>`${p.x},${p.y}`;
export const dist=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
const growth:Record<string,{hp:number;atk:number|number[];def:number|number[];speed:number|number[]}>= {
 'リリア':{hp:2,atk:1,def:[0,1],speed:[0,0,1]},
 'セレス':{hp:3,atk:[0,1],def:1,speed:[0,0,1]},
 'フィオナ':{hp:2,atk:1,def:[0,0,1],speed:[0,1]},
 'ミレイユ':{hp:2,atk:1,def:[0,0,1],speed:[0,0,1]}
};
export class Battle {
 readonly width=8;readonly height=10;
 tiles:Tile[]=[];units:Unit[]=[];phase:Side='ally';round=1;result:''|'win'|'lose'='';log:string[]=[];objective:Pos;
 private moveUndo:{unit:Unit;from:Pos;wasMoved:boolean}|undefined;
 constructor(public mission:Mission='wipe'){
 this.objective=mission==='capture'?{x:4,y:1}:{x:4,y:3};
 for(let y=0;y<10;y++)for(let x=0;x<8;x++){
 let h=0,walk=true,type='grass';if(y<=2&&x>=2&&x<=6)h=1;if(y<=1&&x>=4&&x<=5)h=2;if(y>=7&&x<=2)h=1;if(y>=8&&x===0)h=2;
 if(y===4&&x!==3&&x!==4){walk=false;type='water'}if(y===4&&walk)type='bridge';if(x===7&&y===8||x===0&&y===1){walk=false;type='rock'}if((y===3&&x<=2)||(y===5&&x===2)){walk=false;type='water'}if((x===0&&y>=8)||(x===1&&y===9)){walk=false;type='rock'}this.tiles.push({x,y,h,walk,type});}
 const add=(name:string,side:Side,x:number,y:number,hp:number,atk:number,def:number,move:number,rmin:number,rmax:number,speed:number)=>this.units.push({id:this.units.length,name,side,x,y,hp,max:hp,atk,def,move,rmin,rmax,speed,done:false,moved:false,level:1,exp:0});
 add('リリア','ally',3,6,30,10,3,3,1,1,12);add('セレス','ally',5,6,36,7,5,2,1,1,8);add('フィオナ','ally',1,7,22,8,2,3,2,3,14);add('ミレイユ','ally',4,8,22,9,1,3,1,2,10);
 add('敵剣士','enemy',3,2,22,7,2,3,1,1,10);add('敵弓兵','enemy',5,2,17,6,1,2,2,3,8);add('敵騎士','enemy',4,0,26,8,3,2,1,1,6);
 if(mission==='escort')add('使節','guest',3,8,24,0,2,1,0,0,5);
 }
 tile(p:Pos){return this.tiles[p.y*this.width+p.x]}
 occupied(p:Pos){return this.units.find(u=>u.hp>0&&u.x===p.x&&u.y===p.y)}
 living(side:Side){return this.units.filter(u=>u.hp>0&&u.side===side)}
 get active(){return this.living('ally').filter(u=>!u.done).sort((a,b)=>b.speed-a.speed||a.id-b.id)[0]}
 get undoableMoveUnit(){return this.moveUndo?.unit}
 canUndoMove(a:Unit){const move=this.moveUndo;return !!move&&move.unit===a&&this.canAct(a)&&a.moved&&!this.occupied(move.from)}
 undoMove(a:Unit){if(!this.canUndoMove(a))return false;const move=this.moveUndo!;a.x=move.from.x;a.y=move.from.y;a.moved=move.wasMoved;this.moveUndo=undefined;return true}
 say(s:string){this.log.push(s);if(this.log.length>30)this.log.shift()}
 moveRange(a:Unit){
 const q=[{x:a.x,y:a.y,c:0}],out=new Map([[key(a),0]]),paths=new Map<string,string>();
 for(let i=0;i<q.length;i++){const {x,y,c}=q[i];for(const [dx,dy] of dirs){const p={x:x+dx,y:y+dy},reservation=this.moveUndo&&this.moveUndo.unit!==a&&key(this.moveUndo.from)===key(p);
 if(p.x<0||p.y<0||p.x>=8||p.y>=10||!this.tile(p).walk||this.occupied(p)||reservation||Math.abs(this.tile(p).h-this.tile({x,y}).h)>1||c+1>a.move)continue;
 if((out.get(key(p))??99)<=c+1)continue;out.set(key(p),c+1);paths.set(key(p),key({x,y}));q.push({...p,c:c+1});}}
 return {out,paths};
 }
 path(a:Unit,to:Pos){const {paths,out}=this.moveRange(a);if(!out.has(key(to)))return [];const result=[to];let k=key(to);while(paths.has(k)){k=paths.get(k)!;const [x,y]=k.split(',').map(Number);result.unshift({x,y})}return result}
 targets(a:Unit,pos:Pos=a){return new Set(this.tiles.filter(t=>t.walk&&dist(pos,t)>=a.rmin&&dist(pos,t)<=a.rmax).map(key))}
 threats(a:Unit){const result=new Set<string>();for(const k of this.moveRange(a).out.keys()){const [x,y]=k.split(',').map(Number);for(const t of this.targets(a,{x,y}))result.add(t)}return result}
 canAct(a:Unit){return !this.result&&this.phase==='ally'&&this.active===a&&a.hp>0&&!a.done}
 move(a:Unit,to:Pos){if(!this.canAct(a)||a.moved||this.occupied(to)||!this.moveRange(a).out.has(key(to)))return false;this.moveUndo={unit:a,from:{x:a.x,y:a.y},wasMoved:a.moved};a.x=to.x;a.y=to.y;a.moved=true;this.say(`${a.name}が移動しました。`);this.check();return true}
 earnExp(a:Unit,amount:number){if(a.side!=='ally'||a.hp<=0)return;a.exp+=amount;while(a.exp>=100){a.exp-=100;a.level++;const g=growth[a.name]||{hp:2,atk:1,def:0,speed:0};const step=(v:number|number[])=>Array.isArray(v)?v[(a.level-2)%v.length]:v;const dh=step(g.hp);a.hp+=dh;a.max+=dh;a.atk+=step(g.atk);a.def+=step(g.def);a.speed+=step(g.speed);this.say(`${a.name} Lv.${a.level} に成長！`)}}
 damage(a:Unit,b:Unit){return Math.max(1,a.atk-b.def)}
 fight(a:Unit,b:Unit){const damage=this.damage(a,b);b.hp=Math.max(0,b.hp-damage);this.say(`${a.name} → ${b.name}  ${damage}ダメージ${b.hp===0?'・撃破':''}`);if(a.side==='ally'&&b.side==='enemy')this.earnExp(a,b.hp===0?30:10);this.check();return damage}
 attack(a:Unit,b:Unit){if(!this.canAct(a)||b.side!=='enemy'||b.hp<=0||!this.targets(a).has(key(b)))return false;this.fight(a,b);a.done=true;this.moveUndo=undefined;return true}
 wait(a:Unit){if(!this.canAct(a))return false;a.done=true;this.moveUndo=undefined;this.say(`${a.name}は待機。`);return true}
 check(){if(this.result)return;if(this.units[0].hp<=0){this.result='lose';return}if(this.mission==='escort'){const g=this.living('guest')[0];if(!g){this.result='lose';return}if(key(g)===key(this.objective))this.result='win'}if(this.mission==='capture'&&key(this.units[0])===key(this.objective))this.result='win';if(!this.living('enemy').length)this.result='win'}
 enemyAction(e:Unit){
 const allies=this.units.filter(u=>u.hp>0&&(u.side==='ally'||u.side==='guest'));if(!allies.length)return;
 const reachable=[...this.moveRange(e).out.keys()].map(k=>{const [x,y]=k.split(',').map(Number);return{x,y}});
 let best:{pos:Pos;target:Unit;score:number}|null=null;
 for(const pos of reachable)for(const target of allies.filter(a=>dist(pos,a)>=e.rmin&&dist(pos,a)<=e.rmax)){
 const damage=this.damage(e,target),finishes=damage>=target.hp;
 const danger=this.living('ally').reduce((n,a)=>n+(dist(pos,a)>=a.rmin&&dist(pos,a)<=a.rmax?this.damage(a,e):0),0);
 const score=105+Math.min(damage,target.hp)*5+(finishes?38:0)+(target.name==='リリア'?7:0)-Math.min(18,danger*.55)-Math.max(0,target.hp-damage)*.15-dist(pos,e)*.1;
 if(!best||score>best.score)best={pos,target,score};}
 if(best){e.x=best.pos.x;e.y=best.pos.y;const amount=this.fight(e,best.target);return {target:best.target,amount}}
 let choice:{pos:Pos;score:number}|null=null;
 for(const pos of reachable){const distance=Math.min(...allies.map(a=>{const d=dist(pos,a);return d<e.rmin?e.rmin-d:Math.max(0,d-e.rmax)}));const danger=allies.reduce((n,a)=>n+(dist(pos,a)>=a.rmin&&dist(pos,a)<=a.rmax?1:0),0);const score=-distance*20-danger*2-dist(pos,e)*.03;if(!choice||score>choice.score)choice={pos,score}}
 if(choice){e.x=choice.pos.x;e.y=choice.pos.y}
 }
 beginEnemy(){if(this.result||this.active)return false;this.moveUndo=undefined;this.phase='enemy';return true}
 finishEnemy(){if(this.result)return;if(this.mission==='escort'){const guest=this.living('guest')[0];if(guest){const candidates=[...this.moveRange(guest).out.keys()].map(k=>{const [x,y]=k.split(',').map(Number);return{x,y}}).sort((a,b)=>dist(a,this.objective)-dist(b,this.objective));if(candidates[0]&&dist(candidates[0],this.objective)<dist(guest,this.objective)){guest.x=candidates[0].x;guest.y=candidates[0].y}this.check()}}
 if(this.result)return;this.round++;this.phase='ally';this.units.forEach(u=>{u.done=false;u.moved=false});}
}
