import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDocument } from '../src/shared/catalog';
import { inspectDesign } from '../src/shared/design-checks';

test('preflight locates actionable text/media/crop issues without changing the document', () => {
  const doc = createDocument('web','Preflight');
  doc.pages[0].background = '#ffffff';
  doc.pages[0].nodes = [
    {id:'title',name:'Title',type:'text',x:0,y:0,width:100,height:10,text:'A long heading that needs much more space',style:{fontSize:24,fill:'#ffffff'}},
    {id:'photo',name:'Photo',type:'image',position:'absolute',x:-1,y:0,width:100,height:100},
    {id:'remote',name:'Remote',type:'video',x:0,y:0,width:100,height:100,src:'https://example.org/video.mp4'},
    {id:'hidden',name:'Hidden',type:'text',x:0,y:0,width:0,height:0,visible:false},
  ];
  const before=JSON.stringify(doc), result=inspectDesign(doc);
  assert.equal(JSON.stringify(doc),before);
  assert.ok(result.issues.some(issue=>issue.nodeId==='title'&&issue.code==='text-overflow'));
  assert.ok(result.issues.some(issue=>issue.nodeId==='title'&&issue.code==='text-contrast'));
  assert.ok(result.issues.some(issue=>issue.nodeId==='photo'&&issue.code==='missing-media'));
  assert.ok(result.issues.some(issue=>issue.nodeId==='photo'&&issue.code==='outside-page'));
  assert.ok(result.issues.some(issue=>issue.nodeId==='remote'&&issue.code==='remote-media'));
  assert.ok(result.issues.every(issue=>issue.nodeId!=='hidden'));
  assert.equal(result.counts.total,result.issues.length);
});

test('preflight uses declared parent color and bounds output for large documents', () => {
  const doc=createDocument('slides','Readable');
  doc.pages[0].background='#000000';
  doc.pages[0].nodes=[
    {id:'panel',name:'Panel',type:'frame',x:0,y:0,width:500,height:300,style:{fill:'#fff'}},
    {id:'body',name:'Body',type:'text',parentId:'panel',x:10,y:10,width:400,height:80,text:'Readable copy',style:{fontSize:24,fill:'#000'}},
  ];
  assert.equal(inspectDesign(doc).issues.filter(issue=>issue.code==='text-contrast').length,0);
  doc.pages[0].nodes=Array.from({length:500},(_,i)=>({id:`n${i}`,name:'Empty',type:'image' as const,x:0,y:0,width:0,height:0}));
  const result=inspectDesign(doc);
  assert.equal(result.issues.length,200);
  assert.equal(result.counts.total,1000);
  assert.equal(result.truncated,true);
});

test('preflight reports text collisions from rendered boxes, not nested layers or slight touches', () => {
  const doc = createDocument('slides', 'Collide');
  doc.pages[0].nodes = [
    {id:'a',name:'Headline',type:'text',x:100,y:100,width:400,height:40,text:'Headline',style:{fontSize:32}},
    {id:'b',name:'Body',type:'text',x:100,y:120,width:400,height:40,text:'Body copy under the headline',style:{fontSize:20}},
    {id:'c',name:'Aside',type:'text',x:480,y:100,width:200,height:40,text:'Aside',style:{fontSize:20}},
    {id:'wrap',name:'Wrap',type:'frame',x:100,y:400,width:400,height:200,style:{fill:'#fff'}},
    {id:'child',name:'Child',type:'text',parentId:'wrap',x:100,y:400,width:400,height:200,text:'Nested copy',style:{fontSize:20,fill:'#000'}},
    {id:'sibling',name:'Sibling',type:'text',x:100,y:700,width:400,height:20,text:'A very long line that wraps to several lines when squeezed into a narrow width for the test',style:{fontSize:20}},
    {id:'below',name:'Below',type:'text',x:100,y:730,width:400,height:20,text:'Struck by the overflow above',style:{fontSize:20}},
  ];
  const collisions = inspectDesign(doc).issues.filter(issue => issue.code === 'text-collision');
  assert.deepEqual(collisions.map(issue => issue.nodeId).sort(), ['b', 'below']);
  assert.match(collisions.find(issue => issue.nodeId === 'b')!.message, /"Headline"/);
  assert.match(collisions.find(issue => issue.nodeId === 'below')!.message, /"Sibling"/);
});

test('preflight flags text that spills past the card beneath it', () => {
  const doc = createDocument('slides', 'Spill');
  doc.pages[0].nodes = [
    {id:'card',name:'Card',type:'shape',x:100,y:100,width:300,height:100,style:{fill:'#ffffff'}},
    {id:'inside',name:'Inside',type:'text',x:120,y:120,width:260,height:20,text:'Fits',style:{fontSize:20,fill:'#000'}},
    {id:'long',name:'Long',type:'text',x:120,y:150,width:260,height:20,text:'This copy keeps going and going and going until it wraps far below the card bottom edge',style:{fontSize:20,fill:'#000'}},
    {id:'free',name:'Free',type:'text',x:100,y:400,width:100,height:20,text:'Nothing underneath so nothing to spill out of even when it wraps a lot',style:{fontSize:20}},
    {id:'panel',name:'Panel',type:'frame',x:100,y:600,width:300,height:120,layout:{mode:'flex',direction:'column',padding:16},style:{fill:'#ffffff'}},
    {id:'flow',name:'Flow',type:'text',parentId:'panel',x:0,y:0,width:268,height:20,text:'Laid out by the frame with copy that is far too long for the frame height it was given',style:{fontSize:24,fill:'#000'}},
  ];
  const spills = inspectDesign(doc).issues.filter(issue => issue.code === 'text-spills-container');
  assert.deepEqual(spills.map(issue => issue.nodeId).sort(), ['flow', 'long']);
  assert.match(spills.find(issue => issue.nodeId === 'long')!.message, /bottom edge of "Card"/);
  assert.match(spills.find(issue => issue.nodeId === 'flow')!.message, /"Panel"/);
});

test('preflight measures contrast against the topmost opaque layer under the text', () => {
  const doc = createDocument('slides', 'Backdrop');
  doc.pages[0].background = '#000000';
  doc.pages[0].nodes = [
    {id:'card',name:'Card',type:'shape',x:100,y:100,width:400,height:200,style:{fill:'#ffffff'}},
    {id:'dark',name:'Dark on card',type:'text',x:120,y:120,width:200,height:30,text:'Readable',style:{fontSize:24,fill:'#000000'}},
    {id:'light',name:'Light on card',type:'text',x:120,y:200,width:200,height:30,text:'Invisible',style:{fontSize:24,fill:'#ffffff'}},
    {id:'ghost',name:'Ghost',type:'shape',x:100,y:400,width:400,height:100,opacity:0.3,style:{fill:'#ffffff'}},
    {id:'over-ghost',name:'Over ghost',type:'text',x:120,y:420,width:200,height:30,text:'Still on black',style:{fontSize:24,fill:'#ffffff'}},
    {id:'panel',name:'Panel',type:'frame',x:100,y:600,width:400,height:120,layout:{mode:'flex',direction:'row',padding:20},style:{fill:'#ffffff'}},
    {id:'flow',name:'Flow',type:'text',parentId:'panel',x:0,y:0,width:200,height:30,text:'Laid out',style:{fontSize:24,fill:'#ffffff'}},
  ];
  const contrast = inspectDesign(doc).issues.filter(issue => issue.code === 'text-contrast');
  assert.deepEqual(contrast.map(issue => issue.nodeId).sort(), ['flow', 'light']);
  assert.match(contrast.find(issue => issue.nodeId === 'light')!.message, /against "Card"/);
  assert.match(contrast.find(issue => issue.nodeId === 'flow')!.message, /against "Panel"/);
});

test('preflight notes content crowding the page edge on page-based kinds only', () => {
  const doc = createDocument('slides', 'Edges');
  const page = doc.pages[0];
  page.nodes = [
    {id:'tight',name:'Tight',type:'text',x:4,y:200,width:300,height:30,text:'Hugging the left edge',style:{fontSize:20}},
    {id:'bleed',name:'Bleed',type:'image',x:0,y:0,width:page.width,height:page.height,src:'/api/assets/hero.png'},
    {id:'safe',name:'Safe',type:'text',x:page.width*0.1,y:page.height*0.1,width:300,height:30,text:'Inside the margin',style:{fontSize:20}},
    {id:'backdrop',name:'Backdrop',type:'shape',x:0,y:0,width:page.width,height:120,style:{fill:'#eeeeee'}},
  ];
  const crowded = inspectDesign(doc).issues.filter(issue => issue.code === 'crowded-edge');
  assert.deepEqual(crowded.map(issue => [issue.nodeId, issue.severity]), [['tight', 'info']]);
  doc.kind = 'wireframe';
  assert.equal(inspectDesign(doc).issues.filter(issue => issue.code === 'crowded-edge').length, 0);
});
