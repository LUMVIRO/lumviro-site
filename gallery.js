'use strict';
// Progressive enhancement: all seven original links remain usable without JS.
(() => {
  const grid = document.querySelector('.life-grid');
  if (!grid) return;
  const cards = [...grid.children];
  const groups = [
    {name:'Stand out', cards:[0,1,2], kicker:'MAKE YOUR MOMENT', descriptions:[
      'A bright hello above the crowd. Help your friends spot you at a concert or a night out.',
      'Your team. Your colors. Put your support on screen and join the celebration.',
      'Give a birthday wish its own spotlight. A few words can make their moment brighter.']},
    {name:'Have fun', cards:[3,5], kicker:'BRING THE ENERGY', descriptions:[
      'Add red and blue lights to a friendly indoor prank. Entertainment effects, not emergency signals.',
      'Pair your banner with a voice recording and play it back. Give your message a voice of its own.']},
    {name:'Stay in touch', cards:[4,6], kicker:'SAY IT YOUR WAY', descriptions:[
      'Stepping away for a moment? Leave a visible note on your screen. Keep your phone somewhere safe.',
      'Make a greeting move, then share it as a GIF through your favorite apps. GIF exports are silent.']}
  ];
  let group = 0, current = 0, touchStart = null, swiped = false;
  const shell = document.createElement('div'); shell.className='story-browser';
  shell.innerHTML='<div class="story-tabs" role="group" aria-label="Choose a scenario"></div><div class="story-stage"><div class="story-art"></div><div class="story-copy"><span class="eyebrow story-kicker"></span><h3 id="story-title"></h3><p class="story-description"></p><div class="story-nav"><button type="button" class="story-prev" aria-label="Previous card">←</button><span class="story-count" aria-live="polite" aria-atomic="true"></span><button type="button" class="story-next" aria-label="Next card">→</button></div><div class="story-thumbs" role="group" aria-label="Choose a card"></div><p class="story-hint">Tap the image to take a closer look.</p></div></div>';
  grid.before(shell);
  const art=shell.querySelector('.story-art'), tabs=shell.querySelector('.story-tabs'), thumbs=shell.querySelector('.story-thumbs');
  art.append(grid);
  grid.setAttribute('aria-label','Scenario cards');
  cards.forEach(card=>{card.hidden=true;});
  groups.forEach((g,index)=>{
    const button=document.createElement('button'); button.type='button';button.textContent=g.name;button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>{group=index;current=0;buildThumbs();render();});tabs.append(button);
  });
  function buildThumbs(){
    thumbs.replaceChildren();
    groups[group].cards.forEach((index,position)=>{
      const source=cards[index].querySelector('img'), button=document.createElement('button');
      button.type='button';button.setAttribute('aria-label',cards[index].querySelector('a').dataset.title);
      const image=document.createElement('img');image.src=source.src;image.alt='';image.width=48;image.height=85;
      button.append(image);button.addEventListener('click',()=>{current=position;render();});thumbs.append(button);
    });
  }
  function render(){
    const g=groups[group], index=g.cards[current];
    cards.forEach((card,i)=>{card.hidden=i!==index;});
    const selected=cards[index]; selected.querySelector('img').loading='eager';
    shell.querySelector('#story-title').textContent=selected.querySelector('a').dataset.title;
    shell.querySelector('.story-kicker').textContent=g.kicker;
    shell.querySelector('.story-description').textContent=g.descriptions[current];
    shell.querySelector('.story-count').textContent=`${current+1} / ${g.cards.length}`;
    [...tabs.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===group)));
    [...thumbs.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===current)));
  }
  function move(delta){current=(current+delta+groups[group].cards.length)%groups[group].cards.length;render();}
  shell.querySelector('.story-prev').addEventListener('click',()=>move(-1));
  shell.querySelector('.story-next').addEventListener('click',()=>move(1));
  shell.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){if(tabs.contains(e.target))return;e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}});
  art.addEventListener('touchstart',e=>{touchStart=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;swiped=false;},{passive:true});
  art.addEventListener('touchend',e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5){swiped=true;move(dx<0?1:-1);}},{passive:true});
  art.addEventListener('touchcancel',()=>{touchStart=null;},{passive:true});
  art.addEventListener('click',e=>{if(swiped){e.preventDefault();e.stopPropagation();swiped=false;}},true);
  buildThumbs();render();
})();
